/**
 * 입고/출고 예정 트랜잭션 검증 미들웨어
 */
const { z } = require("zod");

function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.query) req.query = schemas.query.parse(req.query);
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      next();
    } catch (e) {
      res.status(400).json({
        ok: false,
        message: "입력값 검증 실패",
        detail: e.errors ?? String(e),
      });
    }
  };
}

// 예정 트랜잭션 생성 검증
exports.validateCreatePlanned = validate({
  body: z.object({
    transactionType: z.enum(["RECEIVE", "ISSUE"], {
      errorMap: () => ({ message: "RECEIVE 또는 ISSUE만 가능합니다" }),
    }),
    itemId: z.coerce.number().positive("품목 ID는 양수여야 합니다"),
    factoryId: z.coerce.number().positive("공장 ID는 양수여야 합니다"),
    quantity: z.coerce.number().positive("수량은 양수여야 합니다"),
    unit: z.string().trim().min(1).max(10).optional(), // ✅ 품목의 unit 자동 사용 (optional)
    scheduledDate: z.coerce.date({ errorMap: () => ({ message: "유효한 날짜를 입력하세요" }) }),
    // 입고용 필드
    supplierName: z.string().trim().max(100).optional(),
    barcode: z.string().trim().length(14, "바코드는 14자리여야 합니다").regex(/^\d{14}$/, "바코드는 숫자만 가능합니다").optional(),
    wholesalePrice: z.coerce.number().min(0).optional(),
    storageConditionId: z.coerce.number().positive().optional(),
    // 출고용 필드
    customerName: z.string().trim().max(100).optional(),
    issueType: z.enum(["PRODUCTION", "SHIPPING", "DAMAGE", "OTHER"]).optional(),
    shippingAddress: z.string().trim().max(200).optional(),
    // 공통
    notes: z.string().trim().max(1000).optional(),
  }),
});

// 예정 트랜잭션 수정 검증
exports.validateUpdatePlanned = validate({
  body: z.object({
    quantity: z.coerce.number().positive().optional(),
    unit: z.string().trim().min(1).max(10).optional(),
    scheduledDate: z.coerce.date().optional(),
    supplierName: z.string().trim().max(100).optional(),
    barcode: z.string().trim().length(14, "바코드는 14자리여야 합니다").regex(/^\d{14}$/, "바코드는 숫자만 가능합니다").optional(),
    wholesalePrice: z.coerce.number().min(0).optional(),
    storageConditionId: z.coerce.number().positive().optional(),
    customerName: z.string().trim().max(100).optional(),
    issueType: z.enum(["PRODUCTION", "SHIPPING", "DAMAGE", "OTHER"]).optional(),
    shippingAddress: z.string().trim().max(200).optional(),
    notes: z.string().trim().max(1000).optional(),
  }),
});

// 승인 검증
exports.validateApprovePlanned = validate({
  body: z.object({
    comment: z.string().trim().max(500).optional(),
  }),
});

// 거부/취소 검증
exports.validateRejectPlanned = validate({
  body: z.object({
    rejectionReason: z.string().trim().min(1, "거부 사유는 필수입니다").max(500),
  }),
});

// 완료 처리 검증 (입고 예정 → 실제 입고)
exports.validateCompletePlannedReceive = validate({
  body: z.object({
    receivedAt: z.coerce.date().optional(),
    actualQuantity: z.coerce.number().positive().optional(),
    actualLotNumber: z.string().trim().max(50).optional(),
    note: z.string().trim().max(200).optional(),
  }),
});

// 완료 처리 검증 (출고 예정 → 실제 출고)
exports.validateCompletePlannedIssue = validate({
  body: z.object({
    actualQuantity: z.coerce.number().positive().optional(),
    shippingInfo: z
      .object({
        recipientName: z.string().trim().max(50).optional(),
        recipientPhone: z.string().trim().max(20).optional(),
        recipientAddress: z.string().trim().max(200).optional(),
        shippingCompany: z.string().trim().max(50).optional(),
        trackingNumber: z.string().trim().max(100).optional(),
      })
      .optional(),
    note: z.string().trim().max(200).optional(),
  }),
});

// 목록 조회 검증
exports.validateListPlanned = validate({
  query: z.object({
    transactionType: z.enum(["RECEIVE", "ISSUE", "ALL"]).default("ALL").optional(),
    status: z.enum(["PENDING", "APPROVED", "COMPLETED", "CANCELLED", "ALL"]).default("ALL").optional(),
    itemId: z.coerce.number().positive().optional(),
    factoryId: z.coerce.number().positive().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

// ID 파라미터 검증
exports.validatePlannedId = (req, res, next) => {
  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      ok: false,
      message: "유효하지 않은 예정 트랜잭션 ID입니다",
    });
  }
  req.params.id = id;
  next();
};

