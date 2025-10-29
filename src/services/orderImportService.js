/**
 * 주문서 가져오기 서비스
 * - 다양한 쇼핑몰(쿠팡, G마켓, 네이버 쇼핑, 11번가 등)의 주문서 CSV/엑셀 파일 처리
 * - 자동 형식 감지 및 데이터 추출
 * - 표준 형식으로 통합
 */

const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

/**
 * 엑셀/CSV 파일의 형식을 자동으로 감지합니다.
 */
function detectExcelFormat(workbook) {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  // 빈 행 제거
  const nonEmptyRows = data.filter(row => row.some(cell => cell !== ''));
  
  if (nonEmptyRows.length === 0) {
    throw new Error('엑셀 파일이 비어있습니다.');
  }

  // 헤더 찾기 (첫 번째 비어있지 않은 행)
  let headerRowIndex = 0;
  for (let i = 0; i < nonEmptyRows.length; i++) {
    const row = nonEmptyRows[i];
    if (row.some(cell => cell && cell.toString().trim() !== '')) {
      headerRowIndex = i;
      break;
    }
  }

  const headers = nonEmptyRows[headerRowIndex].map(h => 
    h ? h.toString().trim().toLowerCase() : ''
  );

  console.log('감지된 헤더:', headers);

  // 실제 쇼핑몰 주문서 형식 패턴 정의 (모두 소문자로)
  const patterns = {
    coupang: {
      name: '쿠팡/옥션',
      orderNumPatterns: ['주문번호'],
      orderDatePatterns: ['주문일시'],
      buyerPatterns: ['구매자명'],
      recipientPatterns: ['수취인'],
      phonePatterns: ['전화번호'],  // 쿠팡/옥션 특징
      addressPatterns: ['주소'],
      productPatterns: ['상품명'],
      optionPatterns: ['옵션'],
      quantityPatterns: ['수량'],
      pricePatterns: ['단가', '상품금액'],
      shippingPatterns: ['배송비'],
      totalPatterns: ['총결제금액'],  // 쿠팡/옥션 특징
      paymentPatterns: ['결제수단'],
      statusPatterns: ['주문상태'],
      trackingPatterns: ['송장번호']  // 쿠팡/옥션 특징
    },
    gmarket: {
      name: 'G마켓',
      orderNumPatterns: ['주문번호'],
      orderDatePatterns: ['주문일시'],
      buyerPatterns: ['구매자명'],
      recipientPatterns: ['수취인'],
      phonePatterns: ['연락처'],
      addressPatterns: ['주소'],
      productPatterns: ['상품명'],
      optionPatterns: ['옵션정보'],  // G마켓 특징
      quantityPatterns: ['수량'],
      pricePatterns: ['상품금액'],
      shippingPatterns: ['배송비'],
      totalPatterns: ['결제금액'],
      paymentPatterns: ['결제수단'],
      statusPatterns: ['주문상태'],
      trackingPatterns: ['운송장번호']  // G마켓 특징
    },
    naver: {
      name: '네이버 쇼핑',
      orderNumPatterns: ['주문id'],  // 네이버 특징
      orderDatePatterns: ['주문일시'],
      buyerPatterns: ['구매자명'],
      recipientPatterns: ['수취인'],
      phonePatterns: ['연락처'],
      addressPatterns: ['수령주소'],  // 네이버 특징
      productPatterns: ['상품명'],
      optionPatterns: ['옵션', '선택사항'],
      quantityPatterns: ['수량'],
      pricePatterns: ['상품가격'],  // 네이버 특징
      shippingPatterns: ['배송비'],
      totalPatterns: ['결제금액'],
      paymentPatterns: ['결제수단'],
      statusPatterns: ['주문상태'],
      trackingPatterns: ['운송장']
    },
    street11: {
      name: '11번가',
      orderNumPatterns: ['주문번호'],
      orderDatePatterns: ['주문일자'],  // 11번가 특징
      buyerPatterns: ['구매자명'],
      recipientPatterns: ['수취인명'],  // 11번가 특징
      phonePatterns: ['연락처'],
      addressPatterns: ['배송주소'],  // 11번가 특징
      productPatterns: ['상품명'],
      optionPatterns: ['옵션'],
      quantityPatterns: ['수량'],
      pricePatterns: ['판매가'],  // 11번가 특징
      shippingPatterns: ['배송비'],
      totalPatterns: ['결제총액'],  // 11번가 특징
      paymentPatterns: ['결제수단'],
      statusPatterns: ['배송상태'],  // 11번가 특징
      trackingPatterns: ['운송장']
    }
  };

  // 각 패턴과 매칭되는 컬럼 찾기
  let bestMatch = null;
  let maxScore = 0;

  for (const [typeKey, pattern] of Object.entries(patterns)) {
    let score = 0;
    const columnMapping = {};

    // 각 필드별 매칭
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      
      // 주문번호
      if (pattern.orderNumPatterns && pattern.orderNumPatterns.some(p => header === p || header.includes(p))) {
        columnMapping.orderNum = i;
        score += 8;
      }
      // 주문일시
      if (pattern.orderDatePatterns && pattern.orderDatePatterns.some(p => header === p || header.includes(p))) {
        columnMapping.orderDate = i;
        score += 8;
      }
      // 구매자
      if (pattern.buyerPatterns && pattern.buyerPatterns.some(p => header === p || header.includes(p))) {
        columnMapping.buyer = i;
        score += 10;
      }
      // 수취인
      if (pattern.recipientPatterns && pattern.recipientPatterns.some(p => header === p || header.includes(p))) {
        columnMapping.recipient = i;
        score += 10;
      }
      // 연락처
      if (pattern.phonePatterns && pattern.phonePatterns.some(p => header === p || header.includes(p))) {
        columnMapping.phone = i;
        score += 8;
      }
      // 주소
      if (pattern.addressPatterns && pattern.addressPatterns.some(p => header === p || header.includes(p))) {
        columnMapping.address = i;
        score += 10;
      }
      // 상품명
      if (pattern.productPatterns && pattern.productPatterns.some(p => header === p || header.includes(p))) {
        columnMapping.product = i;
        score += 10;
      }
      // 옵션
      if (pattern.optionPatterns && pattern.optionPatterns.some(p => header === p || header.includes(p))) {
        columnMapping.option = i;
        score += 5;
      }
      // 수량
      if (pattern.quantityPatterns && pattern.quantityPatterns.some(p => header === p || header.includes(p))) {
        columnMapping.quantity = i;
        score += 10;
      }
      // 가격
      if (pattern.pricePatterns && pattern.pricePatterns.some(p => header === p || header.includes(p))) {
        columnMapping.price = i;
        score += 8;
      }
      // 배송비
      if (pattern.shippingPatterns && pattern.shippingPatterns.some(p => header === p || header.includes(p))) {
        columnMapping.shipping = i;
        score += 5;
      }
      // 결제금액
      if (pattern.totalPatterns && pattern.totalPatterns.some(p => header === p || header.includes(p))) {
        columnMapping.total = i;
        score += 8;
      }
      // 결제수단
      if (pattern.paymentPatterns && pattern.paymentPatterns.some(p => header === p || header.includes(p))) {
        columnMapping.payment = i;
        score += 5;
      }
      // 주문상태
      if (pattern.statusPatterns && pattern.statusPatterns.some(p => header === p || header.includes(p))) {
        columnMapping.status = i;
        score += 5;
      }
      // 송장번호
      if (pattern.trackingPatterns && pattern.trackingPatterns.some(p => header === p || header.includes(p))) {
        columnMapping.tracking = i;
        score += 5;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = {
        type: pattern.name,
        typeKey: typeKey,
        columnMapping: columnMapping,
        headerRowIndex: headerRowIndex,
        headers: nonEmptyRows[headerRowIndex]
      };
    }
  }

  console.log('최고 점수:', maxScore);
  console.log('매칭된 형식:', bestMatch ? bestMatch.type : '없음');

  if (!bestMatch || maxScore < 10) {
    // 자동 감지 실패 시 수동 매핑
    console.warn('엑셀 형식 자동 감지 실패. 기본 매핑을 사용합니다.');
    bestMatch = {
      type: '사용자 정의',
      typeKey: 'custom',
      columnMapping: createManualMapping(headers),
      headerRowIndex: headerRowIndex,
      headers: nonEmptyRows[headerRowIndex]
    };
  }

  return bestMatch;
}

/**
 * 자동 감지가 실패했을 때 수동으로 컬럼 매핑을 생성합니다.
 */
function createManualMapping(headers) {
  const mapping = {};
  
  headers.forEach((header, index) => {
    const h = header.toLowerCase();
    
    if (h && !mapping.orderNum && (h.includes('주문번호') || h.includes('주문id'))) {
      mapping.orderNum = index;
    }
    if (h && !mapping.orderDate && h.includes('주문일')) {
      mapping.orderDate = index;
    }
    if (h && !mapping.buyer && h.includes('구매자')) {
      mapping.buyer = index;
    }
    if (h && !mapping.recipient && h.includes('수취인')) {
      mapping.recipient = index;
    }
    if (h && !mapping.phone && (h.includes('전화') || h.includes('연락'))) {
      mapping.phone = index;
    }
    if (h && !mapping.address && h.includes('주소')) {
      mapping.address = index;
    }
    if (h && !mapping.product && h.includes('상품명')) {
      mapping.product = index;
    }
    if (h && !mapping.option && h.includes('옵션')) {
      mapping.option = index;
    }
    if (h && !mapping.quantity && h.includes('수량')) {
      mapping.quantity = index;
    }
    if (h && !mapping.price && (h.includes('단가') || h.includes('가격') || h.includes('판매가'))) {
      mapping.price = index;
    }
    if (h && !mapping.shipping && h.includes('배송비')) {
      mapping.shipping = index;
    }
    if (h && !mapping.total && (h.includes('결제') || h.includes('총액'))) {
      mapping.total = index;
    }
    if (h && !mapping.payment && h.includes('결제수단')) {
      mapping.payment = index;
    }
    if (h && !mapping.status && h.includes('상태')) {
      mapping.status = index;
    }
    if (h && !mapping.tracking && (h.includes('송장') || h.includes('운송장'))) {
      mapping.tracking = index;
    }
  });
  
  return mapping;
}

/**
 * 엑셀 파일에서 주문 데이터를 추출합니다.
 */
function extractOrderData(workbook, format) {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  console.log('전체 데이터 행 수:', data.length);
  console.log('컬럼 매핑:', format.columnMapping);

  const orders = [];
  const mapping = format.columnMapping;
  const startRow = format.headerRowIndex + 1;

  for (let i = startRow; i < data.length; i++) {
    const row = data[i];
    
    // 빈 행 스킵
    if (!row || row.every(cell => !cell || cell === '')) {
      continue;
    }

    const order = {
      주문번호: mapping.orderNum !== undefined ? cleanText(row[mapping.orderNum]) : '',
      주문일시: mapping.orderDate !== undefined ? cleanText(row[mapping.orderDate]) : '',
      구매자명: mapping.buyer !== undefined ? cleanText(row[mapping.buyer]) : '',
      수취인: mapping.recipient !== undefined ? cleanText(row[mapping.recipient]) : '',
      연락처: mapping.phone !== undefined ? cleanText(row[mapping.phone]) : '',
      주소: mapping.address !== undefined ? cleanText(row[mapping.address]) : '',
      상품명: mapping.product !== undefined ? cleanText(row[mapping.product]) : '',
      옵션: mapping.option !== undefined ? cleanText(row[mapping.option]) : '',
      수량: mapping.quantity !== undefined ? parseNumber(row[mapping.quantity]) : 0,
      단가: mapping.price !== undefined ? parseNumber(row[mapping.price]) : 0,
      배송비: mapping.shipping !== undefined ? parseNumber(row[mapping.shipping]) : 0,
      결제금액: mapping.total !== undefined ? parseNumber(row[mapping.total]) : 0,
      결제수단: mapping.payment !== undefined ? cleanText(row[mapping.payment]) : '',
      주문상태: mapping.status !== undefined ? cleanText(row[mapping.status]) : '',
      송장번호: mapping.tracking !== undefined ? cleanText(row[mapping.tracking]) : '',
      판매채널: format.type,
      처리일시: new Date().toISOString()
    };

    // 필수 필드가 있는 경우만 추가
    if (order.상품명 || order.주문번호) {
      // 상품금액 계산
      order.상품금액 = order.수량 * order.단가;
      
      // 결제금액이 없으면 상품금액 + 배송비로 계산
      if (!order.결제금액) {
        order.결제금액 = order.상품금액 + order.배송비;
      }
      
      orders.push(order);
    }
  }

  console.log('추출된 주문 수:', orders.length);
  if (orders.length > 0) {
    console.log('첫 번째 주문 샘플:', orders[0]);
  }

  return orders;
}

/**
 * 텍스트 데이터를 정제합니다.
 */
function cleanText(value) {
  if (value === null || value === undefined) return '';
  return value.toString().trim();
}

/**
 * 숫자 데이터를 파싱합니다.
 */
function parseNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  
  const numStr = value.toString().replace(/[^\d.-]/g, '');
  const num = parseFloat(numStr);
  
  return isNaN(num) ? 0 : num;
}

/**
 * 여러 주문 데이터를 병합하고 정리합니다.
 */
function mergeOrderData(allOrders) {
  const merged = allOrders.map((order, index) => ({
    ...order,
    순번: index + 1
  }));

  // 주문일시 및 판매채널 기준 정렬
  merged.sort((a, b) => {
    if (a.주문일시 && b.주문일시) {
      if (a.주문일시 < b.주문일시) return -1;
      if (a.주문일시 > b.주문일시) return 1;
    }
    
    if (a.판매채널 < b.판매채널) return -1;
    if (a.판매채널 > b.판매채널) return 1;
    
    return 0;
  });

  // 순번 재할당
  merged.forEach((order, index) => {
    order.순번 = index + 1;
  });

  return merged;
}

/**
 * 데이터를 새로운 엑셀 파일로 저장합니다.
 */
function saveToExcel(data, outputPath) {
  // 표준화된 형식으로 데이터 준비
  const exportData = data.map(order => ({
    '순번': order.순번,
    '주문번호': order.주문번호,
    '주문일시': order.주문일시,
    '판매채널': order.판매채널,
    '구매자명': order.구매자명,
    '수취인': order.수취인,
    '연락처': order.연락처,
    '주소': order.주소,
    '상품명': order.상품명,
    '옵션': order.옵션,
    '수량': order.수량,
    '단가': order.단가,
    '상품금액': order.상품금액,
    '배송비': order.배송비,
    '결제금액': order.결제금액,
    '결제수단': order.결제수단,
    '주문상태': order.주문상태,
    '송장번호': order.송장번호,
    '처리일시': order.처리일시
  }));

  // 워크북 생성
  const newWorkbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.json_to_sheet(exportData);

  // 컬럼 너비 설정
  worksheet['!cols'] = [
    { wch: 6 },  // 순번
    { wch: 18 }, // 주문번호
    { wch: 18 }, // 주문일시
    { wch: 12 }, // 판매채널
    { wch: 12 }, // 구매자명
    { wch: 12 }, // 수취인
    { wch: 15 }, // 연락처
    { wch: 35 }, // 주소
    { wch: 30 }, // 상품명
    { wch: 15 }, // 옵션
    { wch: 8 },  // 수량
    { wch: 12 }, // 단가
    { wch: 12 }, // 상품금액
    { wch: 10 }, // 배송비
    { wch: 12 }, // 결제금액
    { wch: 12 }, // 결제수단
    { wch: 12 }, // 주문상태
    { wch: 15 }, // 송장번호
    { wch: 20 }  // 처리일시
  ];

  xlsx.utils.book_append_sheet(newWorkbook, worksheet, '통합주문내역');
  xlsx.writeFile(newWorkbook, outputPath);
  
  return outputPath;
}

/**
 * 단일 파일 처리
 */
async function processSingleFile(filePath) {
  const workbook = xlsx.readFile(filePath, { 
    type: 'file',
    codepage: 65001,  // UTF-8
    raw: false
  });
  
  const format = detectExcelFormat(workbook);
  const orderData = extractOrderData(workbook, format);
  
  return {
    format: format.type,
    data: orderData,
    recordCount: orderData.length
  };
}

/**
 * 다중 파일 처리 및 통합
 */
async function processMultipleFiles(files, outputDir) {
  const allOrderData = [];
  const fileResults = [];

  // 각 파일 처리
  for (const file of files) {
    try {
      const result = await processSingleFile(file.path);
      
      allOrderData.push(...result.data);
      fileResults.push({
        fileName: file.originalname,
        format: result.format,
        recordCount: result.recordCount,
        success: true
      });
    } catch (error) {
      fileResults.push({
        fileName: file.originalname,
        success: false,
        error: error.message
      });
    }
  }

  // 통합 데이터 처리
  const mergedData = mergeOrderData(allOrderData);
  
  // 새로운 엑셀 파일로 저장
  const outputFileName = `통합주문내역_${Date.now()}.xlsx`;
  const outputPath = path.join(outputDir, outputFileName);
  
  // 출력 디렉토리가 없으면 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  saveToExcel(mergedData, outputPath);

  return {
    fileResults,
    totalRecords: mergedData.length,
    outputFileName,
    outputPath
  };
}

/**
 * CJ대한통운 업로드 양식으로 변환
 */
function convertToCJFormat(orders) {
  return orders.map((order, index) => ({
    '사용안함': '',
    '사용안함2': '',
    '고객주문번호': order.주문번호 || `ORDER_${index + 1}`,
    '운송장번호': order.송장번호 || '',
    '사용안함3': '',
    '사용안함4': '',
    '운임구분': '선불',  // 기본값: 선불
    '사용안함5': '',
    '사용안함6': '',
    '품목명': order.상품명 || '상품',
    '사용안함7': '',
    '사용안함8': '',
    '사용안함9': '',
    '받는분성명': order.수취인 || order.구매자명 || '',
    '받는분전화번호': order.연락처 || '',
    '받는분우편번호': '',  // 우편번호는 별도로 추출 필요
    '받는분주소(전체, 분할)': order.주소 || '',
    '배송메세지1': `${order.옵션 ? `[옵션: ${order.옵션}] ` : ''}수량: ${order.수량}개`
  }));
}

/**
 * CJ대한통운 양식 엑셀 파일 생성
 */
function saveToCJExcel(data, outputPath) {
  // CJ대한통운 형식으로 데이터 준비
  const exportData = convertToCJFormat(data);

  // 워크북 생성
  const newWorkbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.json_to_sheet(exportData);

  // 컬럼 너비 설정
  worksheet['!cols'] = [
    { wch: 10 }, // 사용안함
    { wch: 10 }, // 사용안함2
    { wch: 18 }, // 고객주문번호
    { wch: 15 }, // 운송장번호
    { wch: 10 }, // 사용안함3
    { wch: 10 }, // 사용안함4
    { wch: 10 }, // 운임구분
    { wch: 10 }, // 사용안함5
    { wch: 10 }, // 사용안함6
    { wch: 30 }, // 품목명
    { wch: 10 }, // 사용안함7
    { wch: 10 }, // 사용안함8
    { wch: 10 }, // 사용안함9
    { wch: 12 }, // 받는분성명
    { wch: 15 }, // 받는분전화번호
    { wch: 12 }, // 받는분우편번호
    { wch: 40 }, // 받는분주소
    { wch: 30 }  // 배송메세지1
  ];

  xlsx.utils.book_append_sheet(newWorkbook, worksheet, 'Sheet1');
  xlsx.writeFile(newWorkbook, outputPath);
  
  return outputPath;
}

/**
 * 다중 파일 처리 및 CJ대한통운 형식으로 통합
 */
async function processAndConvertToCJ(files, outputDir) {
  const allOrderData = [];
  const fileResults = [];

  // 각 파일 처리
  for (const file of files) {
    try {
      const result = await processSingleFile(file.path);
      
      allOrderData.push(...result.data);
      fileResults.push({
        fileName: file.originalname,
        format: result.format,
        recordCount: result.recordCount,
        success: true
      });
    } catch (error) {
      fileResults.push({
        fileName: file.originalname,
        success: false,
        error: error.message
      });
    }
  }

  // 통합 데이터 처리
  const mergedData = mergeOrderData(allOrderData);
  
  // 출력 디렉토리가 없으면 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 1. 표준 형식 엑셀 파일 생성
  const standardFileName = `통합주문내역_${Date.now()}.xlsx`;
  const standardPath = path.join(outputDir, standardFileName);
  saveToExcel(mergedData, standardPath);

  // 2. CJ대한통운 형식 엑셀 파일 생성
  const cjFileName = `CJ대한통운_업로드_${Date.now()}.xlsx`;
  const cjPath = path.join(outputDir, cjFileName);
  saveToCJExcel(mergedData, cjPath);

  return {
    fileResults,
    totalRecords: mergedData.length,
    standardFile: {
      fileName: standardFileName,
      path: standardPath,
      downloadUrl: `/api/order-import/download/${standardFileName}`
    },
    cjFile: {
      fileName: cjFileName,
      path: cjPath,
      downloadUrl: `/api/order-import/download/${cjFileName}`
    }
  };
}

module.exports = {
  detectExcelFormat,
  extractOrderData,
  mergeOrderData,
  saveToExcel,
  convertToCJFormat,
  saveToCJExcel,
  processSingleFile,
  processMultipleFiles,
  processAndConvertToCJ
};


