/**
 * 배송 관리 컨트롤러
 */
const shippingService = require("../services/shippingService");
const excelParserService = require("../services/excelParserService");
const excelGeneratorService = require("../services/excelGeneratorService");
const path = require("path");
const fs = require("fs");

/**
 * 다중 플랫폼 주문서 업로드
 */
exports.uploadOrders = async (req, res) => {
  const files = req.files;
  const { batchName, issueType = "B2C" } = req.body;

  if (!files || files.length === 0) {
    return res.status(400).json({
      ok: false,
      message: "업로드할 파일이 없습니다",
    });
  }

  const result = await shippingService.processUploadedOrders(
    files,
    batchName,
    issueType
  );

  res.status(200).json({
    ok: true,
    message: "주문서가 성공적으로 업로드되었습니다",
    data: result,
  });
};

/**
 * 주문 목록 조회
 */
exports.getOrders = async (req, res) => {
  const {
    batchId,
    platform,
    orderStatus,
    shippingStatus,
    issueType,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 20,
  } = req.query;

  const result = await shippingService.getOrders({
    batchId,
    platform,
    orderStatus,
    shippingStatus,
    issueType,
    startDate,
    endDate,
    search,
    page: parseInt(page),
    limit: parseInt(limit),
  });

  res.status(200).json({
    ok: true,
    data: result,
  });
};

/**
 * 주문 상세 조회
 */
exports.getOrderDetail = async (req, res) => {
  const { id } = req.params;

  const order = await shippingService.getOrderById(id);

  if (!order) {
    return res.status(404).json({
      ok: false,
      message: "주문을 찾을 수 없습니다",
    });
  }

  res.status(200).json({
    ok: true,
    data: order,
  });
};

/**
 * 주문 정보 수정
 */
exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const updatedOrder = await shippingService.updateOrder(id, updateData);

  res.status(200).json({
    ok: true,
    message: "주문 정보가 수정되었습니다",
    data: updatedOrder,
  });
};

/**
 * 주문 삭제
 */
exports.deleteOrder = async (req, res) => {
  const { id } = req.params;

  await shippingService.deleteOrder(id);

  res.status(200).json({
    ok: true,
    message: "주문이 삭제되었습니다",
  });
};

/**
 * CJ대한통운 양식으로 내보내기
 */
exports.exportToCJLogistics = async (req, res) => {
  const { batchId, orderIds, issueType = "ALL", templateId } = req.body;

  const result = await excelGeneratorService.generateCJLogisticsFile({
    batchId,
    orderIds,
    issueType,
    templateId,
  });

  res.status(200).json({
    ok: true,
    message: "CJ대한통운 양식 파일이 생성되었습니다",
    data: result,
  });
};

/**
 * 파일 다운로드
 */
exports.downloadFile = async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(
    __dirname,
    "../../uploads/order-outputs",
    filename
  );

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      ok: false,
      message: "파일을 찾을 수 없습니다",
    });
  }

  res.download(filePath);
};

/**
 * 출고 리스트 자동 생성
 */
exports.generateIssueList = async (req, res) => {
  const { batchId, issueType, issueDate } = req.body;

  const result = await shippingService.generateIssueList({
    batchId,
    issueType,
    issueDate,
  });

  res.status(200).json({
    ok: true,
    message: "출고 리스트가 생성되었습니다",
    data: result,
  });
};

/**
 * 출고 리스트 엑셀 내보내기
 */
exports.exportIssueList = async (req, res) => {
  const { id } = req.params;
  const { format = "excel" } = req.query;

  const filePath = await excelGeneratorService.generateIssueListFile(
    id,
    format
  );

  res.download(filePath);
};

/**
 * 출고 처리 (재고 연동)
 */
exports.processIssue = async (req, res) => {
  const { id } = req.params;
  const { factoryId, note, actorName } = req.body;

  const result = await shippingService.processIssue({
    issueListId: id,
    factoryId,
    note,
    actorName,
  });

  res.status(200).json({
    ok: true,
    message: "출고 처리가 완료되었습니다",
    data: result,
  });
};

/**
 * 송장 번호 일괄 등록
 */
exports.bulkUpdateTrackingNumbers = async (req, res) => {
  const { orderIds, trackingNumbers, shippingCompany } = req.body;

  if (!orderIds || !trackingNumbers || orderIds.length !== trackingNumbers.length) {
    return res.status(400).json({
      ok: false,
      message: "주문 ID와 송장 번호 개수가 일치해야 합니다",
    });
  }

  const result = await shippingService.bulkUpdateTrackingNumbers({
    orderIds,
    trackingNumbers,
    shippingCompany,
  });

  res.status(200).json({
    ok: true,
    message: "송장 번호가 등록되었습니다",
    data: result,
  });
};

/**
 * 송장 번호 엑셀 업로드
 */
exports.uploadTrackingNumbers = async (req, res) => {
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({
      ok: false,
      message: "업로드할 파일이 없습니다",
    });
  }

  const result = await shippingService.uploadTrackingNumbers(files[0]);

  res.status(200).json({
    ok: true,
    message: "송장 번호가 업로드되었습니다",
    data: result,
  });
};

/**
 * 배치 목록 조회
 */
exports.getBatches = async (req, res) => {
  const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

  const result = await shippingService.getBatches({
    status,
    startDate,
    endDate,
    page: parseInt(page),
    limit: parseInt(limit),
  });

  res.status(200).json({
    ok: true,
    data: result,
  });
};

/**
 * 배치 상세 조회
 */
exports.getBatchDetail = async (req, res) => {
  const { id } = req.params;

  const batch = await shippingService.getBatchById(id);

  if (!batch) {
    return res.status(404).json({
      ok: false,
      message: "배치를 찾을 수 없습니다",
    });
  }

  res.status(200).json({
    ok: true,
    data: batch,
  });
};

/**
 * 배치 확정
 */
exports.confirmBatch = async (req, res) => {
  const { id } = req.params;
  const { confirmedBy } = req.body;

  const result = await shippingService.confirmBatch(id, confirmedBy);

  res.status(200).json({
    ok: true,
    message: "배치가 확정되었습니다",
    data: result,
  });
};

/**
 * 배치 삭제
 */
exports.deleteBatch = async (req, res) => {
  const { id } = req.params;

  await shippingService.deleteBatch(id);

  res.status(200).json({
    ok: true,
    message: "배치가 삭제되었습니다",
  });
};

