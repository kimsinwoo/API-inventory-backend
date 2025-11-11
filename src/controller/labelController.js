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
const { Items } = db;
const asyncHandler = require("../middleware/asyncHandler");

/**
 * 프린터 목록 조회
 * GET /api/label/printers
 */
exports.getPrinters = asyncHandler(async (req, res) => {
  try {
    const printers = await labelPrintService.getAvailablePrinters();

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
 * POST /api/label/print
 */
exports.printLabel = asyncHandler(async (req, res) => {
  try {
    const {
      templateType, // large, medium, small, verysmall
      itemId,
      manufactureDate, // YYYY-MM-DD
      expiryDate, // YYYY-MM-DD
      printerName,
      printCount = 1,
      pdfOptions = {},
      // 템플릿별 추가 데이터
      productName,
      storageCondition,
      registrationNumber,
      categoryAndForm,
      ingredients,
      rawMaterials,
      actualWeight,
      // 템플릿 저장 여부
      saveTemplate = false,
    } = req.body;

    // 필수 파라미터 검증
    if (!templateType) {
      return res.status(400).json({
        ok: false,
        message: "templateType이 필요합니다 (large, medium, small, verysmall)",
      });
    }

    if (!itemId) {
      return res.status(400).json({
        ok: false,
        message: "itemId가 필요합니다",
      });
    }

    if (!manufactureDate) {
      return res.status(400).json({
        ok: false,
        message: "manufactureDate가 필요합니다 (YYYY-MM-DD)",
      });
    }

    if (!expiryDate) {
      return res.status(400).json({
        ok: false,
        message: "expiryDate가 필요합니다 (YYYY-MM-DD)",
      });
    }

    // 날짜 형식 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(manufactureDate) || !dateRegex.test(expiryDate)) {
      return res.status(400).json({
        ok: false,
        message: "날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)",
      });
    }

    // 아이템 ID 숫자 변환
    const itemIdNum = Number(itemId);
    if (!itemIdNum || itemIdNum < 1 || itemIdNum > 999) {
      return res.status(400).json({
        ok: false,
        message: "itemId는 1-999 사이의 숫자여야 합니다",
      });
    }

    // 아이템 조회
    const item = await Items.findByPk(itemIdNum);
    if (!item) {
      return res.status(404).json({
        ok: false,
        message: `아이템을 찾을 수 없습니다 (ID: ${itemIdNum})`,
      });
    }

    // 날짜 유효성 검증 (유통기한이 제조일자보다 이후인지 확인)
    const manufacture = new Date(manufactureDate);
    const expiry = new Date(expiryDate);
    if (isNaN(manufacture.getTime()) || isNaN(expiry.getTime())) {
      return res.status(400).json({
        ok: false,
        message: "날짜 형식이 올바르지 않습니다",
      });
    }
    if (expiry < manufacture) {
      return res.status(400).json({
        ok: false,
        message: "유통기한이 제조일자보다 이전일 수 없습니다",
      });
    }

    // 바코드 생성 (15자리)
    let barcode;
    let barcodeBase64;
    try {
      barcode = generateLabelBarcode(itemIdNum, manufactureDate, expiryDate);
      barcodeBase64 = await generateBarcodeImage(barcode);
    } catch (error) {
      console.error("바코드 생성 실패:", error);
      return res.status(400).json({
        ok: false,
        message: `바코드 생성 실패: ${error.message}`,
      });
    }

    // 템플릿 데이터 준비 (모든 템플릿에서 사용할 수 있도록 모든 변수 포함)
    const templateData = {
      productName: productName || item.name || '',
      manufactureDate,
      expiryDate,
      barcodeNumber: barcode,
      barcodeBase64,
      storageCondition: storageCondition || '냉동',
      registrationNumber: registrationNumber || item.code || '',
      categoryAndForm: categoryAndForm || '',
      ingredients: ingredients || '',
      rawMaterials: rawMaterials || '',
      actualWeight: actualWeight || '',
      isLoadingBarcode: false, // verysmall 템플릿용
    };

    // 템플릿 저장 (선택사항)
    let templateRecord = null;
    if (saveTemplate) {
      try {
        // HTML 컨텐츠는 프린트 후 생성된 것을 저장할 수 있지만,
        // 여기서는 데이터만 저장
        templateRecord = await labelTemplateService.saveTemplate({
          itemId: itemIdNum,
          itemName: item.name,
          labelType: templateType,
          storageCondition: templateData.storageCondition,
          registrationNumber: templateData.registrationNumber,
          categoryAndForm: templateData.categoryAndForm,
          ingredients: templateData.ingredients,
          rawMaterials: templateData.rawMaterials,
          actualWeight: templateData.actualWeight,
          htmlContent: null, // 데이터만 저장
          printerName: printerName || null,
          printCount: Number(printCount) || 1,
          printStatus: 'PENDING',
        });
      } catch (templateError) {
        console.error("템플릿 저장 실패 (계속 진행):", templateError.message);
      }
    }

    // 라벨 프린트
    const printResult = await labelPrintService.printLabel({
      templateType,
      templateData,
      printerName: printerName || undefined,
      printCount: Number(printCount),
      pdfOptions,
    });

    // 템플릿 결과 업데이트
    if (templateRecord && templateRecord.id) {
      try {
        await labelTemplateService.updateTemplateResult(templateRecord.id, {
          success: printResult.success,
          errorMessage: printResult.success ? null : printResult.error,
        });
      } catch (updateError) {
        console.error("템플릿 결과 업데이트 실패:", updateError.message);
      }
    }

    // 응답 반환
    const statusCode = printResult.success ? 200 : 500;
    res.status(statusCode).json({
      ok: printResult.success,
      message: printResult.message,
      data: {
        templateId: templateRecord?.id || null,
        barcode,
        printCount: printResult.printCount,
        printerName: printResult.printerName || null,
        filePath: printResult.filePath || null,
        mode: printResult.mode || 'unknown',
        printedAt: printResult.success ? new Date().toISOString() : null,
        error: printResult.error || null,
      },
    });
  } catch (error) {
    console.error("라벨 프린트 컨트롤러 에러:", error);
    res.status(500).json({
      ok: false,
      message: `라벨 프린트 처리 중 오류가 발생했습니다: ${error.message}`,
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

