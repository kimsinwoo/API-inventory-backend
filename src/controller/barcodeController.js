/**
 * 바코드 기반 물류 작업 컨트롤러
 */

const barcodeService = require("../services/barcodeService");
const asyncHandler = require("../middleware/asyncHandler");

/* ===============================
 * POST /api/barcode/generate-label
 * 라벨 프린트용 바코드 생성
 * =============================== */
exports.generateLabel = asyncHandler(async (req, res) => {
  const payload = req.body;

  const result = await barcodeService.generateBarcodeForLabel(payload);

  res.status(200).json({
    ok: true,
    message: "바코드 생성 완료 (라벨 프린트 준비)",
    data: result,
  });
});

/* ===============================
 * POST /api/barcode/receive
 * 최초 입고 (바코드 포함)
 * =============================== */
exports.receiveWithBarcode = asyncHandler(async (req, res) => {
  const userId = "staff@dogsnack.com"; // TODO: req.user.id
  const payload = req.body;

  const result = await barcodeService.receiveWithBarcode(payload, userId);

  res.status(200).json({
    ok: true,
    message: result.message,
    data: result.inventory,
  });
});

/* ===============================
 * GET /api/barcode/scan/:barcode
 * 바코드 스캔 - 재고 정보 조회
 * =============================== */
exports.scanBarcode = asyncHandler(async (req, res) => {
  const { barcode } = req.params;

  const result = await barcodeService.getInventoryByBarcode(barcode);

  res.status(200).json({
    ok: true,
    message: "바코드 조회 성공",
    data: result,
  });
});

/* ===============================
 * POST /api/barcode/transfer-out
 * 공장 이동 - 출고 (바코드 스캔)
 * =============================== */
exports.transferOut = asyncHandler(async (req, res) => {
  const userId = "staff@dogsnack.com"; // TODO: req.user.id
  const payload = req.body;

  const result = await barcodeService.transferOut(payload, userId);

  res.status(200).json({
    ok: true,
    message: result.message,
    data: result.transferOut,
  });
});

/* ===============================
 * POST /api/barcode/transfer-in
 * 공장 이동 - 입고 (바코드 입력)
 * =============================== */
exports.transferIn = asyncHandler(async (req, res) => {
  const userId = "staff@dogsnack.com"; // TODO: req.user.id
  const payload = req.body;

  const result = await barcodeService.transferIn(payload, userId);

  res.status(200).json({
    ok: true,
    message: result.message,
    data: result.transferIn,
  });
});

/* ===============================
 * POST /api/barcode/issue
 * 바코드 기반 출고
 * =============================== */
exports.issueByBarcode = asyncHandler(async (req, res) => {
  const userId = "staff@dogsnack.com"; // TODO: req.user.id
  const payload = req.body;

  const result = await barcodeService.issueByBarcode(payload, userId);

  res.status(200).json({
    ok: true,
    message: result.message,
    data: result.issued,
  });
});

/* ===============================
 * POST /api/barcode/ship
 * 바코드 배송 처리
 * =============================== */
exports.shipByBarcode = asyncHandler(async (req, res) => {
  const userId = "staff@dogsnack.com"; // TODO: req.user.id
  const payload = req.body;

  const result = await barcodeService.shipByBarcode(payload, userId);

  res.status(200).json({
    ok: true,
    message: result.message,
    data: result.shipping,
  });
});

/* ===============================
 * GET /api/barcode/history/:barcode
 * 바코드 이력 조회
 * =============================== */
exports.getBarcodeHistory = asyncHandler(async (req, res) => {
  const { barcode } = req.params;

  const result = await barcodeService.getBarcodeHistory(barcode);

  res.status(200).json({
    ok: true,
    message: "바코드 이력 조회 성공",
    data: result,
  });
});
