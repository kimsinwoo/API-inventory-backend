// scripts/scan-routes.js
const { Project, Node } = require("ts-morph");
const fg = require("fast-glob");
const { writeFileSync } = require("node:fs");
const { resolve } = require("node:path");

// 타입스크립트 type/interface들을 JS 객체 구조설명으로 대체
// HttpMethod: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

const project = new Project({
  skipAddingFilesFromTsConfig: true,
  skipFileDependencyResolution: true,
  compilerOptions: {
    target: 99,
    module: 99,
    allowJs: true,
    checkJs: false,
    skipLibCheck: true,
  },
});

async function main() {
  // TS/JS 전부 스캔
  const files = await fg([
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.js",
    "src/**/*.jsx",
    "routes/**/*.ts",
    "routes/**/*.js",
  ], { dot: false });

  for (const f of files) project.addSourceFileAtPathIfExists(f);

  const endpoints = [];

  project.getSourceFiles().forEach((sf) => {
    sf.forEachDescendant((node) => {
      if (Node.isCallExpression(node)) {
        const ce = node;
        const callee = ce.getExpression();

        // router.METHOD("path", ...)
        if (Node.isPropertyAccessExpression(callee)) {
          const obj = callee.getExpression().getText();
          const meth = callee.getName().toUpperCase();
          const isRouterCall =
            (obj === "router" || obj.endsWith(".router") || obj.endsWith("Router")) &&
            ["GET","POST","PUT","PATCH","DELETE"].includes(meth);

          if (isRouterCall) {
            const args = ce.getArguments();
            const firstArg = args[0];

            if (firstArg && Node.isStringLiteral(firstArg)) {
              const path = firstArg.getLiteralText();
              const method = meth;

              const bodySpec = extractBodyZodSpec(args.slice(1));
              endpoints.push(Object.assign({
                method,
                path,
                file: sf.getFilePath(),
                line: sf.getLineAndColumnAtPos(node.getStart()).line,
              }, bodySpec ? { body: bodySpec } : {}));
            }
          }
        }
      }
    });
  });

  // 정렬: path -> method
  endpoints.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

  writeFileSync("endpoints-with-schemas.json", JSON.stringify(endpoints, null, 2), { encoding: "utf8" });
  // 보기 편하라고 Markdown도 함께
  writeFileSync("endpoints-with-schemas.md", toMarkdown(endpoints), { encoding: "utf8" });

  // 요약 출력
  console.log(`Found ${endpoints.length} endpoints.`);
  console.log(`Wrote endpoints-with-schemas.json and endpoints-with-schemas.md`);
}

function extractBodyZodSpec(middlewares) {
  // 미들웨어들 안에서 z.object(...)를 가진 인자를 찾아낸다.
  // 흔한 패턴:
  //  - validate({ body: z.object({ ... }) })
  //  - validate({ body: CreateShipmentBody })
  //  - controller 레벨에서 바로 z.object(...)를 넘기는 경우
  for (const m of middlewares) {
    const found = findZodBodyInNode(m);
    if (found) return found;
  }
  return undefined;
}

function findZodBodyInNode(n) {
  // validate({...}) 같은 call 내부 파고들기
  if (Node.isCallExpression(n)) {
    for (const a of n.getArguments()) {
      const sub = findZodBodyInNode(a);
      if (sub) return sub;
    }
  }

  // 객체 리터럴 { body: z.object({...}) | body: SomeSchema }
  if (Node.isObjectLiteralExpression(n)) {
    const bodyProp = n.getProperty("body");
    if (bodyProp && Node.isPropertyAssignment(bodyProp)) {
      const init = bodyProp.getInitializer();
      if (!init) return { kind: "unknown", note: "body has no initializer" };

      // body: z.object({...})
      const inline = tryParseInlineZodObject(init);
      if (inline) return inline;

      // body: SomeSchema
      if (Node.isIdentifier(init)) {
        return { kind: "zod-var", refName: init.getText() };
      }

      // body: z.array(z.object({...})) 등
      const complex = tryParseComplexZod(init);
      if (complex) return complex;

      return { kind: "unknown", note: `body initializer = ${init.getKindName()}` };
    }
  }

  // z.object({...})가 인자 전체로 바로 들어온 경우
  const inline = tryParseInlineZodObject(n);
  if (inline) return inline;

  // z.array(z.object({...})) 등
  const complex = tryParseComplexZod(n);
  if (complex) return complex;

  return undefined;
}

function tryParseInlineZodObject(node) {
  // z.object({ ... })
  if (!Node.isCallExpression(node)) return undefined;
  const callee = node.getExpression().getText();
  if (!callee.startsWith("z.object")) return undefined;
  const arg = node.getArguments()[0];
  if (!arg || !Node.isObjectLiteralExpression(arg)) {
    return { kind: "zod-inline", fields: [], note: "object arg missing or not an object" };
  }
  const fields = [];

  arg.getProperties().forEach((p) => {
    if (!Node.isPropertyAssignment(p)) return;
    const key = p.getNameNode().getText().replace(/^["'`](.*)["'`]$/, "$1");
    const init = p.getInitializer();
    if (!init) return;
    const info = summarizeZodType(init);
    fields.push({ name: key, type: info.type, optional: info.optional });
  });

  return { kind: "zod-inline", fields };
}

function tryParseComplexZod(node) {
  if (!Node.isCallExpression(node)) return undefined;
  const text = node.getExpression().getText();
  if (text.startsWith("z.array")) {
    // z.array(z.object({...})) → 대략적 요약
    const inner = node.getArguments()[0];
    if (inner) {
      const inline = tryParseInlineZodObject(inner);
      if (inline && inline.fields) {
        return { kind: "zod-inline", fields: [{ name: "$root", type: "array<object>", optional: false }].concat(inline.fields) };
      }
      if (Node.isIdentifier(inner)) {
        return { kind: "zod-var", refName: inner.getText() };
      }
    }
    return { kind: "unknown", note: "z.array(...) but inner unresolved" };
  }
  return undefined;
}

function summarizeZodType(node) {
  // 간단한 체인 해석: z.string().min(1).optional() / z.number().int() / z.enum([...]) / z.boolean() 등
  const text = node.getText();

  if (text.startsWith("z.string")) {
    return { type: inferStringEnumOrLiteral(node) || "string", optional: text.includes(".optional()") };
  }
  if (text.startsWith("z.number")) {
    return { type: "number", optional: text.includes(".optional()") };
  }
  if (text.startsWith("z.boolean")) {
    return { type: "boolean", optional: text.includes(".optional()") };
  }
  if (text.startsWith("z.enum")) {
    const m = text.match(/z\.enum\(\[([^\]]+)\]\)/);
    const vals = m ? m[1].split(",").map(function(s) { return s.trim(); }) : [];
    return { type: "enum(" + vals.join(", ") + ")", optional: text.includes(".optional()") };
  }
  if (text.startsWith("z.array")) {
    return { type: "array", optional: text.includes(".optional()") };
  }
  if (Node.isIdentifier(node)) {
    // 변수 참조인 경우 타입은 알 수 없지만 ref가 위에서 기록됨
    return { type: "ref:" + node.getText(), optional: false };
  }
  return { type: "unknown", optional: false };
}

function inferStringEnumOrLiteral(node) {
  // z.string().min(1) / z.literal("...") 변형이 섞여 있어도 기본은 string으로 본다.
  const t = node.getText();
  const m = t.match(/z\.literal\(\s*["'`](.+?)["'`]\s*\)/);
  if (m) return 'literal("' + m[1] + '")';
  return undefined;
}

function toMarkdown(list) {
  const lines = [];
  lines.push("# API Endpoints (autogen)");
  lines.push("");
  list.forEach(function(ep) {
    lines.push("## `" + ep.method + " " + ep.path + "`");
    lines.push("- **file**: `" + rel(ep.file) + ":" + ep.line + "`");
    if (ep.body) {
      lines.push("- **request body**:");
      if (ep.body.kind === "zod-inline" && ep.body.fields && ep.body.fields.length > 0) {
        lines.push("");
        lines.push("| field | type | optional |");
        lines.push("|---|---|---|");
        ep.body.fields.forEach(function(f) {
          lines.push("| `" + f.name + "` | `" + f.type + "` | `" + f.optional + "` |");
        });
        lines.push("");
      } else if (ep.body.kind === "zod-var") {
        lines.push("  - schema ref: `" + ep.body.refName + "`");
      } else {
        lines.push("  - (unknown / complex) " + (ep.body.note ? ep.body.note : ""));
      }
    }
    lines.push("");
  });
  return lines.join("\n");
}

function rel(p) {
  const cwd = process.cwd().replace(/\\/g, "/");
  return p.replace(/\\/g, "/").replace(cwd + "/", "");
}

main().then(() => {}).catch((err) => {
  console.error(err);
  process.exit(1);
});
