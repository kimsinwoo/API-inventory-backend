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

/* ===============================
 * 사용 가능한 프린터 목록 조회
 * =============================== */
/**
 * GET /api/barcode/printers
 * @desc Windows에서 사용 가능한 프린터 목록 조회
 * @access Private
 */
router.get("/printers", barcodeController.getPrinters);

/* ===============================
 * Finished 카테고리 품목 조회 (라벨용)
 * =============================== */
/**
 * GET /api/barcode/items/finished
 * @desc Finished 카테고리 품목만 조회 (라벨 생성용)
 * @access Private
 */
router.get("/items/finished", barcodeController.getFinishedItems);

/* ===============================
 * 라벨 생성 및 조회
 * =============================== */
/**
 * POST /api/barcode/labels
 * @desc 라벨 생성 및 저장
 * @access Private
 */
const validateCreateLabel = validate({
  body: z.object({
    itemId: z
      .number()
      .int()
      .positive("itemId는 1 이상이어야 합니다")
      .or(z.string().regex(/^\d+$/).transform(Number)),
    inventoryId: z
      .number()
      .int()
      .positive("inventoryId는 1 이상이어야 합니다")
      .or(z.string().regex(/^\d+$/).transform(Number)),
    barcode: z.string().min(1, "barcode가 필요합니다"),
    quantity: z
      .number()
      .positive()
      .or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number))
      .optional(),
    unit: z.string().optional(),
  }),
});

router.post("/labels", validateCreateLabel, barcodeController.createLabel);

/**
 * GET /api/barcode/labels/barcode/:barcode
 * @desc 바코드로 라벨 조회
 * @access Private
 */
router.get("/labels/barcode/:barcode", barcodeController.getLabelsByBarcode);

/**
 * GET /api/barcode/labels/inventory/:inventoryId
 * @desc 재고 ID로 라벨 조회
 * @access Private
 */
router.get("/labels/inventory/:inventoryId", barcodeController.getLabelsByInventoryId);

/**
 * GET /api/barcode/labels/:labelId
 * @desc 라벨 ID로 라벨 조회
 * @access Private
 */
router.get("/labels/:labelId", barcodeController.getLabelById);

/**
 * GET /api/barcode/labels
 * @desc 저장된 라벨 전체 조회 (page, limit 지원)
 * @access Private
 */
router.get("/labels", barcodeController.getAllLabels);

/**
 * GET /api/barcode/labeltemplates/registration/:registrationNumber
 * @desc registration_number로 LabelTemplate 조회
 * @access Private
 */
router.get("/labeltemplates/registration/:registrationNumber", barcodeController.getLabelTemplateByRegistrationNumber);

/* ===============================
 * React 컴포넌트를 PDF로 변환 후 바로 프린트
 * =============================== */
/**
 * POST /api/barcode/print-label
 * @desc React 컴포넌트 HTML을 받아서 PDF로 변환 후 바로 프린트
 * @access Private
 */
const validatePrintLabel = validate({
  body: z
    .object({
      htmlContent: z.string().min(1, "htmlContent가 필요합니다"),
      printerName: z.string().min(1).optional(), // 클라우드 환경에서는 선택사항
      printCount: z
        .number()
        .int()
        .positive("printCount는 1 이상이어야 합니다")
        .or(z.string().regex(/^\d+$/).transform(Number))
        .default(1),
      pdfOptions: z
        .object({
          width: z.string().optional(),
          height: z.string().optional(),
          margin: z.string().optional(),
        })
        .optional(),
      labelType: z.string().optional(),
      productName: z.string().optional(),
      storageCondition: z.string().optional(),
      registrationNumber: z.string().optional(),
      categoryAndForm: z.string().optional(),
      ingredients: z.string().optional(),
      rawMaterials: z.string().optional(),
      actualWeight: z.string().optional(),
      itemId: z
        .number()
        .int()
        .positive()
        .or(z.string().regex(/^\d+$/).transform(Number))
        .optional(),
    })
    .passthrough(),
});

router.post("/print-label", validatePrintLabel, barcodeController.printLabelFromReact);

/* ===============================
 * 저장된 라벨 출력
 * =============================== */
/**
 * POST /api/barcode/print-saved-label
 * @desc 저장된 라벨을 HTML로 변환 후 PDF로 변환하여 프린트
 * @access Private
 */
const validatePrintSavedLabel = validate({
  body: z.object({
    labelId: z
      .number()
      .int()
      .positive("labelId는 1 이상이어야 합니다")
      .or(z.string().regex(/^\d+$/).transform(Number)),
    printerName: z.string().min(1).optional(), // 클라우드 환경에서는 선택사항
    manufactureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "제조일자는 YYYY-MM-DD 형식이어야 합니다"),
    expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "유통기한은 YYYY-MM-DD 형식이어야 합니다"),
    printCount: z
      .number()
      .int()
      .positive("printCount는 1 이상이어야 합니다")
      .or(z.string().regex(/^\d+$/).transform(Number))
      .default(1),
    pdfOptions: z
      .object({
        width: z.string().optional(),
        height: z.string().optional(),
        margin: z.string().optional(),
      })
      .optional(),
  }),
});

router.post("/print-saved-label", validatePrintSavedLabel, barcodeController.printSavedLabel);

module.exports = router;
