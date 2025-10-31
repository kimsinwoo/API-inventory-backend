/**
 * 정규표현식 기반 API 엔드포인트 & Body 스키마 추출기
 * 더 강력하고 직접적인 파싱 방법
 */

const { readFileSync, writeFileSync } = require('fs');
const { glob } = require('fast-glob');
const { resolve, relative, dirname, join } = require('path');

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'all'];

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
  
  const files = [];
  
  for (const pattern of patterns) {
    const found = await glob(pattern, {
      cwd: process.cwd(),
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    });
    files.push(...found);
  }
  
  return files;
}

/**
 * Validation 미들웨어 파일 파싱
 */
function parseValidationFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const validations = {};

  // exports.ruleName = validate({ ... });를 찾기 위해 중첩 괄호 처리
  // 각 exports를 개별적으로 찾음
  const lines = content.split('\n');
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // exports.ruleName = validate( 패턴 찾기
    const exportMatch = line.match(/exports\.(\w+)\s*=\s*validate\s*\(/);
    
    if (exportMatch) {
      const ruleName = exportMatch[1];
      
      // validate( 이후의 전체 내용을 추출 (괄호 매칭)
      let bracketDepth = 0;
      let inValidate = false;
      let validateContent = '';
      let j = i;
      
      // validate( 위치 찾기
      const validateStart = lines[j].indexOf('validate(');
      if (validateStart !== -1) {
        let currentLine = lines[j].substring(validateStart + 'validate('.length);
        validateContent += currentLine + '\n';
        j++;
        
        // 여는 괄호 카운트
        for (const char of currentLine) {
          if (char === '(' || char === '{') bracketDepth++;
          if (char === ')' || char === '}') bracketDepth--;
        }
        
        // 닫는 괄호를 찾을 때까지 계속
        while (j < lines.length && bracketDepth > 0) {
          currentLine = lines[j];
          validateContent += currentLine + '\n';
          
          for (const char of currentLine) {
            if (char === '(' || char === '{') bracketDepth++;
            if (char === ')' || char === '}') bracketDepth--;
            if (bracketDepth <= 0) break;
          }
          
          j++;
        }
        
        // body 스키마 추출
        const bodyPattern = /body\s*:\s*(z\.(?:object|array)\s*\([^]*?\}[^]*?\))/;
        const bodyMatch = validateContent.match(bodyPattern);
        
        if (bodyMatch) {
          const schema = parseZodSchema(bodyMatch[1], content);
          if (schema && schema.fields && schema.fields.length > 0) {
            validations[ruleName] = { body: schema };
          }
        }
        
        // query 스키마 추출
        const queryPattern = /query\s*:\s*(z\.(?:object|array)\s*\([^]*?\}[^]*?\))/;
        const queryMatch = validateContent.match(queryPattern);
        
        if (queryMatch) {
          const schema = parseZodSchema(queryMatch[1], content);
          if (schema && schema.fields && schema.fields.length > 0) {
            if (!validations[ruleName]) validations[ruleName] = {};
            validations[ruleName].query = schema;
          }
        }
        
        i = j;
      }
    }
    
    i++;
  }

  return validations;
}

/**
 * Zod 스키마 파싱 (강화 버전)
 */
function parseZodSchema(zodText, fullFileContent) {
  // z.object({ ... }) 내용 추출
  const objectMatch = zodText.match(/z\.object\s*\(\s*\{([^}]+(?:\}[^}]*)?)\}/s);
  if (!objectMatch) return null;

  const objectBody = objectMatch[1];
  const fields = [];

  // 각 필드 파싱: fieldName: z.type()...
  // 중첩된 괄호 처리를 위해 더 정교한 파싱
  const lines = splitFields(objectBody);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === ',') continue;

    // fieldName: z... 패턴
    const fieldMatch = trimmed.match(/^(\w+)\s*:\s*(.+?)(?:,\s*$|$)/s);
    if (!fieldMatch) continue;

    const [, fieldName, zodDef] = fieldMatch;
    const field = parseZodField(fieldName, zodDef, fullFileContent);
    if (field) {
      fields.push(field);
    }
  }

  return { type: 'object', fields };
}

/**
 * 필드들을 쉼표로 분리 (중첩된 괄호 고려)
 */
function splitFields(text) {
  const fields = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const prev = text[i - 1];

    // 문자열 시작/끝 체크
    if ((char === '"' || char === "'" || char === '`') && prev !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = '';
      }
    }

    // 괄호 depth 체크 (문자열 안이 아닐 때만)
    if (!inString) {
      if (char === '(' || char === '{' || char === '[') {
        depth++;
      } else if (char === ')' || char === '}' || char === ']') {
        depth--;
      }
    }

    // depth가 0일 때의 쉼표가 실제 필드 구분자
    if (char === ',' && depth === 0 && !inString) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    fields.push(current.trim());
  }

  return fields;
}

/**
 * 개별 Zod 필드 파싱
 */
function parseZodField(fieldName, zodDef, fullFileContent) {
  const field = {
    name: fieldName,
    type: 'unknown',
    optional: false,
    nullable: false,
    default: null,
    enum: null,
    validation: {},
  };

  // optional/nullable 체크
  field.optional = zodDef.includes('.optional()');
  field.nullable = zodDef.includes('.nullable()');

  // default 값
  const defaultMatch = zodDef.match(/\.default\s*\(\s*([^)]+)\s*\)/);
  if (defaultMatch) {
    field.default = defaultMatch[1].replace(/['"]/g, '');
  }

  // z.coerce 제거
  let cleanDef = zodDef.replace(/z\.coerce\./g, 'z.');

  // 타입 결정
  if (cleanDef.includes('z.string')) {
    field.type = 'string';
    
    const minMatch = cleanDef.match(/\.min\s*\(\s*(\d+)/);
    if (minMatch) field.validation.min = parseInt(minMatch[1]);
    
    const maxMatch = cleanDef.match(/\.max\s*\(\s*(\d+)/);
    if (maxMatch) field.validation.max = parseInt(maxMatch[1]);
    
    if (cleanDef.includes('.email')) field.validation.format = 'email';
    if (cleanDef.includes('.url')) field.validation.format = 'url';
    if (cleanDef.includes('.uuid')) field.validation.format = 'uuid';
    if (cleanDef.includes('.datetime')) field.validation.format = 'datetime';
    if (cleanDef.includes('.trim')) field.validation.trim = true;
    
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
    
    // z.enum(["value1", "value2"]) 추출
    const enumMatch = cleanDef.match(/z\.enum\s*\(\s*\[([^\]]+)\]/);
    if (enumMatch) {
      field.enum = enumMatch[1]
        .split(',')
        .map(v => v.trim().replace(/['"]/g, ''))
        .filter(v => v);
    } else {
      // enumStatus 같은 변수 참조인 경우
      const varMatch = cleanDef.match(/^(\w+)/);
      if (varMatch) {
        const varName = varMatch[1];
        // 파일 내용에서 변수 정의 찾기
        const varPattern = new RegExp(`const\\s+${varName}\\s*=\\s*z\\.enum\\s*\\(\\s*\\[([^\\]]+)\\]`, 's');
        const varDefMatch = fullFileContent.match(varPattern);
        if (varDefMatch) {
          field.enum = varDefMatch[1]
            .split(',')
            .map(v => v.trim().replace(/['"]/g, ''))
            .filter(v => v);
        }
      }
    }
    
  } else if (cleanDef.includes('z.array')) {
    field.type = 'array';
    
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
 * 라우트 파일에서 엔드포인트 추출
 */
function parseRouteFile(filePath, validationMap) {
  const content = readFileSync(filePath, 'utf-8');
  const endpoints = [];

  // require("../middleware/...") 찾기
  const requirePattern = /const\s+(\w+)\s*=\s*require\s*\(\s*['"](\.\.\/middleware\/[\w-]+)['"]\s*\)/g;
  const middlewareVars = {};
  
  let match;
  while ((match = requirePattern.exec(content)) !== null) {
    const varName = match[1];
    const middlewarePath = match[2];
    middlewareVars[varName] = middlewarePath;
  }
  

  // router.METHOD("path", ...) 추출
  HTTP_METHODS.forEach(method => {
    const pattern = new RegExp(
      `(?:router|app)\\.${method}\\s*\\(\\s*['"](\/[^'"]*)['"\\s]*,([^)]+)\\)`,
      'g'
    );

    while ((match = pattern.exec(content)) !== null) {
      const path = match[1];
      const middlewares = match[2];

      const endpoint = {
        method: method.toUpperCase(),
        path: path,
        file: relative(process.cwd(), filePath),
        line: content.substring(0, match.index).split('\n').length,
        body: null,
        query: null,
      };

      // 미들웨어에서 validation 찾기
      // 예: vr.receiveRules
      const middlewareCallPattern = /(\w+)\.(\w+)/g;
      let mwMatch;
      
      while ((mwMatch = middlewareCallPattern.exec(middlewares)) !== null) {
        const varName = mwMatch[1];
        const ruleName = mwMatch[2];

        // validation 변수인지 확인
        if (middlewareVars[varName]) {
          const middlewarePath = middlewareVars[varName];
          const fullPath = resolve(dirname(filePath), middlewarePath + '.js');
          
          // 경로 정규화 (Windows \\ -> /)
          const normalizedPath = fullPath.replace(/\\/g, '/');
          
          // ValidationMap의 모든 키도 정규화해서 비교
          let found = false;
          for (const [mapPath, validations] of Object.entries(validationMap)) {
            const normalizedMapPath = mapPath.replace(/\\/g, '/');
            
            if (normalizedPath === normalizedMapPath && validations[ruleName]) {
              const validation = validations[ruleName];
              if (validation.body) endpoint.body = validation.body;
              if (validation.query) endpoint.query = validation.query;
              found = true;
              break;
            }
          }
        }
      }

      endpoints.push(endpoint);
    }
  });

  return endpoints;
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

      // Body 스키마
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
          if (field.validation.trim) validations.push('trim');
          
          if (validations.length > 0) {
            md += `    // ${validations.join(', ')}\n`;
          }
        });
        
        md += '}\n```\n\n';
      }

      // Query 스키마
      if (ep.query && ep.query.fields && ep.query.fields.length > 0) {
        md += '#### 🔍 Query Parameters\n\n';
        md += '```typescript\n{\n';
        
        ep.query.fields.forEach(field => {
          const optional = field.optional ? '?' : '';
          let type = field.type;
          
          if (field.enum) {
            type = field.enum.map(v => `"${v}"`).join(' | ');
          }
          
          md += `  ${field.name}${optional}: ${type}`;
          
          if (field.default !== null) {
            md += ` = ${field.default}`;
          }
          
          md += '\n';
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
  console.log('🔍 정규표현식 기반 API 엔드포인트 추출 시작...\n');

  const files = await findFiles();
  console.log(`📁 발견된 파일: ${files.length}개\n`);

  // 1단계: 모든 validation 파일 파싱
  console.log('📊 Validation 파일 분석 중...\n');
  const validationMap = {};
  
  const middlewareFiles = files.filter(f => {
    const normalized = f.replace(/\\/g, '/');
    return normalized.includes('/middleware/') && normalized.includes('validate');
  });
  
  console.log(`  발견된 Validation 파일: ${middlewareFiles.length}개\n`);
  
  if (middlewareFiles.length === 0) {
    console.log('  ⚠️  Validation 파일을 찾지 못했습니다!');
    console.log('  디버깅: 모든 middleware 파일 목록:\n');
    const allMiddleware = files.filter(f => f.replace(/\\/g, '/').includes('/middleware/'));
    allMiddleware.forEach(f => {
      console.log(`    - ${relative(process.cwd(), f)}`);
    });
    console.log('');
  }
  
  for (const file of middlewareFiles) {
    try {
      const validations = parseValidationFile(file);
      if (Object.keys(validations).length > 0) {
        validationMap[file] = validations;
        console.log(`  ✅ ${relative(process.cwd(), file)}: ${Object.keys(validations).length}개 규칙`);
      } else {
        console.log(`  ⚠️  ${relative(process.cwd(), file)}: 규칙 없음`);
      }
    } catch (error) {
      console.warn(`  ❌ 파일 파싱 실패: ${relative(process.cwd(), file)}`);
      console.warn(`     에러: ${error.message}`);
    }
  }

  console.log('');

  // 2단계: 모든 라우트 파일에서 엔드포인트 추출
  console.log('📊 라우트 파일 분석 중...\n');
  const allEndpoints = [];
  
  const routeFiles = files.filter(f => f.replace(/\\/g, '/').includes('/routes/'));
  
  for (const file of routeFiles) {
    const endpoints = parseRouteFile(file, validationMap);
    if (endpoints.length > 0) {
      allEndpoints.push(...endpoints);
      const withSchema = endpoints.filter(ep => ep.body || ep.query).length;
      if (withSchema > 0) {
        console.log(`  ✅ ${relative(process.cwd(), file)}: ${endpoints.length}개 엔드포인트 (${withSchema}개 스키마 포함)`);
      } else {
        console.log(`  ✅ ${relative(process.cwd(), file)}: ${endpoints.length}개 엔드포인트`);
      }
    }
  }

  console.log('');
  console.log(`✅ 추출된 엔드포인트: ${allEndpoints.length}개\n`);

  const withBody = allEndpoints.filter(ep => ep.body && ep.body.fields && ep.body.fields.length > 0);
  const withQuery = allEndpoints.filter(ep => ep.query && ep.query.fields && ep.query.fields.length > 0);
  
  console.log(`📥 Body 스키마가 있는 엔드포인트: ${withBody.length}개`);
  console.log(`🔍 Query 파라미터가 있는 엔드포인트: ${withQuery.length}개\n`);

  // 저장
  writeFileSync(
    resolve(process.cwd(), 'api-endpoints-complete.json'),
    JSON.stringify(allEndpoints, null, 2),
    'utf-8'
  );

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
  if (withBody.length > 0) {
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
}

main().catch(console.error);

