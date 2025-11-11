/**
 * 바코드 기반 물류 작업 컨트롤러
 * - 라벨 생성, 조회, 프린트 기능 제공
 * - 환경별 프린터 처리 (로컬/클라우드)
 */

const barcodeService = require("../services/barcodeService");
const labelService = require("../services/labelService");
const labelPrintService = require("../services/labelPrintService");
const labelTemplateService = require("../services/labelTemplateService");
const asyncHandler = require("../middleware/asyncHandler");
const db = require("../../models");
const { Items, Inventories } = db;

/* ===============================
 * POST /api/barcode/generate-label
 * 라벨 프린트용 바코드 생성
 * =============================== */
exports.generateLabel = asyncHandler(async (req, res) => {
  const payload = req.body;

  const result = await barcodeService.generateBarcodeForLabel(payload);

  res.status(200).json({
    ok: true,
    message: "바코드 생성 완료 (라벨 프린트 준비)",
    data: result,
  });
});

/* ===============================
 * POST /api/barcode/receive
 * 최초 입고 (바코드 포함)
 * =============================== */
exports.receiveWithBarcode = asyncHandler(async (req, res) => {
  const userId = "staff@dogsnack.com"; // TODO: req.user.id
  const payload = req.body;

  const result = await barcodeService.receiveWithBarcode(payload, userId);

  res.status(200).json({
    ok: true,
    message: result.message,
    data: result.inventory,
  });
});

/* ===============================
 * GET /api/barcode/scan/:barcode
 * 바코드 스캔 - 재고 정보 조회
 * =============================== */
exports.scanBarcode = asyncHandler(async (req, res) => {
  const { barcode } = req.params;

  const result = await barcodeService.getInventoryByBarcode(barcode);

  res.status(200).json({
    ok: true,
    message: "바코드 조회 성공",
    data: result,
  });
});

/* ===============================
 * POST /api/barcode/transfer-out
 * 공장 이동 - 출고 (바코드 스캔)
 * =============================== */
exports.transferOut = asyncHandler(async (req, res) => {
  const userId = "staff@dogsnack.com"; // TODO: req.user.id
  const payload = req.body;

  const result = await barcodeService.transferOut(payload, userId);

  res.status(200).json({
    ok: true,
    message: result.message,
    data: result.transferOut,
  });
});

/* ===============================
 * POST /api/barcode/transfer-in
 * 공장 이동 - 입고 (바코드 입력)
 * =============================== */
exports.transferIn = asyncHandler(async (req, res) => {
  const userId = "staff@dogsnack.com"; // TODO: req.user.id
  const payload = req.body;

  const result = await barcodeService.transferIn(payload, userId);

  res.status(200).json({
    ok: true,
    message: result.message,
    data: result.transferIn,
  });
});

/* ===============================
 * POST /api/barcode/issue
 * 바코드 기반 출고
 * =============================== */
exports.issueByBarcode = asyncHandler(async (req, res) => {
  const userId = "staff@dogsnack.com"; // TODO: req.user.id
  const payload = req.body;

  const result = await barcodeService.issueByBarcode(payload, userId);

  res.status(200).json({
    ok: true,
    message: result.message,
    data: result.issued,
  });
});

/* ===============================
 * POST /api/barcode/ship
 * 바코드 배송 처리
 * =============================== */
exports.shipByBarcode = asyncHandler(async (req, res) => {
  const userId = "staff@dogsnack.com"; // TODO: req.user.id
  const payload = req.body;

  const result = await barcodeService.shipByBarcode(payload, userId);

  res.status(200).json({
    ok: true,
    message: result.message,
    data: result.shipping,
  });
});

/* ===============================
 * GET /api/barcode/history/:barcode
 * 바코드 이력 조회
 * =============================== */
exports.getBarcodeHistory = asyncHandler(async (req, res) => {
  const { barcode } = req.params;

  const result = await barcodeService.getBarcodeHistory(barcode);

  res.status(200).json({
    ok: true,
    message: "바코드 이력 조회 성공",
    data: result,
  });
});

/* ===============================
 * GET /api/barcode/printers
 * 사용 가능한 프린터 목록 조회
 * =============================== */
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

/* ===============================
 * GET /api/barcode/items/finished
 * Finished 카테고리 품목만 조회 (라벨용)
 * =============================== */
exports.getFinishedItems = asyncHandler(async (req, res) => {
  const finishedItems = await Items.findAll({
    where: {
      category: "Finished",
    },
    attributes: ["id", "code", "name", "unit"],
    order: [["name", "ASC"]],
  });

  res.status(200).json({
    ok: true,
    message: "Finished 카테고리 품목 조회 성공",
    data: finishedItems.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      unit: item.unit,
    })),
  });
});

/* ===============================
 * POST /api/barcode/labels
 * 라벨 생성 및 저장
 * =============================== */
exports.createLabel = asyncHandler(async (req, res) => {
  const { itemId, inventoryId, barcode, quantity, unit } = req.body;

  // 품목 조회 및 Finished 카테고리 확인
  const item = await Items.findByPk(itemId);
  if (!item) {
    return res.status(404).json({
      ok: false,
      message: "품목을 찾을 수 없습니다",
    });
  }

  if (item.category !== "Finished") {
    return res.status(400).json({
      ok: false,
      message: "라벨은 Finished 카테고리(완제품)만 저장할 수 있습니다",
    });
  }

  // 재고 조회
  const inventory = await Inventories.findByPk(inventoryId);
  if (!inventory) {
    return res.status(404).json({
      ok: false,
      message: "재고를 찾을 수 없습니다",
    });
  }

  // 라벨 저장
  const labelData = {
    inventoryId,
    barcode,
    itemId,
    productName: item.name,
    registrationCode: item.code,
    quantity: Number(quantity) || inventory.quantity,
    unit: unit || inventory.unit,
    labelSize: "large", // 기본값
  };

  const savedLabel = await labelService.saveLabel(labelData);

  res.status(201).json({
    ok: true,
    message: "라벨이 성공적으로 저장되었습니다",
    data: {
      id: savedLabel.id,
      barcode: savedLabel.barcode,
      productName: savedLabel.product_name,
      registrationCode: savedLabel.registration_code,
      quantity: savedLabel.quantity,
      unit: savedLabel.unit,
      labelSize: savedLabel.label_size,
    },
  });
});

/* ===============================
 * GET /api/barcode/labels/barcode/:barcode
 * 바코드로 라벨 조회
 * =============================== */
exports.getLabelsByBarcode = asyncHandler(async (req, res) => {
  const { barcode } = req.params;
  const labels = await labelService.getLabelsByBarcode(barcode);

  res.status(200).json({
    ok: true,
    message: "라벨 조회 성공",
    data: labels,
  });
});

/* ===============================
 * GET /api/barcode/labels/inventory/:inventoryId
 * 재고 ID로 라벨 조회
 * =============================== */
exports.getLabelsByInventoryId = asyncHandler(async (req, res) => {
  const { inventoryId } = req.params;
  const labels = await labelService.getLabelsByInventoryId(Number(inventoryId));

  res.status(200).json({
    ok: true,
    message: "라벨 조회 성공",
    data: labels,
  });
});

/* ===============================
 * GET /api/barcode/labels/:labelId
 * 라벨 ID로 라벨 조회
 * =============================== */
exports.getLabelById = asyncHandler(async (req, res) => {
  const { labelId } = req.params;
  const label = await labelService.getLabelById(Number(labelId));

  if (!label) {
    return res.status(404).json({
      ok: false,
      message: "라벨을 찾을 수 없습니다",
    });
  }

  res.status(200).json({
    ok: true,
    message: "라벨 조회 성공",
    data: label,
  });
});

/* ===============================
 * GET /api/barcode/labels
 * 저장된 라벨 전체 조회 (옵셔널 페이지네이션)
 * =============================== */
exports.getAllLabels = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query || {};
  const { rows, count } = await labelService.getAllLabels({
    page: Number(page),
    limit: Number(limit),
  });

  res.status(200).json({
    ok: true,
    message: "라벨 전체 조회 성공",
    data: rows,
    meta: { page: Number(page), limit: Number(limit), total: count },
  });
});

/* ===============================
 * GET /api/barcode/labeltemplates/registration/:registrationNumber
 * registration_number로 LabelTemplate 조회
 * =============================== */
exports.getLabelTemplateByRegistrationNumber = asyncHandler(async (req, res) => {
  const { registrationNumber } = req.params;

  if (!registrationNumber) {
    return res.status(400).json({
      ok: false,
      message: "등록번호가 필요합니다",
    });
  }

  const labelTemplate = await labelService.getLabelTemplateByRegistrationNumber(
    registrationNumber
  );

  if (!labelTemplate) {
    return res.status(404).json({
      ok: false,
      message: "해당 등록번호의 라벨 템플릿을 찾을 수 없습니다",
    });
  }

  res.status(200).json({
    ok: true,
    message: "라벨 템플릿 조회 성공",
    data: labelTemplate,
  });
});

/* ===============================
 * POST /api/barcode/print-label
 * React 컴포넌트를 받아서 PDF로 변환 후 바로 프린트
 * =============================== */
exports.printLabelFromReact = asyncHandler(async (req, res) => {
  const {
    htmlContent,
    printCount = 1,
    pdfOptions = {},
    printerName,
    labelType,
    productName,
    storageCondition,
    registrationNumber,
    categoryAndForm,
    ingredients,
    rawMaterials,
    actualWeight,
    itemId,
  } = req.body;

  // 템플릿 기록 생성 (실패해도 계속 진행)
  let templateRecord = null;
  try {
    templateRecord = await labelTemplateService.createTemplate({
      itemId: itemId ? Number(itemId) : null,
      itemName: productName,
      labelType,
      storageCondition,
      registrationNumber,
      categoryAndForm,
      ingredients,
      rawMaterials,
      actualWeight,
      htmlContent,
      printerName: printerName || null,
      printCount: Number(printCount),
      printStatus: "PENDING",
    });
  } catch (templateError) {
    console.error("라벨 템플릿 저장 실패 (계속 진행):", templateError.message);
  }

  // 프린트 실행
  const result = await labelPrintService.printLabelFromReact({
    htmlContent,
    printCount: Number(printCount),
    pdfOptions,
    printerName: printerName || undefined, // 클라우드 환경에서는 undefined 가능
  });

  // 템플릿 기록 업데이트
  if (templateRecord?.id) {
    try {
      await labelTemplateService.markResult(templateRecord.id, {
        success: result.success,
        errorMessage: result.success ? null : result.error,
      });
    } catch (markError) {
      console.error("템플릿 결과 업데이트 실패:", markError.message);
    }
  }

  // 응답 반환
  const statusCode = result.success ? 200 : 500;
  res.status(statusCode).json({
    ok: result.success,
    message: result.message,
    data: {
      templateId: templateRecord?.id ?? null,
      printCount: result.printCount,
      printerName: result.printerName || null,
      filePath: result.filePath || null,
      mode: result.mode || "unknown",
      printedAt: result.success ? new Date().toISOString() : null,
      error: result.error || null,
    },
  });
});

/* ===============================
 * POST /api/barcode/print-saved-label
 * 저장된 라벨을 HTML로 변환 후 PDF로 변환하여 프린트
 * =============================== */
exports.printSavedLabel = asyncHandler(async (req, res) => {
  const {
    labelId,
    printCount = 1,
    pdfOptions = {},
    printerName,
    manufactureDate,
    expiryDate,
  } = req.body;

  // 라벨 조회
  const label = await labelService.getLabelById(Number(labelId));
  if (!label) {
    return res.status(404).json({
      ok: false,
      message: "라벨을 찾을 수 없습니다",
    });
  }

  // 라벨 HTML 생성 (제조일자, 유통기한 포함)
  const labelHtml = await labelService.generateLabelFromRecord(label, {
    manufactureDate,
    expiryDate,
  });

  // 템플릿 기록 생성 (실패해도 계속 진행)
  let templateRecord = null;
  try {
    templateRecord = await labelTemplateService.createTemplate({
      itemId: label.item_id ?? null,
      itemName: label.product_name ?? null,
      labelType: label.label_size ?? null,
      storageCondition: label.label_data?.storageCondition ?? null,
      registrationNumber: label.registration_code ?? null,
      categoryAndForm: label.label_data?.categoryAndForm ?? null,
      ingredients: label.label_data?.ingredients ?? null,
      rawMaterials: label.label_data?.rawMaterials ?? null,
      actualWeight: label.label_data?.actualWeight ?? null,
      htmlContent: labelHtml.html,
      printerName: printerName || null,
      printCount: Number(printCount),
      printStatus: "PENDING",
    });
  } catch (templateError) {
    console.error("저장된 라벨 템플릿 기록 실패 (계속 진행):", templateError.message);
  }

  // PDF로 변환 후 프린트
  const result = await labelPrintService.printLabelFromReact({
    htmlContent: labelHtml.html,
    printCount: Number(printCount),
    pdfOptions: {
      width: pdfOptions.width || "50mm",
      height: pdfOptions.height || "30mm",
      margin: pdfOptions.margin || "0mm",
    },
    printerName: printerName || undefined,
  });

  // 템플릿 기록 업데이트
  if (templateRecord?.id) {
    try {
      await labelTemplateService.markResult(templateRecord.id, {
        success: result.success,
        errorMessage: result.success ? null : result.error,
      });
    } catch (markError) {
      console.error("템플릿 결과 업데이트 실패:", markError.message);
    }
  }

  // 응답 반환
  const statusCode = result.success ? 200 : 500;
  res.status(statusCode).json({
    ok: result.success,
    message: result.message,
    data: {
      labelId: label.id,
      barcode: label.barcode,
      templateId: templateRecord?.id ?? null,
      printCount: result.printCount,
      printerName: result.printerName || null,
      filePath: result.filePath || null,
      mode: result.mode || "unknown",
      printedAt: result.success ? new Date().toISOString() : null,
      error: result.error || null,
    },
  });
});