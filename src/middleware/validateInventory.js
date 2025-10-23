const { body, query, validationResult } = require("express-validator");

// 공통 유틸
const handle = (req,res,next) => {
  const r = validationResult(req);
  if (!r.isEmpty()) return res.status(400).json({ ok:false, message:"유효성 검사 실패", errors:r.array() });
  next();
};

// GET /inventories
exports.listRules = [
  query("itemId").optional().isInt().toInt(),
  query("factoryId").optional().isInt().toInt(),
  query("status").optional().isIn(["Normal","LowStock","Expiring","Expired"]),
  handle,
];

// POST /inventories/receive
exports.receiveRules = [
  body("itemId").isInt({min:1}).toInt(),
  body("factoryId").isInt({min:1}).toInt(),
  body("storageConditionId").isInt({min:1}).toInt(),
  body("lotNumber").isString().trim().notEmpty(),
  body("wholesalePrice").isFloat({ gt: 0 }),
  body("quantity").isFloat({ gt: 0 }),
  body("receivedAt").isISO8601().toDate(),
  body("firstReceivedAt").optional().isISO8601().toDate(),
  body("expirationDate").isISO8601().toDate(),
  body("unit").isString().trim().notEmpty(),
  handle,
];

// POST /inventories/issue
exports.issueRules = [
  body("itemId").isInt({min:1}).toInt(),
  body("factoryId").isInt({min:1}).toInt(),
  body("quantity").isFloat({ gt: 0 }),
  body("unit").isString().trim().notEmpty(),
  handle,
];

// POST /inventories/transfer
exports.transferRules = [
  body("itemId").isInt({min:1}).toInt(),
  body("sourceFactoryId").isInt({min:1}).toInt(),
  body("destFactoryId").isInt({min:1}).toInt(),
  body("storageConditionId").isInt({min:1}).toInt(),
  body("quantity").isFloat({ gt: 0 }),
  body("unit").isString().trim().notEmpty(),
  handle,
];

exports.handleValidation = handle;
