/**
 * 엑셀 파싱 서비스
 * 다양한 플랫폼의 주문서를 파싱합니다
 */
const XLSX = require("xlsx");
const path = require("path");

/**
 * 플랫폼별 필드 매핑
 */
const PLATFORM_MAPPINGS = {
  COUPANG: {
    detection: ["묶음배송번호", "주문번호", "구매자"],
    mapping: {
      "주문번호": "platform_order_number",
      "구매자": "customer_name",
      "구매자전화번호": "customer_phone",
      "수취인": "recipient_name",
      "수취인전화번호": "recipient_phone",
      "배송지": "recipient_address",
      "우편번호": "recipient_zipcode",
      "상품명": "product_name",
      "옵션명": "product_option",
      "수량": "quantity",
      "판매가": "unit_price",
      "상품코드": "product_code",
      "배송메세지": "shipping_message",
    },
  },
  NAVER: {
    detection: ["상품주문번호", "수취인명", "배송지"],
    mapping: {
      "상품주문번호": "platform_order_number",
      "주문자명": "customer_name",
      "주문자연락처": "customer_phone",
      "수취인명": "recipient_name",
      "수취인연락처1": "recipient_phone",
      "배송지": "recipient_address",
      "우편번호": "recipient_zipcode",
      "상품명": "product_name",
      "옵션정보": "product_option",
      "수량": "quantity",
      "상품가격": "unit_price",
      "상품번호": "product_code",
      "배송메시지": "shipping_message",
    },
  },
  "11ST": {
    detection: ["주문번호", "수취인성명", "수취인주소"],
    mapping: {
      "주문번호": "platform_order_number",
      "구매자명": "customer_name",
      "구매자연락처": "customer_phone",
      "수취인성명": "recipient_name",
      "수취인연락처": "recipient_phone",
      "수취인주소": "recipient_address",
      "우편번호": "recipient_zipcode",
      "상품명": "product_name",
      "옵션": "product_option",
      "수량": "quantity",
      "판매단가": "unit_price",
      "상품코드": "product_code",
      "배송요청사항": "shipping_message",
    },
  },
  GMARKET: {
    detection: ["주문번호", "수령인", "주소"],
    mapping: {
      "주문번호": "platform_order_number",
      "주문자": "customer_name",
      "주문자연락처": "customer_phone",
      "수령인": "recipient_name",
      "수령인연락처": "recipient_phone",
      "주소": "recipient_address",
      "우편번호": "recipient_zipcode",
      "상품명": "product_name",
      "옵션": "product_option",
      "수량": "quantity",
      "판매가": "unit_price",
      "상품코드": "product_code",
      "배송메모": "shipping_message",
    },
  },
};

/**
 * 주문서 파일 파싱
 */
exports.parseOrderFile = async (file) => {
  const filePath = file.path;
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet);

  if (rawData.length === 0) {
    throw new Error("파일에 데이터가 없습니다");
  }

  // 플랫폼 감지
  const platform = detectPlatform(rawData[0]);

  if (!platform) {
    throw new Error("지원하지 않는 플랫폼 형식입니다");
  }

  // 데이터 변환
  const orders = rawData.map((row) => parseOrderRow(row, platform));

  return orders.filter((order) => order !== null);
};

/**
 * 플랫폼 자동 감지
 */
function detectPlatform(firstRow) {
  const headers = Object.keys(firstRow);

  for (const [platform, config] of Object.entries(PLATFORM_MAPPINGS)) {
    const hasAllDetectionFields = config.detection.every((field) =>
      headers.includes(field)
    );

    if (hasAllDetectionFields) {
      return platform;
    }
  }

  return null;
}

/**
 * 주문 행 파싱
 */
function parseOrderRow(row, platform) {
  const mapping = PLATFORM_MAPPINGS[platform].mapping;
  const order = {
    platform,
    order_date: new Date(),
  };

  // 필드 매핑
  for (const [excelField, dbField] of Object.entries(mapping)) {
    if (row[excelField] !== undefined) {
      order[dbField] = row[excelField];
    }
  }

  // 필수 필드 검증
  if (
    !order.platform_order_number ||
    !order.recipient_name ||
    !order.product_name
  ) {
    console.warn("필수 필드 누락:", row);
    return null;
  }

  // 데이터 정규화
  order.recipient_phone = normalizePhone(order.recipient_phone);
  order.customer_phone = normalizePhone(order.customer_phone);
  order.quantity = parseInt(order.quantity) || 1;
  order.unit_price = parseFloat(order.unit_price) || 0;
  order.total_price = order.quantity * order.unit_price;

  // 상품 코드가 없으면 생성
  if (!order.product_code) {
    order.product_code = generateProductCode(order.product_name);
  }

  return order;
}

/**
 * 전화번호 정규화
 */
function normalizePhone(phone) {
  if (!phone) return "";

  // 숫자만 추출
  let cleaned = String(phone).replace(/\D/g, "");

  // 010-1234-5678 형식으로 변환
  if (cleaned.length === 11) {
    return `${cleaned.substr(0, 3)}-${cleaned.substr(3, 4)}-${cleaned.substr(
      7,
      4
    )}`;
  } else if (cleaned.length === 10) {
    return `${cleaned.substr(0, 3)}-${cleaned.substr(3, 3)}-${cleaned.substr(
      6,
      4
    )}`;
  }

  return phone;
}

/**
 * 상품 코드 생성
 */
function generateProductCode(productName) {
  // 상품명에서 영문/숫자만 추출하여 코드 생성
  const cleaned = productName
    .replace(/[^a-zA-Z0-9가-힣]/g, "")
    .substring(0, 10)
    .toUpperCase();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `PROD-${cleaned}-${random}`;
}

/**
 * 송장 번호 파일 파싱
 */
exports.parseTrackingNumberFile = async (file) => {
  const filePath = file.path;
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet);

  return rawData
    .map((row) => ({
      orderId: row["주문ID"] || row["주문번호"],
      trackingNumber: row["송장번호"] || row["운송장번호"],
      shippingCompany: row["택배사"] || row["배송업체"] || "CJ대한통운",
    }))
    .filter((item) => item.orderId && item.trackingNumber);
};

/**
 * CJ대한통운 양식 데이터 변환
 */
exports.convertToCJLogistics = (orders) => {
  return orders.map((order) => ({
    "수령인명": order.recipient_name,
    "전화번호1": normalizePhoneForCJ(order.recipient_phone),
    "전화번호2": "",
    우편번호: order.recipient_zipcode || "",
    주소: extractMainAddress(order.recipient_address),
    상세주소: extractDetailAddress(order.recipient_address),
    품목명: order.product_name,
    수량: order.quantity,
    박스수: 1,
    중량: calculateWeight(order.quantity),
    요청사항: order.shipping_message || "",
    송장번호: order.tracking_number || "",
  }));
};

/**
 * CJ용 전화번호 변환 (숫자만)
 */
function normalizePhoneForCJ(phone) {
  if (!phone) return "";
  return String(phone).replace(/\D/g, "");
}

/**
 * 주소에서 기본 주소 추출
 */
function extractMainAddress(fullAddress) {
  if (!fullAddress) return "";
  // 상세주소 분리 (대충 구분)
  const parts = fullAddress.split(/[,\n]/);
  return parts[0] || fullAddress;
}

/**
 * 주소에서 상세 주소 추출
 */
function extractDetailAddress(fullAddress) {
  if (!fullAddress) return "";
  const parts = fullAddress.split(/[,\n]/);
  return parts.slice(1).join(", ") || "";
}

/**
 * 중량 계산 (임시)
 */
function calculateWeight(quantity) {
  return quantity * 1; // 1kg per item (임시)
}

