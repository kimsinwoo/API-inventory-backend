/**
 * 바코드 작업 요청 검증 미들웨어
 */

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
 * 바코드 기반 출고 검증
 * =============================== */
exports.validateBarcodeIssue = validate({
  body: z.object({
    barcode: barcodeSchema,
    quantity: z
      .number()
      .positive("출고 수량은 양수여야 합니다")
      .or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)),
    issueType: z
      .enum(["SHIPPING", "PRODUCTION", "DISPOSAL", "SAMPLE", "OTHER"], {
        errorMap: () => ({
          message: "유효한 출고 유형을 선택해주세요 (SHIPPING, PRODUCTION, DISPOSAL, SAMPLE, OTHER)",
        }),
      })
      .default("SHIPPING"),
    note: z.string().trim().optional(),
    customerName: z.string().trim().optional(),
    trackingNumber: z.string().trim().optional(),
  }),
});

/* ===============================
 * 바코드 기반 공장 이동 검증
 * =============================== */
exports.validateBarcodeTransfer = validate({
  body: z.object({
    barcode: barcodeSchema,
    quantity: z
      .number()
      .positive("이동 수량은 양수여야 합니다")
      .or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)),
    toFactoryId: z
      .number()
      .positive("목적지 공장 ID는 양수여야 합니다")
      .or(z.string().regex(/^\d+$/).transform(Number)),
    storageConditionId: z
      .number()
      .positive()
      .or(z.string().regex(/^\d+$/).transform(Number))
      .optional(),
    note: z.string().trim().optional(),
  }),
});

/* ===============================
 * 바코드 배송 처리 검증
 * =============================== */
exports.validateBarcodeShip = validate({
  body: z.object({
    barcode: barcodeSchema,
    quantity: z
      .number()
      .positive("배송 수량은 양수여야 합니다")
      .or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)),
    customerName: z.string().trim().min(1, "고객명을 입력해주세요"),
    customerAddress: z.string().trim().optional(),
    customerPhone: z.string().trim().optional(),
    shippingCompany: z
      .enum(["CJ대한통운", "롯데택배", "우체국택배", "한진택배", "로젠택배", "기타"], {
        errorMap: () => ({
          message: "유효한 택배사를 선택해주세요",
        }),
      })
      .optional(),
    trackingNumber: z.string().trim().optional(),
    shippingMessage: z.string().trim().optional(),
  }),
});

/* ===============================
 * 바코드 배치 조회 검증
 * =============================== */
exports.validateBatchScan = validate({
  body: z.object({
    barcodes: z
      .array(barcodeSchema)
      .min(1, "최소 1개 이상의 바코드가 필요합니다")
      .max(100, "한 번에 최대 100개의 바코드만 조회할 수 있습니다"),
  }),
});

