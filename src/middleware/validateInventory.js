const { z } = require("zod");

const enumStatus = z.enum(["Normal", "LowStock", "Expiring", "Expired"]).optional();
const enumCategory = z.enum(["RawMaterial", "SemiFinished", "Finished", "Supply"]).optional();

function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.query) req.query = schemas.query.parse(req.query);
      if (schemas.body) req.body = schemas.body.parse(req.body);
      next();
    } catch (e) {
      res.status(400).json({ ok: false, message: "ValidationError", detail: e.errors ?? String(e) });
    }
  };
}

exports.listRules = validate({
  query: z.object({
    itemId: z.coerce.number().positive().optional(),
    factoryId: z.coerce.number().positive().optional(),
    status: enumStatus,
    category: enumCategory,
    search: z.string().trim().min(1).max(50).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

exports.summaryRules = validate({
  query: z.object({
    factoryId: z.coerce.number().positive().optional(),
  }),
});

exports.movementListRules = validate({
  query: z.object({
    itemId: z.coerce.number().positive().optional(),
    factoryId: z.coerce.number().positive().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

exports.receiveRules = validate({
  body: z.object({
    itemId: z.coerce.number().positive(),
    factoryId: z.coerce.number().positive(),
    storageConditionId: z.coerce.number().positive(),
    lotNumber: z.string().trim().min(1).max(50),
    wholesalePrice: z.coerce.number().min(0),
    quantity: z.coerce.number().positive(),
    unit: z.string().trim().min(1).max(10),
    receivedAt: z.coerce.date(),
    firstReceivedAt: z.coerce.date().optional(),
    // expirationDate는 item.expiration_date를 통해 자동 계산됨
    note: z.string().trim().max(200).optional(),
    actorName: z.string().trim().max(50).optional(),
  }),
});

exports.issueRules = validate({
  body: z.object({
    itemId: z.coerce.number().positive(),
    factoryId: z.coerce.number().positive(),
    quantity: z.coerce.number().positive(),
    unit: z.string().trim().min(1).max(10),
    note: z.string().trim().max(200).optional(),
    actorName: z.string().trim().max(50).optional(),
  }),
});

exports.transferRules = validate({
  body: z.object({
    itemId: z.coerce.number().positive(),
    sourceFactoryId: z.coerce.number().positive(),
    destFactoryId: z.coerce.number().positive().refine((v, ctx) => v !== ctx.parent?.sourceFactoryId, { message: "destFactoryId must differ" }),
    storageConditionId: z.coerce.number().positive(),
    quantity: z.coerce.number().positive(),
    unit: z.string().trim().min(1).max(10),
    note: z.string().trim().max(200).optional(),
    actorName: z.string().trim().max(50).optional(),
  }),
});
