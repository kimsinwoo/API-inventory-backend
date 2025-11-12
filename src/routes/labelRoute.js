/**
 * 라벨 라우트
 * - 라벨 프린트
 * - 템플릿 저장/조회
 * - 프린터 목록 조회
 */

const express = require("express");
const router = express.Router();
const labelController = require("../controller/labelController");
const { z } = require("zod");

// Zod 검증 미들웨어
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
        detail: e.errors ?? String(e),
      });
    }
  };
}

/**
 * 프린터 목록 조회
 * GET /api/label/printers
 */
router.get("/printers", labelController.getPrinters);

/**
 * 라벨 프린트
 *  
 */
const validatePrintLabel = validate({
  body: z.object({
    templateType: z.enum(["large", "medium", "small", "verysmall"], {
      errorMap: () => ({ message: "templateType은 large, medium, small, verysmall 중 하나여야 합니다" }),
    }),
    itemId: z.union([
      z.number().int().positive("itemId는 1 이상이어야 합니다").max(999, "itemId는 999 이하여야 합니다"),
      z.string().regex(/^\d+$/, "itemId는 숫자여야 합니다").transform(Number).refine((val) => val >= 1 && val <= 999, "itemId는 1-999 사이여야 합니다"),
    ]),
    manufactureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "제조일자는 YYYY-MM-DD 형식이어야 합니다"),
    expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "유통기한은 YYYY-MM-DD 형식이어야 합니다"),
    printerName: z.string().optional(),
    printCount: z
      .number()
      .int()
      .positive()
      .default(1)
      .or(z.string().regex(/^\d+$/).transform(Number))
      .optional(),
    pdfOptions: z
      .object({
        width: z.string().optional(),
        height: z.string().optional(),
        margin: z.string().optional(),
      })
      .optional(),
    productName: z.string().optional(),
    storageCondition: z.string().optional(),
    registrationNumber: z.string().optional(),
    categoryAndForm: z.string().optional(),
    ingredients: z.string().optional(),
    rawMaterials: z.string().optional(),
    actualWeight: z.string().optional(),
    saveTemplate: z.boolean().default(false).optional(),
  }),
});

router.post("/print", validatePrintLabel, labelController.printLabel);

/**
 * 템플릿 저장 (데이터만)
 * POST /api/label/template
 */
const validateSaveTemplate = validate({
  body: z.object({
    labelType: z.enum(["large", "medium", "small", "verysmall"]),
    itemId: z
      .number()
      .int()
      .positive()
      .or(z.string().regex(/^\d+$/).transform(Number))
      .optional(),
    itemName: z.string().optional(),
    storageCondition: z.string().optional(),
    registrationNumber: z.string().optional(),
    categoryAndForm: z.string().optional(),
    ingredients: z.string().optional(),
    rawMaterials: z.string().optional(),
    actualWeight: z.string().optional(),
  }),
});

router.post("/template", validateSaveTemplate, labelController.saveTemplate);

/**
 * 템플릿 목록 조회
 * GET /api/label/templates
 */
const validateGetTemplates = validate({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default("1").optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).default("50").optional(),
  }),
});

router.get("/templates", validateGetTemplates, labelController.getTemplates);

/**
 * 템플릿 조회
 * GET /api/label/template/:templateId
 */
router.get("/template/:templateId", labelController.getTemplate);

module.exports = router;
