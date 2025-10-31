/**
 * 바코드 기반 물류 작업 라우트
 * 
 * 기능:
 * 1. 최초 입고: 라벨 프린트 → 입고 처리
 * 2. 공장 이동: 출고 (바코드 스캔) → 입고 (바코드 입력)
 * 3. 출고/배송: 바코드 스캔으로 출고
 */

const express = require("express");
const router = express.Router();
const barcodeController = require("../controller/barcodeController");
const { z } = require("zod");

// Zod 검증 미들웨어 헬퍼 함수
function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.query) req.query = schemas.query.parse(req.query);
      if (schemas.body) req.body = schemas.body.parse(req.body);
      next();
    } catch (e) {
      res.status(400).json({ 
        ok: false, 
        message: "ValidationError", 
        detail: e.errors ?? String(e) 
      });
    }
  };
}

// 바코드 형식 검증 (14자리 숫자)
const barcodeSchema = z
  .string()
  .trim()
  .length(14, "바코드는 14자리여야 합니다")
  .regex(/^\d{14}$/, "바코드는 숫자만 가능합니다");

/* ===============================
 * 라벨 프린트용 바코드 생성
 * =============================== */
/**
 * POST /api/barcode/generate-label
 * @desc 입고 전 라벨 프린트용 바코드 생성
 * @access Private
 */
const validateGenerateLabel = validate({
  body: z.object({
    itemId: z
      .number()
      .positive()
      .or(z.string().regex(/^\d+$/).transform(Number)),
    quantity: z
      .number()
      .positive()
      .or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)),
    receivedAt: z.string().datetime().optional(),
  }),
});

router.post("/generate-label", validateGenerateLabel, barcodeController.generateLabel);

/* ===============================
 * 최초 입고 (바코드 포함)
 * =============================== */
/**
 * POST /api/barcode/receive
 * @desc 라벨 프린트 후 입고 처리 (바코드 포함)
 * @access Private
 */
const validateReceive = validate({
  body: z.object({
    barcode: barcodeSchema,
    itemId: z
      .number()
      .positive()
      .or(z.string().regex(/^\d+$/).transform(Number)),
    factoryId: z
      .number()
      .positive()
      .or(z.string().regex(/^\d+$/).transform(Number)),
    storageConditionId: z
      .number()
      .positive()
      .or(z.string().regex(/^\d+$/).transform(Number)),
    wholesalePrice: z
      .number()
      .nonnegative()
      .or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)),
    quantity: z
      .number()
      .positive()
      .or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)),
    receivedAt: z.string().datetime().optional(),
    unit: z.string().trim().optional(),
    note: z.string().trim().optional(),
  }),
});

router.post("/receive", validateReceive, barcodeController.receiveWithBarcode);

/* ===============================
 * 바코드 스캔 (재고 조회)
 * =============================== */
/**
 * GET /api/barcode/scan/:barcode
 * @desc 바코드로 재고 정보 조회
 * @access Private
 */
router.get("/scan/:barcode", barcodeController.scanBarcode);

/* ===============================
 * 공장 이동 - 출고 (바코드 스캔)
 * =============================== */
/**
 * POST /api/barcode/transfer-out
 * @desc 공장 이동 출고 (바코드 스캔)
 * @access Private
 */
const validateTransferOut = validate({
  body: z.object({
    barcode: barcodeSchema,
    quantity: z
      .number()
      .positive()
      .or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)),
    toFactoryId: z
      .number()
      .positive()
      .or(z.string().regex(/^\d+$/).transform(Number)),
    note: z.string().trim().optional(),
  }),
});

router.post("/transfer-out", validateTransferOut, barcodeController.transferOut);

/* ===============================
 * 공장 이동 - 입고 (바코드 입력)
 * =============================== */
/**
 * POST /api/barcode/transfer-in
 * @desc 공장 이동 입고 (바코드 입력)
 * @access Private
 */
const validateTransferIn = validate({
  body: z.object({
    barcode: barcodeSchema,
    factoryId: z
      .number()
      .positive()
      .or(z.string().regex(/^\d+$/).transform(Number)),
    storageConditionId: z
      .number()
      .positive()
      .or(z.string().regex(/^\d+$/).transform(Number))
      .optional(),
    note: z.string().trim().optional(),
  }),
});

router.post("/transfer-in", validateTransferIn, barcodeController.transferIn);

/* ===============================
 * 바코드 기반 출고
 * =============================== */
/**
 * POST /api/barcode/issue
 * @desc 바코드로 즉시 출고
 * @access Private
 */
const validateIssue = validate({
  body: z.object({
    barcode: barcodeSchema,
    quantity: z
      .number()
      .positive()
      .or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)),
    issueType: z
      .enum(["SHIPPING", "PRODUCTION", "DISPOSAL", "SAMPLE", "OTHER"])
      .default("SHIPPING"),
    note: z.string().trim().optional(),
    customerName: z.string().trim().optional(),
    trackingNumber: z.string().trim().optional(),
  }),
});

router.post("/issue", validateIssue, barcodeController.issueByBarcode);

/* ===============================
 * 바코드 배송 처리
 * =============================== */
/**
 * POST /api/barcode/ship
 * @desc 바코드로 배송 처리 (고객 정보 포함)
 * @access Private
 */
const validateShip = validate({
  body: z.object({
    barcode: barcodeSchema,
    quantity: z
      .number()
      .positive()
      .or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)),
    customerName: z.string().trim().min(1),
    customerAddress: z.string().trim().optional(),
    customerPhone: z.string().trim().optional(),
    shippingCompany: z
      .enum(["CJ대한통운", "롯데택배", "우체국택배", "한진택배", "로젠택배", "기타"])
      .optional(),
    trackingNumber: z.string().trim().optional(),
    shippingMessage: z.string().trim().optional(),
  }),
});

router.post("/ship", validateShip, barcodeController.shipByBarcode);

/* ===============================
 * 바코드 이력 조회
 * =============================== */
/**
 * GET /api/barcode/history/:barcode
 * @desc 바코드의 전체 이동 이력 조회
 * @access Private
 */
router.get("/history/:barcode", barcodeController.getBarcodeHistory);

module.exports = router;
