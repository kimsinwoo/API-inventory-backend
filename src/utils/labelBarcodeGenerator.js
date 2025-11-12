/**
 * 라벨용 바코드 생성 유틸리티
 * 
 * 바코드 형식 (15자리 숫자):
 * [아이템 ID(3자리)] + [제조일자 YYMMDD(6자리)] + [유통기한 YYMMDD(6자리)]
 * 
 * 예: 123240101250101
 *     └─┬─┘└──┬───┘└──┬───┘
 *     아이템  제조일자 유통기한
 * 
 * 특징:
 * - 아이템 ID는 최대 999까지 지원
 * - 제조일자와 유통기한은 YYMMDD 형식
 */

const bwipjs = require('bwip-js');
const dayjs = require('dayjs');

/**
 * 15자리 바코드 생성
 * @param {number} itemId - 아이템 ID (1-999)
 * @param {string} manufactureDate - 제조일자 (YYYY-MM-DD 형식)
 * @param {string} expiryDate - 유통기한 (YYYY-MM-DD 형식)
 * @returns {string} 15자리 바코드
 */
function generateLabelBarcode(itemId, manufactureDate, expiryDate) {
  try {
    // 아이템 ID 검증 및 포맷팅 (3자리, 앞에 0 패딩)
    if (!itemId || itemId < 1 || itemId > 999) {
      throw new Error('아이템 ID는 1-999 사이의 숫자여야 합니다');
    }
    const itemIdStr = String(itemId).padStart(3, '0');

    // 제조일자 검증 및 포맷팅 (YYMMDD)
    const manufacture = dayjs(manufactureDate);
    if (!manufacture.isValid()) {
      throw new Error('제조일자 형식이 올바르지 않습니다 (YYYY-MM-DD)');
    }
    const manufactureStr = manufacture.format('YYMMDD');

    // 유통기한 검증 및 포맷팅 (YYMMDD)
    const expiry = dayjs(expiryDate);
    if (!expiry.isValid()) {
      throw new Error('유통기한 형식이 올바르지 않습니다 (YYYY-MM-DD)');
    }
    const expiryStr = expiry.format('YYMMDD');

    // 유통기한이 제조일자보다 이전이면 오류
    if (expiry.isBefore(manufacture)) {
      throw new Error('유통기한이 제조일자보다 이전일 수 없습니다');
    }

    // 15자리 바코드 생성
    const barcode = `${itemIdStr}${manufactureStr}${expiryStr}`;

    if (barcode.length !== 15) {
      throw new Error(`바코드 길이가 올바르지 않습니다: ${barcode.length}자리`);
    }

    return barcode;
  } catch (error) {
    throw new Error(`바코드 생성 실패: ${error.message}`);
  }
}

/**
 * 바코드 이미지 생성 (Base64)
 * @param {string} barcode - 바코드 문자열 (15자리)
 * @returns {Promise<string>} Base64 인코딩된 PNG 이미지
 */
async function generateBarcodeImage(barcode) {
  try {
    if (!barcode || barcode.length !== 15 || !/^\d{15}$/.test(barcode)) {
      throw new Error('바코드는 15자리 숫자여야 합니다');
    }

    // Code128 형식으로 바코드 이미지 생성
    const png = await bwipjs.toBuffer({
      bcid: 'code128',
      text: barcode,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: 'center',
    });

    console.log(png.toString('base64'));
    return png.toString('base64');
  } catch (error) {
    throw new Error(`바코드 이미지 생성 실패: ${error.message}`);
  }
}

/**
 * 바코드 파싱
 * @param {string} barcode - 15자리 바코드
 * @returns {object} 파싱된 정보
 */
function parseLabelBarcode(barcode) {
  try {
    if (!barcode || barcode.length !== 15 || !/^\d{15}$/.test(barcode)) {
      return null;
    }

    const itemId = parseInt(barcode.substring(0, 3), 10);
    const manufactureYY = barcode.substring(3, 5);
    const manufactureMM = barcode.substring(5, 7);
    const manufactureDD = barcode.substring(7, 9);
    const expiryYY = barcode.substring(9, 11);
    const expiryMM = barcode.substring(11, 13);
    const expiryDD = barcode.substring(13, 15);

    // YY를 YYYY로 변환 (2000년대 가정)
    const manufactureYear = 2000 + parseInt(manufactureYY, 10);
    const expiryYear = 2000 + parseInt(expiryYY, 10);

    const manufactureDate = `${manufactureYear}-${manufactureMM}-${manufactureDD}`;
    const expiryDate = `${expiryYear}-${expiryMM}-${expiryDD}`;

    // 날짜 유효성 검증
    const manufacture = dayjs(manufactureDate);
    const expiry = dayjs(expiryDate);

    if (!manufacture.isValid() || !expiry.isValid()) {
      return null;
    }

    return {
      itemId,
      manufactureDate,
      expiryDate,
      isValid: true,
    };
  } catch (error) {
    console.error('바코드 파싱 오류:', error);
    return null;
  }
}

module.exports = {
  generateLabelBarcode,
  generateBarcodeImage,
  parseLabelBarcode,
};

