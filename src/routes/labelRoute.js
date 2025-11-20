/**
 * 라벨 라우트
 * - 라벨 프린트
 * - 템플릿 저장/조회
 * - 프린터 목록 조회
 */

const express = require('express');
const { z } = require('zod');
const labelController = require('../controller/labelController');
// const { authenticate } = require("../utils/sessionAuth");
// const { requirePermission } = require("../middleware/permissionMiddleware");

const router = express.Router();

// Zod 검증 미들웨어
function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      next();
    } catch (error) {
      res.status(400).json({
        ok: false,
        message: 'ValidationError',
        detail: error.errors ?? String(error)
      });
    }
  };
}

/**
 * 프린터 목록 조회
 * GET /api/label/printers
 * - cloud 모드에서는 [] 리턴하도록 controller/service 에서 처리
 */
router.get('/printers', /* authenticate, requirePermission("can_label"), */ labelController.getPrinters);

/**
 * 라벨 프린트
 * POST /api/label/print
 */
const validatePrintSavedLabelPdf = validate({
  body: z.object({
    // ✅ itemId: 숫자 또는 숫자 문자열 → number 변환
    itemId: z
      .union([
        z
          .number({
            required_error: 'labelId는 숫자여야 합니다'
          })
          .int('labelId는 정수여야 합니다')
          .positive('labelId는 1 이상이어야 합니다'),
        z
          .string({
            required_error: 'labelId는 숫자여야 합니다'
          })
          .regex(/^\d+$/, 'labelId는 숫자여야 합니다')
          .transform((val) => Number(val))
          .refine((val) => Number.isInteger(val) && val > 0, {
            message: 'labelId는 1 이상의 정수여야 합니다'
          })
      ])
      .transform((val) => Number(val)),

    // ✅ templateType: large | medium | small | verysmall
    templateType: z.enum(['large', 'medium', 'small', 'verysmall'], {
      errorMap: () => ({
        message: 'templateType은 large, medium, small, verysmall 중 하나여야 합니다'
      })
    }),

    // ✅ 제조일자
    manufactureDate: z
      .string({
        required_error: '제조일자는 필수입니다'
      })
      .regex(/^\d{4}-\d{2}-\d{2}$/, '제조일자는 YYYY-MM-DD 형식이어야 합니다'),

    // ✅ 유통기한
    expiryDate: z
      .string({
        required_error: '유통기한은 필수입니다'
      })
      .regex(/^\d{4}-\d{2}-\d{2}$/, '유통기한은 YYYY-MM-DD 형식이어야 합니다'),

    // ✅ printCount: 선택, 기본값 1
    printCount: z
      .union([
        z
          .number()
          .int('printCount는 정수여야 합니다')
          .positive('printCount는 1 이상이어야 합니다'),
        z
          .string()
          .regex(/^\d+$/, 'printCount는 숫자여야 합니다')
          .transform((val) => Number(val))
          .refine((val) => Number.isInteger(val) && val > 0, {
            message: 'printCount는 1 이상의 정수여야 합니다'
          })
      ])
      .optional()
      .default(1)
  })
});

router.post('/pdf', /* authenticate, requirePermission("can_label"), */ validatePrintSavedLabelPdf, labelController.printSavedLabelPdf);

/**
 * 템플릿 저장 (데이터만)
 * POST /api/label/template
 */
const validateSaveTemplate = validate({
  body: z.object({
    labelType: z.enum(['large', 'medium', 'small', 'verysmall']),
    itemId: z
      .union([
        z.number().int().positive(),
        z
          .string()
          .regex(/^\d+$/)
          .transform((val) => Number(val))
          .refine((val) => Number.isInteger(val) && val > 0, {
            message: 'itemId는 1 이상의 정수여야 합니다'
          })
      ])
      .optional(),
    itemName: z.string().optional(),
    storageCondition: z.string().optional(),
    registrationNumber: z.string().optional(),
    categoryAndForm: z.string().optional(),
    ingredients: z.string().optional(),
    rawMaterials: z.string().optional(),
    actualWeight: z.string().optional()
  })
});

router.post('/template', /* authenticate, requirePermission("can_label"), */ validateSaveTemplate, labelController.saveTemplate);

/**
 * 템플릿 목록 조회
 * GET /api/label/templates
 */
const validateGetTemplates = validate({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/)
      .transform((val) => Number(val))
      .optional()
      .default(1),
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform((val) => Number(val))
      .optional()
      .default(50)
  })
});

router.get('/templates', /* authenticate, requirePermission("can_label"), */ validateGetTemplates, labelController.getTemplates);

/**
 * 템플릿 단일 조회
 * GET /api/label/template/:templateId
 */
router.get('/template/:templateId', /* authenticate, requirePermission("can_label"), */ labelController.getTemplate);

module.exports = router;
