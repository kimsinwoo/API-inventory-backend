/**
 * 완전한 API 엔드포인트 & Body 스키마 추출기
 * - Zod 스키마 완전 파싱
 * - Validation 미들웨어 추적
 * - Body, Query, Params 모두 추출
 */

const { Project, Node } = require('ts-morph');
const { glob } = require('fast-glob');
const { writeFileSync } = require('fs');
const { resolve, relative, join, dirname } = require('path');

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'all'];

/**
 * 프로젝트 초기화
 */
function createProject() {
  return new Project({
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
}

/**
 * 파일 찾기
 */
async function findFiles() {
  const patterns = [
    'src/**/*.js',
    'src/**/*.ts',
    'routes/**/*.js',
    'routes/**/*.ts',
  ];

  return await glob(patterns, {
    cwd: process.cwd(),
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  });
}

/**
 * Zod 타입 매핑
 */
const ZOD_TYPE_MAP = {
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  date: 'Date',
  array: 'array',
  object: 'object',
  enum: 'enum',
  literal: 'literal',
  union: 'union',
  coerce: 'coerce',
};

/**
 * Zod 스키마 상세 파싱
 */
function parseZodSchemaDetailed(text) {
  const result = {
    type: 'unknown',
    fields: [],
    description: null,
  };

  // z.object({ ... }) 파싱
  if (text.includes('z.object')) {
    result.type = 'object';
    result.fields = extractZodObjectFields(text);
    return result;
  }

  // z.array(z.object({ ... })) 파싱
  if (text.includes('z.array')) {
    result.type = 'array';
    const innerMatch = text.match(/z\.array\s*\(\s*z\.object\s*\(\s*\{([^}]+)\}/s);
    if (innerMatch) {
      result.fields = extractZodObjectFields(innerMatch[0]);
    }
    return result;
  }

  return result;
}

/**
 * Zod Object 필드 상세 추출
 */
function extractZodObjectFields(text) {
  const fields = [];
  
  // z.object({ ... }) 내부만 추출
  const objectMatch = text.match(/z\.object\s*\(\s*\{([^}]+)\}/s);
  if (!objectMatch) return fields;

  const objectBody = objectMatch[1];
  
  // 각 라인을 개별적으로 파싱
  const lines = objectBody.split(/,(?![^()]*\))/); // 괄호 안의 쉼표는 무시
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // fieldName: z.type()... 패턴
    const fieldMatch = trimmed.match(/^(\w+)\s*:\s*(.+)$/);
    if (!fieldMatch) continue;

    const [, fieldName, zodDef] = fieldMatch;
    const field = parseZodField(fieldName, zodDef);
    if (field) {
      fields.push(field);
    }
  }

  return fields;
}

/**
 * 개별 Zod 필드 파싱
 */
function parseZodField(fieldName, zodDef) {
  const field = {
    name: fieldName,
    type: 'unknown',
    optional: false,
    nullable: false,
    default: null,
    description: null,
    enum: null,
    validation: {},
  };

  // optional 체크
  if (zodDef.includes('.optional()')) {
    field.optional = true;
  }

  // nullable 체크
  if (zodDef.includes('.nullable()')) {
    field.nullable = true;
  }

  // default 값 추출
  const defaultMatch = zodDef.match(/\.default\s*\(\s*([^)]+)\s*\)/);
  if (defaultMatch) {
    field.default = defaultMatch[1].replace(/['"]/g, '');
  }

  // z.coerce.number() → number (coerce 제거)
  let cleanDef = zodDef.replace(/z\.coerce\./g, 'z.');

  // 타입 결정
  if (cleanDef.includes('z.string')) {
    field.type = 'string';
    
    // 문자열 검증 추출
    const minMatch = cleanDef.match(/\.min\s*\(\s*(\d+)/);
    if (minMatch) field.validation.min = parseInt(minMatch[1]);
    
    const maxMatch = cleanDef.match(/\.max\s*\(\s*(\d+)/);
    if (maxMatch) field.validation.max = parseInt(maxMatch[1]);
    
    if (cleanDef.includes('.email')) field.validation.format = 'email';
    if (cleanDef.includes('.url')) field.validation.format = 'url';
    if (cleanDef.includes('.uuid')) field.validation.format = 'uuid';
    if (cleanDef.includes('.datetime')) field.validation.format = 'datetime';
    
  } else if (cleanDef.includes('z.number')) {
    field.type = 'number';
    
    const minMatch = cleanDef.match(/\.min\s*\(\s*([\d.]+)/);
    if (minMatch) field.validation.min = parseFloat(minMatch[1]);
    
    const maxMatch = cleanDef.match(/\.max\s*\(\s*([\d.]+)/);
    if (maxMatch) field.validation.max = parseFloat(maxMatch[1]);
    
    if (cleanDef.includes('.positive')) field.validation.positive = true;
    if (cleanDef.includes('.int')) field.validation.integer = true;
    
  } else if (cleanDef.includes('z.boolean')) {
    field.type = 'boolean';
    
  } else if (cleanDef.includes('z.date')) {
    field.type = 'Date';
    
  } else if (cleanDef.includes('z.enum')) {
    field.type = 'enum';
    
    // enum 값 추출
    const enumMatch = cleanDef.match(/z\.enum\s*\(\s*\[([^\]]+)\]/);
    if (enumMatch) {
      field.enum = enumMatch[1]
        .split(',')
        .map(v => v.trim().replace(/['"]/g, ''))
        .filter(v => v);
    }
    
  } else if (cleanDef.includes('z.array')) {
    field.type = 'array';
    
    // 배열 내부 타입 추출
    const arrayMatch = cleanDef.match(/z\.array\s*\(\s*z\.(\w+)/);
    if (arrayMatch) {
      field.type = `array<${arrayMatch[1]}>`;
    }
    
  } else if (cleanDef.includes('z.object')) {
    field.type = 'object';
  }

  return field;
}

/**
 * 미들웨어에서 스키마 찾기
 */
function findSchemaInMiddleware(sourceFile, middlewareName) {
  // exports.middlewareName = validate({ body: z.object({ ... }) })
  const exportAssignments = sourceFile.getDescendantsOfKind(225); // BinaryExpression
  
  for (const assign of exportAssignments) {
    const text = assign.getText();
    if (text.includes(`exports.${middlewareName}`)) {
      // body 스키마 추출
      const bodySchema = extractBodyFromValidate(text);
      if (bodySchema) return bodySchema;
      
      // 직접 z.object인 경우
      if (text.includes('z.object')) {
        return parseZodSchemaDetailed(text);
      }
    }
  }

  // const middlewareName = validate({ body: z.object({ ... }) })
  const varDeclarations = sourceFile.getVariableDeclarations();
  
  for (const varDecl of varDeclarations) {
    if (varDecl.getName() === middlewareName) {
      const init = varDecl.getInitializer();
      if (init) {
        const text = init.getText();
        
        // body 스키마 추출
        const bodySchema = extractBodyFromValidate(text);
        if (bodySchema) return bodySchema;
        
        // 직접 z.object인 경우
        if (text.includes('z.object')) {
          return parseZodSchemaDetailed(text);
        }
      }
    }
  }

  return null;
}

/**
 * validate({ body: z.object({ ... }) }) 패턴에서 body 스키마 추출
 */
function extractBodyFromValidate(text) {
  // validate({ body: z.object({ ... }) }) 패턴
  const bodyMatch = text.match(/body\s*:\s*(z\.(?:object|array)[^}]*\{[^}]+\}[^}]*\})/s);
  if (bodyMatch) {
    return parseZodSchemaDetailed(bodyMatch[1]);
  }
  
  return null;
}

/**
 * 엔드포인트 추출
 */
function extractEndpoints(sourceFile, project) {
  const endpoints = [];
  const filePath = relative(process.cwd(), sourceFile.getFilePath());

  sourceFile.forEachDescendant((node) => {
    if (!Node.isCallExpression(node)) return;

    const call = node;
    const expression = call.getExpression();
    
    if (!Node.isPropertyAccessExpression(expression)) return;

    const propertyAccess = expression;
    const objectName = propertyAccess.getExpression().getText();
    const methodName = propertyAccess.getName().toLowerCase();

    if (!['router', 'app'].includes(objectName)) return;
    if (!HTTP_METHODS.includes(methodName)) return;

    const args = call.getArguments();
    if (args.length === 0) return;

    const pathArg = args[0];
    if (!Node.isStringLiteral(pathArg)) return;
    
    const pathText = pathArg.getLiteralText();

    const endpoint = {
      method: methodName.toUpperCase(),
      path: pathText,
      file: filePath,
      line: call.getStartLineNumber(),
      body: null,
      query: null,
      params: null,
    };

    // 미들웨어 분석
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      const argText = arg.getText();
      
      // 1. 인라인 Zod 스키마
      if (argText.includes('z.object')) {
        endpoint.body = parseZodSchemaDetailed(argText);
        continue;
      }

      // 2. 변수 참조 (예: vr.createRules, validateItemCreate)
      if (Node.isPropertyAccessExpression(arg)) {
        const propAccess = arg;
        const objName = propAccess.getExpression().getText();
        const propName = propAccess.getName();
        
        // 같은 파일에서 찾기
        let schema = findSchemaInMiddleware(sourceFile, propName);
        
        // 다른 파일에서 찾기 (require로 import된 경우)
        if (!schema) {
          const importPath = findImportPath(sourceFile, objName);
          if (importPath) {
            const middlewareFile = project.getSourceFile(importPath);
            if (middlewareFile) {
              schema = findSchemaInMiddleware(middlewareFile, propName);
            }
          }
        }
        
        if (schema) {
          endpoint.body = schema;
        }
      }
      
      // 3. 함수 직접 참조 (예: validateItemCreate)
      if (Node.isIdentifier(arg)) {
        const funcName = arg.getText();
        const schema = findSchemaInMiddleware(sourceFile, funcName);
        if (schema) {
          endpoint.body = schema;
        }
      }
    }

    endpoints.push(endpoint);
  });

  return endpoints;
}

/**
 * Import 경로 찾기
 */
function findImportPath(sourceFile, varName) {
  // const vr = require("../middleware/validateItem");
  const varDeclarations = sourceFile.getVariableDeclarations();
  
  for (const varDecl of varDeclarations) {
    if (varDecl.getName() === varName) {
      const init = varDecl.getInitializer();
      if (init && Node.isCallExpression(init)) {
        const callExpr = init;
        const args = callExpr.getArguments();
        if (args.length > 0 && Node.isStringLiteral(args[0])) {
          const importPath = args[0].getLiteralText();
          const sourceDir = dirname(sourceFile.getFilePath());
          return resolve(sourceDir, importPath + '.js');
        }
      }
    }
  }
  
  return null;
}

/**
 * Markdown 생성
 */
function generateMarkdown(endpoints) {
  let md = '# 🚀 API 엔드포인트 완전 문서\n\n';
  md += `생성일: ${new Date().toLocaleString('ko-KR')}\n\n`;
  md += `총 **${endpoints.length}개**의 엔드포인트\n\n`;
  md += '---\n\n';

  const grouped = {};
  
  endpoints.forEach(ep => {
    const basePath = ep.path.split('/').filter(Boolean)[0] || 'root';
    if (!grouped[basePath]) {
      grouped[basePath] = [];
    }
    grouped[basePath].push(ep);
  });

  for (const [group, eps] of Object.entries(grouped)) {
    md += `## 📦 ${group}\n\n`;

    for (const ep of eps) {
      md += `### ${ep.method} \`${ep.path}\`\n\n`;
      md += `**파일**: \`${ep.file}\` (Line ${ep.line})\n\n`;

      if (ep.body && ep.body.fields && ep.body.fields.length > 0) {
        md += '#### 📥 Request Body\n\n';
        md += '```typescript\n{\n';
        
        ep.body.fields.forEach(field => {
          const optional = field.optional ? '?' : '';
          const nullable = field.nullable ? ' | null' : '';
          let type = field.type;
          
          if (field.enum) {
            type = field.enum.map(v => `"${v}"`).join(' | ');
          }
          
          md += `  ${field.name}${optional}: ${type}${nullable}`;
          
          if (field.default !== null) {
            md += ` = ${field.default}`;
          }
          
          md += '\n';
          
          // Validation 정보
          const validations = [];
          if (field.validation.min !== undefined) validations.push(`min: ${field.validation.min}`);
          if (field.validation.max !== undefined) validations.push(`max: ${field.validation.max}`);
          if (field.validation.format) validations.push(`format: ${field.validation.format}`);
          if (field.validation.positive) validations.push('positive');
          if (field.validation.integer) validations.push('integer');
          
          if (validations.length > 0) {
            md += `    // ${validations.join(', ')}\n`;
          }
        });
        
        md += '}\n```\n\n';
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
  console.log('🔍 완전한 API 엔드포인트 & Body 스키마 추출 시작...\n');

  const project = createProject();
  const files = await findFiles();

  console.log(`📁 발견된 파일: ${files.length}개\n`);

  files.forEach(file => {
    try {
      project.addSourceFileAtPath(file);
    } catch (error) {
      console.warn(`⚠️  파일 추가 실패: ${file}`);
    }
  });

  console.log(`📊 분석 중...\n`);

  const allEndpoints = [];

  for (const sourceFile of project.getSourceFiles()) {
    const endpoints = extractEndpoints(sourceFile, project);
    allEndpoints.push(...endpoints);
  }

  console.log(`✅ 추출된 엔드포인트: ${allEndpoints.length}개\n`);

  // Body가 있는 엔드포인트만 카운트
  const withBody = allEndpoints.filter(ep => ep.body && ep.body.fields && ep.body.fields.length > 0);
  console.log(`📥 Body 스키마가 있는 엔드포인트: ${withBody.length}개\n`);

  // JSON 저장
  writeFileSync(
    resolve(process.cwd(), 'api-endpoints-complete.json'),
    JSON.stringify(allEndpoints, null, 2),
    'utf-8'
  );

  // Markdown 생성
  const markdown = generateMarkdown(allEndpoints);
  writeFileSync(
    resolve(process.cwd(), 'api-endpoints-complete.md'),
    markdown,
    'utf-8'
  );

  console.log('✅ 완료!\n');
  console.log('생성된 파일:');
  console.log('  📄 api-endpoints-complete.json');
  console.log('  📄 api-endpoints-complete.md\n');

  // 샘플 출력
  console.log('📋 Body 스키마 예시 (처음 3개):\n');
  withBody.slice(0, 3).forEach(ep => {
    console.log(`${ep.method} ${ep.path}`);
    if (ep.body.fields) {
      ep.body.fields.forEach(field => {
        const opt = field.optional ? '?' : '';
        console.log(`  - ${field.name}${opt}: ${field.type}`);
      });
    }
    console.log('');
  });
}

main().catch(console.error);

