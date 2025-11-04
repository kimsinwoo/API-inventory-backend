/**
 * 생산 작업 지시서 검증 미들웨어
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

// 작업 지시서 생성 검증
exports.validateCreateWorkOrder = validate({
  body: z.object({
    productItemId: z.coerce.number().positive("완제품 ID는 양수여야 합니다"),
    bomId: z.coerce.number().positive("BOM ID는 양수여야 합니다"),
    factoryId: z.coerce.number().positive("공장 ID는 양수여야 합니다"),
    plannedQuantity: z.coerce.number().positive("계획 수량은 양수여야 합니다"),
    scheduledStartDate: z.string().datetime().optional(),
    scheduledEndDate: z.string().datetime().optional(),
    notes: z.string().trim().max(500, "비고는 500자 이하여야 합니다").optional(),
  }),
});

// 작업 지시서 목록 조회 검증
exports.validateListWorkOrders = validate({
  query: z.object({
    status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
    factoryId: z.coerce.number().positive().optional(),
    productItemId: z.coerce.number().positive().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

// 작업 지시서 ID 검증
exports.validateWorkOrderId = validate({
  params: z.object({
    id: z.coerce.number().positive("작업 지시서 ID는 양수여야 합니다"),
  }),
});

// 작업 지시서 수정 검증
exports.validateUpdateWorkOrder = validate({
  body: z.object({
    plannedQuantity: z.coerce.number().positive().optional(),
    scheduledStartDate: z.string().datetime().optional(),
    scheduledEndDate: z.string().datetime().optional(),
    notes: z.string().trim().max(500).optional(),
  }),
});

// 생산 완료 처리 검증
exports.validateCompleteWorkOrder = validate({
  body: z.object({
    actualQuantity: z.coerce.number().positive("실제 생산 수량은 양수여야 합니다").optional(),
    barcode: z.string().trim().optional(),
    storageConditionId: z.coerce.number().positive().optional(),
    wholesalePrice: z.coerce.number().min(0).optional(),
    notes: z.string().trim().max(500).optional(),
  }),
});

// 작업 취소 검증
exports.validateCancelWorkOrder = validate({
  body: z.object({
    reason: z.string().trim().max(500, "취소 사유는 500자 이하여야 합니다").optional(),
  }),
});

// 통계 조회 검증
exports.validateWorkOrderStats = validate({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    factoryId: z.coerce.number().positive().optional(),
  }),
});


