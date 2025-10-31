/**
 * 입고/출고 트랜잭션 검증 미들웨어
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

// 입고 트랜잭션 생성 검증
exports.validateReceiveTransaction = validate({
  body: z.object({
    itemId: z.coerce.number().positive("품목 ID는 양수여야 합니다"),
    factoryId: z.coerce.number().positive("공장 ID는 양수여야 합니다"),
    storageConditionId: z.coerce.number().positive("보관 조건 ID는 양수여야 합니다"),
    // barcode는 서버에서 자동 생성되므로 제거됨
    wholesalePrice: z.coerce.number().min(0, "도매가는 0 이상이어야 합니다"),
    quantity: z.coerce.number().positive("수량은 양수여야 합니다"),
    unit: z.string().trim().min(1, "단위는 필수입니다").max(10),
    receivedAt: z.coerce.date(),
    firstReceivedAt: z.coerce.date().optional(),
    note: z.string().trim().max(200, "비고는 200자 이하여야 합니다").optional(),
    // 라벨 프린트 옵션
    printLabel: z.boolean().default(false).optional(),
    labelSize: z.enum(["large", "medium", "small"]).default("large").optional(),
    labelQuantity: z.coerce.number().int().min(1).max(100).default(1).optional(),
  }),
});

// 출고 트랜잭션 생성 검증
exports.validateIssueTransaction = validate({
  body: z.object({
    itemId: z.coerce.number().positive("품목 ID는 양수여야 합니다"),
    factoryId: z.coerce.number().positive("공장 ID는 양수여야 합니다"),
    quantity: z.coerce.number().positive("수량은 양수여야 합니다"),
    unit: z.string().trim().min(1, "단위는 필수입니다").max(10),
    issueType: z
      .enum(["PRODUCTION", "SHIPPING", "DAMAGE", "OTHER"])
      .default("OTHER"),
    shippingInfo: z
      .object({
        recipientName: z.string().trim().max(50).optional(),
        recipientPhone: z.string().trim().max(20).optional(),
        recipientAddress: z.string().trim().max(200).optional(),
        shippingCompany: z.string().trim().max(50).optional(),
        trackingNumber: z.string().trim().max(100).optional(),
      })
      .optional(),
    note: z.string().trim().max(200, "비고는 200자 이하여야 합니다").optional(),
  }),
});

// 공장 간 이동 검증
exports.validateTransferTransaction = validate({
  body: z.object({
    itemId: z.coerce.number().positive("품목 ID는 양수여야 합니다"),
    sourceFactoryId: z.coerce
      .number()
      .positive("출발 공장 ID는 양수여야 합니다"),
    destFactoryId: z.coerce.number().positive("도착 공장 ID는 양수여야 합니다"),
    storageConditionId: z.coerce.number().positive("보관 조건 ID는 양수여야 합니다"),
    quantity: z.coerce.number().positive("수량은 양수여야 합니다"),
    unit: z.string().trim().min(1, "단위는 필수입니다").max(10),
    transferType: z.enum(["PRODUCTION", "RESTOCK", "OTHER"]).default("OTHER"),
    note: z.string().trim().max(200, "비고는 200자 이하여야 합니다").optional(),
  }),
});

// 트랜잭션 목록 조회 검증
exports.validateListTransactions = validate({
  query: z.object({
    type: z
      .enum(["RECEIVE", "ISSUE", "TRANSFER", "ALL"])
      .default("ALL")
      .optional(),
    itemId: z.coerce.number().positive().optional(),
    factoryId: z.coerce.number().positive().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    userId: z.coerce.number().positive().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

// 트랜잭션 상세 조회 검증
exports.validateTransactionId = (req, res, next) => {
  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      ok: false,
      message: "유효하지 않은 트랜잭션 ID입니다",
    });
  }
  req.params.id = id;
  next();
};

// 일괄 출고 검증 (배송 관리용)
exports.validateBatchIssue = validate({
  body: z.object({
    transactions: z
      .array(
        z.object({
          itemId: z.coerce.number().positive(),
          factoryId: z.coerce.number().positive(),
          quantity: z.coerce.number().positive(),
          unit: z.string().trim().min(1).max(10),
          recipientName: z.string().trim().max(50),
          recipientPhone: z.string().trim().max(20).optional(),
          recipientAddress: z.string().trim().max(200),
          shippingCompany: z.string().trim().max(50).optional(),
          trackingNumber: z.string().trim().max(100).optional(),
          note: z.string().trim().max(200).optional(),
        })
      )
      .min(1, "최소 1개 이상의 트랜잭션이 필요합니다")
      .max(100, "최대 100개까지 일괄 처리 가능합니다"),
  }),
});

// 통계 조회 검증
exports.validateTransactionStats = validate({
  query: z.object({
    factoryId: z.coerce.number().positive().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    groupBy: z.enum(["day", "week", "month"]).default("day").optional(),
  }),
});

