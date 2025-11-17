/**
 * 라벨 컨트롤러
 * - 라벨 프린트 처리
 * - 템플릿 저장
 * - 프린터 목록 조회
 */

const labelPrintService = require("../services/labelPrintService");
const labelTemplateService = require("../services/labelTemplateService");
const { generateLabelBarcode, generateBarcodeImage } = require("../utils/labelBarcodeGenerator");
const db = require("../../models");
const { Items, LabelTemplate } = db;
const asyncHandler = require("../middleware/asyncHandler");
const axios = require('axios');
const { where } = require("sequelize");

/**
 * 프린터 목록 조회
 * GET /api/label/printers
 */
exports.getPrinters = asyncHandler(async (req, res) => {
  try {
    const printers = await axios.get('http://210.90.113.200/printers')

    if (!printers || printers.length === 0) {
      return res.status(200).json({
        ok: true,
        message: "프린터가 발견되지 않았습니다.",
        data: [],
        warning: "프린터가 설치되어 있지 않거나 클라우드 환경일 수 있습니다.",
      });
    }

    res.status(200).json({
      ok: true,
      message: `프린터 목록 조회 성공 (${printers.length}개)`,
      data: printers,
    });
  } catch (error) {
    console.error("프린터 목록 조회 에러:", error);
    res.status(500).json({
      ok: false,
      message: "프린터 목록 조회 중 오류가 발생했습니다",
      error: error.message,
      data: [],
    });
  }
});

/**
 * 라벨 프린트
 * POST /api/label/pdf
 */
exports.printSavedLabelPdf = asyncHandler(async (req, res) => {
  try {
    console.log('요청 들어옴 /label/pdf, body:', req.body);

    const {
      itemId,        // ✅ 이제 labelId가 아니라 itemId
      templateType,  // large, medium, small, verysmall
      printCount = 1,
      manufactureDate,
      expiryDate,
    } = req.body || {};

    // ---- 기본 검증 (Zod에서 1차로 검증하지만, 여기서도 방어적으로 한 번 더) ----
    if (!itemId) {
      return res.status(400).json({
        ok: false,
        message: 'itemId가 필요합니다.',
      });
    }

    if (!templateType) {
      return res.status(400).json({
        ok: false,
        message:
          'templateType이 필요합니다. (large, medium, small, verysmall)',
      });
    }

    if (!manufactureDate || !expiryDate) {
      return res.status(400).json({
        ok: false,
        message: 'manufactureDate, expiryDate가 필요합니다.',
      });
    }

    // ---- 템플릿 조회 (item_id 기준) ----
    const template = await LabelTemplate.findOne({
      where: { item_id: itemId },
    });

    if (!template) {
      return res.status(404).json({
        ok: false,
        message: `LabelTemplate을 찾을 수 없습니다 (item_id: ${itemId})`,
      });
    }

    console.log('템플릿 데이터:', template?.toJSON?.() ?? template);

    // ---- 품목 조회 ----
    const itemIdNum = Number(template.item_id || template.itemId || itemId);
    const item = await Items.findByPk(itemIdNum);

    if (!item) {
      return res.status(404).json({
        ok: false,
        message: `아이템을 찾을 수 없습니다 (ID: ${itemIdNum})`,
      });
    }

    // ---- 바코드 생성 + 이미지 ----
    const barcode = generateLabelBarcode(itemIdNum, manufactureDate, expiryDate);
    const barcodeBase64 = await generateBarcodeImage(barcode);

    // ---- 라벨 EJS에서 사용할 필드 구성 ----
    const templateData = {
      productName: template.item_name || template.itemName || item.name || '',
      manufactureDate,
      expiryDate,
      barcodeNumber: barcode,
      barcodeBase64,
      storageCondition:
        template.storage_condition || template.storageCondition || '냉동',
      registrationNumber:
        template.registration_number || template.registrationNumber || '',
      categoryAndForm:
        template.category_and_form || template.categoryAndForm || '',
      ingredients: template.ingredients || '',
      rawMaterials: template.raw_materials || template.rawMaterials || '',
      actualWeight: template.actual_weight || template.actualWeight || '',
      isLoadingBarcode: false,
    };

    // ==========================================
    // ✅ PDF 버퍼만 생성 (프린트 X, returnPdfBuffer: true)
    // ==========================================
    const printResult = await labelPrintService.printLabel({
      templateType,
      templateData,
      printCount: Number(printCount) || 1,
      returnPdfBuffer: true,
    });

    console.log(
      '[printSavedLabelPdf] labelPrintService.printLabel 결과 타입:',
      typeof printResult,
      printResult && printResult.constructor
        ? printResult.constructor.name
        : null,
    );

    if (!printResult || printResult.success === false) {
      return res.status(500).json({
        ok: false,
        message:
          printResult?.message ||
          'PDF 버퍼 생성에 실패했습니다.',
        error: printResult?.error || null,
      });
    }

    // ------------------------------
    // 🔍 pdfBuffer 실제 위치/타입 유연하게 처리
    // ------------------------------
    let rawPdf =
      printResult.pdfBuffer ??
      printResult.buffer ??
      printResult.data?.pdfBuffer ??
      printResult.data?.buffer ??
      printResult.data ??
      printResult;

    console.log(
      '[printSavedLabelPdf] rawPdf 타입:',
      typeof rawPdf,
      rawPdf && rawPdf.constructor
        ? rawPdf.constructor.name
        : null,
    );

    // ---- rawPdf → base64 문자열로 통일 ----
    let pdfBase64;

    if (Buffer.isBuffer(rawPdf)) {
      // ✅ 진짜 Buffer인 경우
      pdfBase64 = rawPdf.toString('base64');
    } else if (rawPdf instanceof Uint8Array) {
      // ✅ Uint8Array인 경우
      pdfBase64 = Buffer.from(rawPdf).toString('base64');
    } else if (Array.isArray(rawPdf) && rawPdf.every((n) => typeof n === 'number')) {
      // ✅ [37,80,68,...] 같은 number[] 인 경우
      pdfBase64 = Buffer.from(rawPdf).toString('base64');
    } else if (typeof rawPdf === 'string') {
      const trimmed = rawPdf.trim();

      // "37,80,68,..." 이런 CSV 숫자 문자열일 수도 있음
      const looksLikeCsv = /^[0-9]+(,[0-9]+)*$/.test(trimmed);
      if (looksLikeCsv) {
        const bytes = trimmed.split(',').map((n) => Number(n));
        pdfBase64 = Buffer.from(bytes).toString('base64');
      } else {
        // 그 외는 이미 base64라고 가정
        pdfBase64 = trimmed;
      }
    } else {
      // 🔴 여기까지 왔다 = 정말로 이상한 타입
      console.error(
        '[printSavedLabelPdf] PDF 버퍼 형식 오류, rawPdf:',
        rawPdf,
      );
      return res.status(500).json({
        ok: false,
        message: 'PDF 버퍼 형식이 올바르지 않습니다.',
      });
    }

    console.log('[printSavedLabelPdf] pdfBase64 length:', pdfBase64.length);

    // 최종 응답
    return res.status(200).json({
      ok: true,
      message: `PDF 버퍼 생성 완료 (${Number(printCount) || 1}개 라벨)`,
      data: {
        templateId: template.id,
        barcode,
        printCount: Number(printCount) || 1,
        pdfBase64, // ✅ 항상 base64 string 으로 반환
      },
    });
  } catch (error) {
    console.error('printSavedLabelPdf 에러:', error);
    return res.status(500).json({
      ok: false,
      message: `PDF 생성 중 오류가 발생했습니다: ${error.message}`,
      error: error.message,
    });
  }
});

/**
 * 템플릿 저장 (데이터만)
 * POST /api/label/template
 */
exports.saveTemplate = asyncHandler(async (req, res) => {
  try {
    const {
      labelType,
      itemId,
      itemName,
      storageCondition,
      registrationNumber,
      categoryAndForm,
      ingredients,
      rawMaterials,
      actualWeight,
    } = req.body;

    // 필수 파라미터 검증
    if (!labelType) {
      return res.status(400).json({
        ok: false,
        message: "labelType이 필요합니다",
      });
    }

    // 템플릿 저장
    const template = await labelTemplateService.saveTemplate({
      itemId: itemId ? Number(itemId) : null,
      itemName: itemName || null,
      labelType,
      storageCondition: storageCondition || null,
      registrationNumber: registrationNumber || null,
      categoryAndForm: categoryAndForm || null,
      ingredients: ingredients || null,
      rawMaterials: rawMaterials || null,
      actualWeight: actualWeight || null,
      htmlContent: null, // 데이터만 저장
      printerName: null,
      printCount: 1,
      printStatus: 'PENDING',
    });

    res.status(201).json({
      ok: true,
      message: "템플릿이 성공적으로 저장되었습니다",
      data: {
        id: template.id,
        labelType: template.label_type,
        itemId: template.item_id,
        itemName: template.item_name,
        createdAt: template.created_at,
      },
    });
  } catch (error) {
    console.error("템플릿 저장 컨트롤러 에러:", error);
    res.status(500).json({
      ok: false,
      message: `템플릿 저장 중 오류가 발생했습니다: ${error.message}`,
      error: error.message,
    });
  }
});

/**
 * 템플릿 목록 조회
 * GET /api/label/templates
 */
exports.getTemplates = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const result = await labelTemplateService.getTemplates({
      page: Number(page),
      limit: Number(limit),
    });

    res.status(200).json({
      ok: true,
      message: "템플릿 목록 조회 성공",
      data: result.rows,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.count,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error("템플릿 목록 조회 에러:", error);
    res.status(500).json({
      ok: false,
      message: `템플릿 목록 조회 중 오류가 발생했습니다: ${error.message}`,
      error: error.message,
    });
  }
});

/**
 * 템플릿 조회
 * GET /api/label/template/:templateId
 */
exports.getTemplate = asyncHandler(async (req, res) => {
  try {
    const { templateId } = req.params;

    const template = await labelTemplateService.getTemplate(Number(templateId));

    if (!template) {
      return res.status(404).json({
        ok: false,
        message: "템플릿을 찾을 수 없습니다",
      });
    }

    res.status(200).json({
      ok: true,
      message: "템플릿 조회 성공",
      data: template,
    });
  } catch (error) {
    console.error("템플릿 조회 에러:", error);
    res.status(500).json({
      ok: false,
      message: `템플릿 조회 중 오류가 발생했습니다: ${error.message}`,
      error: error.message,
    });
  }
});

