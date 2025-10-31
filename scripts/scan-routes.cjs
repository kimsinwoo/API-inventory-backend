/**
 * API 엔드포인트 & Body 스키마 추출기 (CommonJS)
 * Node v22+ 지원
 */

const { Project } = require('ts-morph');
const { glob } = require('fast-glob');
const { writeFileSync } = require('fs');
const { resolve, relative } = require('path');

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'all'];

/**
 * 프로젝트 초기화
 */
function createProject() {
  return new Project({
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      target: 99,
      module: 99,
      allowJs: true,
      checkJs: false,
      skipLibCheck: true,
    },
  });
}

/**
 * 라우트 파일 찾기
 */
async function findRouteFiles() {
  const patterns = [
    'src/**/*.js',
    'src/**/*.ts',
    'routes/**/*.js',
    'routes/**/*.ts',
    'api/**/*.js',
    'api/**/*.ts',
    'controllers/**/*.js',
    'controllers/**/*.ts',
  ];

  const files = await glob(patterns, {
    cwd: process.cwd(),
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  });

  return files;
}

/**
 * Zod 스키마 파싱
 */
function parseZodSchema(node) {
  const text = node.getText();
  
  if (text.includes('z.object')) {
    return parseZodObject(node);
  }
  
  if (text.includes('z.array')) {
    return { kind: 'array', items: parseZodObject(node) };
  }

  return { kind: 'unknown', raw: text.substring(0, 100) };
}

/**
 * Zod Object 필드 파싱
 */
function parseZodObject(node) {
  const fields = [];
  const text = node.getText();
  
  const objectMatch = text.match(/z\.object\s*\(\s*\{([^}]+)\}/s);
  if (!objectMatch) {
    return { kind: 'zod-object', fields: [] };
  }

  const objectBody = objectMatch[1];
  
  const fieldPattern = /(\w+)\s*:\s*z\.(\w+)(?:\([^)]*\))?(?:\s*\.\s*(\w+)\([^)]*\))*/g;
  let match;
  
  while ((match = fieldPattern.exec(objectBody)) !== null) {
    const [, fieldName, zodType] = match;
    const fullField = objectBody.substring(match.index, match.index + 200);
    
    const isOptional = fullField.includes('.optional()');
    const isArray = fullField.includes('.array()');
    
    if (zodType === 'enum') {
      const enumMatch = fullField.match(/z\.enum\s*\(\s*\[([^\]]+)\]/);
      if (enumMatch) {
        const enumValues = enumMatch[1]
          .split(',')
          .map(v => v.trim().replace(/['"]/g, ''))
          .filter(v => v);
        
        fields.push({
          name: fieldName,
          type: `enum(${enumValues.map(v => `"${v}"`).join(', ')})`,
          optional: isOptional,
        });
        continue;
      }
    }
    
    let type = zodType;
    if (isArray) {
      type = `array<${zodType}>`;
    }
    
    fields.push({
      name: fieldName,
      type,
      optional: isOptional,
    });
  }

  return {
    kind: 'zod-object',
    fields,
  };
}

/**
 * router.METHOD("path", ...) 추출
 */
function extractEndpoints(sourceFile) {
  const { Node } = require('ts-morph');
  const endpoints = [];
  const filePath = relative(process.cwd(), sourceFile.getFilePath());

  // forEachDescendant를 사용하여 모든 노드 순회
  sourceFile.forEachDescendant((node) => {
    // CallExpression인지 확인
    if (!Node.isCallExpression(node)) return;

    const call = node;
    const expression = call.getExpression();
    
    // PropertyAccessExpression인지 확인 (router.get 형태)
    if (!Node.isPropertyAccessExpression(expression)) return;

    const propertyAccess = expression;
    const objectName = propertyAccess.getExpression().getText();
    const methodName = propertyAccess.getName().toLowerCase();

    // router 또는 app 객체인지 확인
    if (!['router', 'app'].includes(objectName)) return;
    if (!HTTP_METHODS.includes(methodName)) return;

    const args = call.getArguments();
    if (args.length === 0) return;

    // 첫 번째 인자에서 경로 추출
    const pathArg = args[0];
    if (!Node.isStringLiteral(pathArg)) return;
    
    const pathText = pathArg.getLiteralText();

    const endpoint = {
      method: methodName.toUpperCase(),
      path: pathText,
      file: filePath,
      line: call.getStartLineNumber(),
    };

    // 미들웨어에서 Body 스키마 찾기
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      const argText = arg.getText();
      
      // validate 함수나 Zod 스키마 찾기
      if (argText.includes('z.object') || argText.includes('validate')) {
        endpoint.body = parseZodSchema(arg);
        break;
      }
      
      // 변수 참조인 경우 (예: vr.createRules)
      if (Node.isPropertyAccessExpression(arg)) {
        const propAccess = arg;
        const refName = propAccess.getName();
        
        // 해당 파일에서 export된 validate 함수 찾기
        const refs = sourceFile.getVariableDeclarations();
        for (const ref of refs) {
          if (ref.getName() === refName || ref.getText().includes(refName)) {
            const init = ref.getInitializer();
            if (init) {
              endpoint.body = parseZodSchema(init);
              break;
            }
          }
        }
      }
    }

    endpoints.push(endpoint);
  });

  return endpoints;
}

/**
 * Markdown 생성
 */
function generateMarkdown(endpoints) {
  let md = '# API 엔드포인트 목록\n\n';
  md += `총 ${endpoints.length}개의 엔드포인트\n\n`;

  const grouped = {};
  
  endpoints.forEach(ep => {
    const basePath = ep.path.split('/')[1] || 'root';
    if (!grouped[basePath]) {
      grouped[basePath] = [];
    }
    grouped[basePath].push(ep);
  });

  for (const [group, eps] of Object.entries(grouped)) {
    md += `## ${group}\n\n`;

    for (const ep of eps) {
      md += `### ${ep.method} ${ep.path}\n\n`;
      md += `**파일**: \`${ep.file}\` (Line ${ep.line})\n\n`;

      if (ep.body) {
        md += '**Request Body**:\n\n';
        if (ep.body.kind === 'zod-object' && ep.body.fields) {
          md += '```typescript\n{\n';
          ep.body.fields.forEach(field => {
            const optional = field.optional ? '?' : '';
            md += `  ${field.name}${optional}: ${field.type}\n`;
          });
          md += '}\n```\n\n';
        } else {
          md += `\`${JSON.stringify(ep.body, null, 2)}\`\n\n`;
        }
      }

      md += '---\n\n';
    }
  }

  return md;
}

/**
 * 메인 실행
 */
async function main() {
  console.log('🔍 API 엔드포인트 스캔 시작...\n');

  const project = createProject();
  const files = await findRouteFiles();

  console.log(`📁 발견된 파일: ${files.length}개\n`);

  files.forEach(file => project.addSourceFileAtPath(file));

  const allEndpoints = [];

  for (const sourceFile of project.getSourceFiles()) {
    const endpoints = extractEndpoints(sourceFile);
    allEndpoints.push(...endpoints);
  }

  console.log(`📊 추출된 엔드포인트: ${allEndpoints.length}개\n`);

  writeFileSync(
    resolve(process.cwd(), 'endpoints-with-schemas.json'),
    JSON.stringify(allEndpoints, null, 2),
    'utf-8'
  );

  const markdown = generateMarkdown(allEndpoints);
  writeFileSync(
    resolve(process.cwd(), 'endpoints-with-schemas.md'),
    markdown,
    'utf-8'
  );

  console.log('✅ 완료!');
  console.log('  - endpoints-with-schemas.json');
  console.log('  - endpoints-with-schemas.md\n');
}

main().catch(console.error);

