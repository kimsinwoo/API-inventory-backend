const xlsx = require('xlsx');

// CJ대한통운 엑셀 파일 읽기
const filePath = 'C:\\Users\\khcst\\anniecong\\anniecongFrontEnd\\CJ대한통운 업로드 양식.xlsx';

try {
  const workbook = xlsx.readFile(filePath, {
    type: 'file',
    codepage: 65001,
    raw: false
  });

  console.log('=== CJ대한통운 양식 분석 ===\n');
  console.log('시트 목록:', workbook.SheetNames);

  // 첫 번째 시트 읽기
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  console.log('\n전체 행 수:', data.length);

  // 처음 10행 출력
  console.log('\n=== 처음 10행 ===');
  for (let i = 0; i < Math.min(10, data.length); i++) {
    console.log(`행 ${i + 1}:`, data[i]);
  }

  // 헤더 찾기
  console.log('\n=== 헤더 분석 ===');
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row = data[i];
    if (row && row.some(cell => cell && cell.toString().trim() !== '')) {
      console.log(`\n행 ${i + 1} (헤더 후보):`);
      row.forEach((cell, idx) => {
        if (cell) {
          console.log(`  컬럼 ${idx + 1}: "${cell}"`);
        }
      });
    }
  }

} catch (error) {
  console.error('파일 읽기 오류:', error.message);
}


