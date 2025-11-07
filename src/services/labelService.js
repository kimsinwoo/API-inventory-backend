/**
 * 라벨 생성 서비스
 */
const ejs = require("ejs");
const path = require("path");
const barcodeLib = require("bwip-js");
const db = require("../../models");
const { Label, LabelTemplate } = db;

/**
 * 바코드 생성 (Base64)
 */
async function generateBarcode(text) {
  try {
    const png = await barcodeLib.toBuffer({
      bcid: "code128",
      text: text,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: "center",
    });
    return png.toString("base64");
  } catch (error) {
    console.error("바코드 생성 실패:", error);
    throw new Error("바코드 생성에 실패했습니다");
  }
}

/**
 * 라벨 HTML 생성
 */
exports.generateLabel = async (labelData) => {
  const {
    labelSize = "large", // large, medium, small
    productName,
    manufactureDate,
    expiryDate,
    lotNumber,
    quantity,
    unit,
  } = labelData;

  // 바코드 생성
  const barcodeBase64 = await generateBarcode(lotNumber);

  // 라벨 크기에 따라 템플릿 선택
  let templateName;
  switch (labelSize) {
    case "large":
      templateName = "largeLabel.ejs";
      break;
    case "medium":
      templateName = "midiumLabel copy.ejs";
      break;
    case "small":
      templateName = "smallLabel copy 2.ejs";
      break;
    default:
      templateName = "largeLabel.ejs";
  }

  const templatePath = path.join(
    __dirname,
    "..",
    "views",
    templateName
  );

  // EJS 렌더링
  const html = await ejs.renderFile(templatePath, {
    productName,
    manufactureDate,
    expiryDate,
    barcodeBase64,
    labelSize,
  });

  return {
    html,
    labelSize,
    lotNumber,
    productName,
  };
};

/**
 * 저장된 라벨 데이터로 HTML 생성
 * @param {Object} labelRecord - 데이터베이스에서 조회한 라벨 레코드
 * @param {Object} options - 옵션 (manufactureDate, expiryDate 등)
 * @returns {Promise<Object>} - HTML과 라벨 정보
 */
exports.generateLabelFromRecord = async (labelRecord, options = {}) => {
  const { manufactureDate, expiryDate } = options;
  
  // 제조일자와 유통기한은 출력 시 입력받아야 함
  if (!manufactureDate || !expiryDate) {
    throw new Error("제조일자와 유통기한이 필요합니다");
  }

  const labelData = {
    labelSize: labelRecord.label_size || "large",
    productName: labelRecord.product_name,
    manufactureDate,
    expiryDate,
    lotNumber: labelRecord.barcode,
    quantity: labelRecord.quantity,
    unit: labelRecord.unit,
  };

  const result = await exports.generateLabel(labelData);
  
  return {
    ...result,
    labelId: labelRecord.id,
    inventoryId: labelRecord.inventory_id,
    barcode: labelRecord.barcode,
    registrationCode: labelRecord.registration_code,
  };
};

/**
 * 라벨을 데이터베이스에 저장
 * @param {Object} labelData - 라벨 데이터
 * @param {Object} options - 옵션 (transaction 등)
 * @returns {Promise<Object>} - 저장된 라벨 객체
 */
exports.saveLabel = async (labelData, options = {}) => {
  const {
    inventoryId,
    barcode,
    itemId,
    productName,
    registrationCode,
    quantity,
    unit,
    labelSize = "large",
    labelData: additionalData = null,
  } = labelData;

  const label = await Label.create(
    {
      inventory_id: inventoryId,
      barcode,
      item_id: itemId,
      product_name: productName,
      registration_code: registrationCode,
      quantity: Number(quantity),
      unit,
      label_size: labelSize,
      label_data: additionalData,
      // manufacture_date와 expiry_date는 출력 시 입력받으므로 저장하지 않음
    },
    options
  );

  return label;
};

/**
 * 여러 라벨을 생성하고 데이터베이스에 저장
 * @param {Array} labelsData - 라벨 데이터 배열
 * @param {Object} options - 옵션 (transaction 등)
 * @returns {Promise<Array>} - 저장된 라벨 배열
 */
exports.saveMultipleLabels = async (labelsData, options = {}) => {
  const labels = [];

  for (const labelData of labelsData) {
    const label = await exports.saveLabel(labelData, options);
    labels.push(label);
  }

  return labels;
};

/**
 * 바코드로 라벨 조회
 * @param {string} barcode - 바코드
 * @returns {Promise<Array>} - 라벨 배열
 */
exports.getLabelsByBarcode = async (barcode) => {
  const labels = await Label.findAll({
    where: { barcode },
    include: [
      { model: db.Items, as: "item" },
      { model: db.Inventories, as: "inventory" },
    ],
    order: [["created_at", "DESC"]],
  });

  return labels;
};

/**
 * 재고 ID로 라벨 조회
 * @param {number} inventoryId - 재고 ID
 * @returns {Promise<Array>} - 라벨 배열
 */
exports.getLabelsByInventoryId = async (inventoryId) => {
  const labels = await Label.findAll({
    where: { inventory_id: inventoryId },
    include: [
      { model: db.Items, as: "item" },
      { model: db.Inventories, as: "inventory" },
    ],
    order: [["created_at", "DESC"]],
  });

  return labels;
};

/**
 * 라벨 ID로 라벨 조회
 * @param {number} labelId - 라벨 ID
 * @returns {Promise<Object>} - 라벨 객체
 */
exports.getLabelById = async (labelId) => {
  const label = await Label.findByPk(labelId, {
    include: [
      { model: db.Items, as: "item" },
      { model: db.Inventories, as: "inventory" },
    ],
  });

  return label;
};

/**
 * 저장된 모든 라벨 조회 (옵셔널 페이지네이션)
 * @param {Object} params
 * @param {number} params.page - 페이지 (기본 1)
 * @param {number} params.limit - 페이지당 개수 (기본 50)
 * @returns {Promise<{rows: Array, count: number}>}
 */
exports.getAllLabels = async ({ page = 1, limit = 50 } = {}) => {
  const offset = (Number(page) - 1) * Number(limit);

  const { rows, count } = await LabelTemplate.findAndCountAll({
    order: [["created_at", "DESC"]],
    offset,
    limit: Number(limit),
  });

  return { rows, count };
};

/**
 * registration_number로 LabelTemplate 조회
 * @param {string} registrationNumber - 등록번호
 * @returns {Promise<LabelTemplate|null>}
 */
exports.getLabelTemplateByRegistrationNumber = async (registrationNumber) => {
  if (!registrationNumber) {
    return null;
  }

  // registration_number로 최신 템플릿 조회 (여러 개일 경우 가장 최근 것)
  const labelTemplate = await LabelTemplate.findOne({
    where: {
      registration_number: registrationNumber,
    },
    order: [["created_at", "DESC"]],
  });

  return labelTemplate;
};

/**
 * 여러 라벨 일괄 생성
 */
exports.generateMultipleLabels = async (labelsData) => {
  const results = [];

  for (const labelData of labelsData) {
    try {
      const label = await exports.generateLabel(labelData);
      results.push({
        success: true,
        label,
      });
    } catch (error) {
      results.push({
        success: false,
        error: error.message,
        lotNumber: labelData.lotNumber,
      });
    }
  }

  return results;
};
