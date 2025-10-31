#!/usr/bin/env node
/**
 * Generate Postman collection from endpoints-with-schemas.json (scan result)
 * - Input: endpoints-with-schemas.json (produced by scripts/scan-routes.js)
 * - Output: postman_collection.json
 *
 * Compatible with Node.js CommonJS on Windows.
 */

const fs = require("fs");
const path = require("path");

const WORKDIR = process.cwd();
const SCAN_JSON = path.join(WORKDIR, "endpoints-with-schemas.json");
const OUTPUT = path.join(WORKDIR, "Inventory-API.postman_collection.json");

function readJsonSafe(filePath) {
  try {
    const text = fs.readFileSync(filePath, "utf8");
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildUrlObject(baseVar, routePath) {
  // Normalize: ensure routePath starts with /
  const normalized = routePath.startsWith("/") ? routePath : `/${routePath}`;
  // Postman URL as {{baseUrl}} + path
  return {
    raw: `{{${baseVar}}}${normalized}`,
    host: [ `{{${baseVar}}}` ],
    path: normalized.replace(/^\//, "").split("/")
  };
}

function guessBodyFromSchema(schema) {
  // Convert our summarized schema into a Postman raw JSON example
  if (!schema || typeof schema !== "object") return undefined;

  function fieldExample(field) {
    const t = field.type;
    if (t === "string") return "string";
    if (t === "number") return 0;
    if (t === "boolean") return false;
    if (t.startsWith("enum(")) {
      const inside = t.slice(5, -1);
      const first = inside.split(",").map(s => s.trim().replace(/^"|"$/g, ""))[0];
      return first || "value";
    }
    if (t === "array<object>") return [ {} ];
    if (t === "array<string>") return [ "string" ];
    if (t === "array<number>") return [ 0 ];
    if (t === "object") return {};
    return null;
  }

  if (Array.isArray(schema.fields)) {
    const body = {};
    for (const f of schema.fields) {
      body[f.name] = fieldExample(f);
    }
    return JSON.stringify(body, null, 2);
  }
  return undefined;
}

function methodToPostman(method) {
  const m = String(method || "").toUpperCase();
  return ["GET","POST","PUT","PATCH","DELETE"].includes(m) ? m : "GET";
}

function buildItemFromEndpoint(ep, baseVar) {
  const method = methodToPostman(ep.method);
  const name = `${method} ${ep.path}`;
  const url = buildUrlObject(baseVar, ep.path);

  const request = {
    method,
    header: [
      { key: "Content-Type", value: "application/json" }
    ],
    url
  };

  if (["POST","PUT","PATCH"].includes(method)) {
    const raw = guessBodyFromSchema(ep.body);
    if (typeof raw === "string") {
      request.body = { mode: "raw", raw };
    }
  }

  return {
    name,
    request
  };
}

function wrapCollection(items) {
  return {
    info: {
      name: "Inventory Management API",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: items,
    variable: [
      { key: "baseUrl", value: "http://localhost:4000" }
    ]
  };
}

function main() {
  const scan = readJsonSafe(SCAN_JSON);
  if (!scan || !Array.isArray(scan)) {
    console.error(`Scan result not found or invalid: ${SCAN_JSON}`);
    console.error("Please generate endpoints-with-schemas.json first (scripts/scan-routes.js)");
    process.exitCode = 1;
    return;
  }

  const items = [];
  for (const ep of scan) {
    if (!ep || !ep.path || !ep.method) continue;
    items.push(buildItemFromEndpoint(ep, "baseUrl"));
  }

  const collection = wrapCollection(items);
  fs.writeFileSync(OUTPUT, JSON.stringify(collection, null, 2), "utf8");
  console.log(`Postman collection written: ${OUTPUT}`);
}

main();



