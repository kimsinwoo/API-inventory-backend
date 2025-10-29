/**
 * 엑셀 생성 서비스
 * CJ대한통운 양식 및 출고 리스트 생성
 */
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");
const db = require("../../models");
const { Order } = db;
const excelParserService = require("./excelParserService");
const dayjs = require("dayjs");

/**
 * CJ대한통운 양식 파일 생성
 */
exports.generateCJLogisticsFile = async ({
  batchId,
  orderIds,
  issueType,
  templateId,
}) => {
  let orders;

  // 주문 조회
  if (orderIds && orderIds.length > 0) {
    orders = await Order.findAll({
      where: { id: orderIds },
    });
  } else if (batchId) {
    const where = { batch_id: batchId };
    if (issueType && issueType !== "ALL") {
      where.issue_type = issueType;
    }
    orders = await Order.findAll({ where });
  } else {
    throw new Error("batchId 또는 orderIds가 필요합니다");
  }

  if (orders.length === 0) {
    throw new Error("내보낼 주문이 없습니다");
  }

  // CJ 양식으로 변환
  const cjData = excelParserService.convertToCJLogistics(orders);

  // 엑셀 파일 생성
  const worksheet = XLSX.utils.json_to_sheet(cjData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "CJ대한통운");

  // 파일 저장
  const fileName = `CJ대한통운_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
  const outputDir = path.join(__dirname, "../../uploads/order-outputs");

  // 디렉토리 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePath = path.join(outputDir, fileName);
  XLSX.writeFile(workbook, filePath);

  return {
    fileName,
    downloadUrl: `/api/shipping/download/${fileName}`,
    orderCount: orders.length,
    summary: {
      totalWeight: cjData.reduce((sum, item) => sum + item.중량, 0),
      totalBoxes: cjData.reduce((sum, item) => sum + item.박스수, 0),
    },
  };
};

/**
 * 출고 리스트 엑셀 파일 생성
 */
exports.generateIssueListFile = async (issueListId, format = "excel") => {
  // 출고 리스트 데이터 조회
  const orders = await Order.findAll({
    where: { batch_id: issueListId },
    include: [
      {
        model: db.Items,
        as: "product",
      },
    ],
  });

  if (orders.length === 0) {
    throw new Error("출고할 주문이 없습니다");
  }

  // 상품별로 그룹화
  const itemGroups = {};

  orders.forEach((order) => {
    const key = order.product_code;

    if (!itemGroups[key]) {
      itemGroups[key] = {
        상품코드: order.product_code,
        상품명: order.product_name,
        총수량: 0,
        주문건수: 0,
        재고수량: order.product?.quantity || 0,
        부족수량: 0,
      };
    }

    itemGroups[key].총수량 += order.quantity;
    itemGroups[key].주문건수 += 1;
  });

  // 부족 수량 계산
  const issueListData = Object.values(itemGroups).map((item) => {
    item.부족수량 = Math.max(0, item.총수량 - item.재고수량);
    return item;
  });

  // 엑셀 파일 생성
  const worksheet = XLSX.utils.json_to_sheet(issueListData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "출고 리스트");

  // 주문 상세 시트 추가
  const orderDetails = orders.map((order) => ({
    주문번호: order.platform_order_number,
    플랫폼: order.platform,
    수령인: order.recipient_name,
    상품코드: order.product_code,
    상품명: order.product_name,
    수량: order.quantity,
    주소: order.recipient_address,
    배송메시지: order.shipping_message,
  }));

  const detailWorksheet = XLSX.utils.json_to_sheet(orderDetails);
  XLSX.utils.book_append_sheet(workbook, detailWorksheet, "주문 상세");

  // 파일 저장
  const fileName = `출고리스트_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
  const outputDir = path.join(__dirname, "../../uploads/order-outputs");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePath = path.join(outputDir, fileName);
  XLSX.writeFile(workbook, filePath);

  return filePath;
};

/**
 * 배송 라벨 데이터 생성
 */
exports.generateShippingLabels = async (orderIds) => {
  const orders = await Order.findAll({
    where: { id: orderIds },
  });

  return orders.map((order) => ({
    주문번호: order.platform_order_number,
    수령인: order.recipient_name,
    전화번호: order.recipient_phone,
    주소: order.recipient_address,
    상세주소: order.recipient_address_detail,
    우편번호: order.recipient_zipcode,
    상품명: order.product_name,
    수량: order.quantity,
    배송메시지: order.shipping_message,
    송장번호: order.tracking_number,
  }));
};

/**
 * 통합 주문서 엑셀 생성
 */
exports.generateIntegratedOrderFile = async (batchId) => {
  const orders = await Order.findAll({
    where: { batch_id: batchId },
    include: [
      {
        model: db.ShippingBatch,
        as: "batch",
      },
    ],
  });

  const data = orders.map((order) => ({
    플랫폼: order.platform,
    주문번호: order.platform_order_number,
    주문일: dayjs(order.order_date).format("YYYY-MM-DD"),
    주문자: order.customer_name,
    주문자연락처: order.customer_phone,
    수령인: order.recipient_name,
    수령인연락처: order.recipient_phone,
    주소: order.recipient_address,
    상세주소: order.recipient_address_detail,
    우편번호: order.recipient_zipcode,
    상품코드: order.product_code,
    상품명: order.product_name,
    수량: order.quantity,
    단가: order.unit_price,
    합계금액: order.total_price,
    배송메시지: order.shipping_message,
    송장번호: order.tracking_number,
    택배사: order.shipping_company,
    주문상태: order.order_status,
    배송상태: order.shipping_status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "통합 주문서");

  const fileName = `통합주문서_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
  const outputDir = path.join(__dirname, "../../uploads/order-outputs");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePath = path.join(outputDir, fileName);
  XLSX.writeFile(workbook, filePath);

  return {
    fileName,
    downloadUrl: `/api/shipping/download/${fileName}`,
    orderCount: orders.length,
  };
};

