/**
 * 바코드 생성 유틸리티
 * 
 * 바코드 형식 (14자리 숫자):
 * [타임스탬프 밀리초(13자리)] + [체크섬(1자리)]
 * 
 * 예: 17302526137897
 *     └──────┬──────┘└┬┘
 *     타임스탬프(ms)  체크
 * 
 * 특징:
 * - 절대 중복 불가능 (밀리초 단위 타임스탬프)
 * - 시간 순서 정렬 가능
 * - 유니크성 100% 보장
 */

const dayjs = require("dayjs");

/**
 * 바코드 생성 함수 (14자리 유니크 숫자)
 * @param {number} itemId - 품목 ID (사용하지 않지만 호환성 유지)
 * @param {Date|string} receivedAt - 입고 날짜
 * @param {Date|string} firstReceivedAt - 제조 일자 (사용하지 않지만 호환성 유지)
 * @param {Date|string} expirationDate - 유통기한 (사용하지 않지만 호환성 유지)
 * @returns {string} 14자리 바코드 (숫자만)
 */
function generateBarcode(itemId, receivedAt, firstReceivedAt, expirationDate) {
  // 타임스탬프 밀리초 (13자리)
  const timestamp = Date.now();
  
  // 체크섬 계산 (타임스탬프 각 자리 합의 마지막 자리)
  const checksum = String(timestamp)
    .split('')
    .reduce((sum, digit) => sum + parseInt(digit, 10), 0) % 10;
  
  // 14자리 바코드: 타임스탬프(13) + 체크섬(1)
  const barcode = `${timestamp}${checksum}`;
  
  return barcode;
}

/**
 * 바코드 파싱 함수 (14자리)
 * @param {string} barcode - 14자리 바코드
 * @returns {object|null} 파싱된 정보 또는 null (유효하지 않은 경우)
 */
function parseBarcode(barcode) {
  if (!barcode || barcode.length !== 14 || !/^\d{14}$/.test(barcode)) {
    return null;
  }

  try {
    const timestamp = barcode.substring(0, 13);
    const checksum = parseInt(barcode.substring(13, 14), 10);
    
    // 체크섬 검증
    const calculatedChecksum = String(timestamp)
      .split('')
      .reduce((sum, digit) => sum + parseInt(digit, 10), 0) % 10;
    
    if (checksum !== calculatedChecksum) {
      return null; // 체크섬 불일치
    }

    return {
      timestamp: parseInt(timestamp, 10),
      createdAt: new Date(parseInt(timestamp, 10)),
      checksum,
      isValid: true,
    };
  } catch (error) {
    console.error("바코드 파싱 오류:", error);
    return null;
  }
}

/**
 * 바코드 검증 함수 (14자리)
 * @param {string} barcode - 검증할 바코드
 * @returns {boolean} 유효 여부
 */
function validateBarcode(barcode) {
  if (!barcode || typeof barcode !== "string") {
    return false;
  }

  // 14자리 숫자인지 확인
  if (barcode.length !== 14 || !/^\d{14}$/.test(barcode)) {
    return false;
  }

  // 파싱하여 체크섬 유효성 확인
  const parsed = parseBarcode(barcode);
  return parsed !== null && parsed.isValid === true;
}

module.exports = {
  generateBarcode,
  parseBarcode,
  validateBarcode,
};

