/**
 * 런타임 엔드포인트 추출 (express-list-endpoints)
 */
const listEndpoints = require('express-list-endpoints');
const { writeFileSync } = require('fs');
const { resolve } = require('path');

console.log('🔍 런타임 엔드포인트 추출 시작...\n');

// app 가져오기
let app;
try {
  // 서버가 시작되지 않은 상태로 app만 가져오기
  process.env.SKIP_SERVER_START = 'true';
  app = require('../src/app');
  
  if (!app) {
    throw new Error('app이 export되지 않았습니다');
  }
} catch (error) {
  console.error('❌ app을 import할 수 없습니다:', error.message);
  console.log('\n💡 해결 방법:');
  console.log('  1. src/app.js 파일 끝에 다음 추가:');
  console.log('     module.exports = app;');
  console.log('  2. 또는 startServer() 함수를 export하지 말고 app만 export\n');
  process.exit(1);
}

try {
  const endpoints = listEndpoints(app);

  // JSON 저장
  writeFileSync(
    resolve(process.cwd(), 'endpoints-runtime.json'),
    JSON.stringify(endpoints, null, 2),
    'utf-8'
  );

  console.log(`✅ ${endpoints.length}개의 엔드포인트 추출 완료`);
  console.log('  - endpoints-runtime.json\n');

  // 간단한 출력
  console.log('📋 엔드포인트 목록:\n');
  endpoints.forEach(ep => {
    const methods = ep.methods.join(', ').padEnd(20);
    console.log(`  ${methods} ${ep.path}`);
  });

  console.log('\n');
  process.exit(0);
} catch (error) {
  console.error('❌ 엔드포인트 추출 실패:', error.message);
  process.exit(1);
}


