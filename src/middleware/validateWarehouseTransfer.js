/**
 * 공장/창고 간 이동 검증 미들웨어
 */
const { z } = require("zod");

function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.query) req.query = schemas.query.parse(req.query);
      if (schemas.body) req.body = schemas.body.parse(req.body);
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

// 공장/창고 간 이동 검증
exports.validateTransfer = validate({
  body: z.object({
    itemId: z.coerce.number().positive("품목 ID는 양수여야 합니다"),
    sourceLocationId: z.coerce
      .number()
      .positive("출발지 ID는 양수여야 합니다"),
    destLocationId: z.coerce.number().positive("도착지 ID는 양수여야 합니다"),
    storageConditionId: z.coerce.number().positive("보관 조건 ID는 양수여야 합니다"),
    quantity: z.coerce.number().positive("수량은 양수여야 합니다"),
    unit: z.string().trim().min(1, "단위는 필수입니다").max(10),
    transferType: z
      .enum([
        "PRODUCTION",       // 생산 공정 이동
        "WAREHOUSE_IN",     // 창고 입고
        "WAREHOUSE_OUT",    // 창고 출고
        "RESTOCK",          // 재입고
        "OTHER"
      ])
      .default("OTHER"),
    note: z.string().trim().max(200, "비고는 200자 이하여야 합니다").optional(),
  }),
});

// 이동 이력 조회 검증
exports.validateHistory = validate({
  query: z.object({
    itemId: z.coerce.number().positive().optional(),
    locationId: z.coerce.number().positive().optional(),
    sourceType: z
      .enum(["1PreProcessing", "2Manufacturing", "Warehouse"])
      .optional(),
    destType: z
      .enum(["1PreProcessing", "2Manufacturing", "Warehouse"])
      .optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

// 경로 통계 검증
exports.validatePathStats = validate({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

