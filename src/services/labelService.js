/**
 * 라벨 생성 서비스
 */
const ejs = require("ejs");
const path = require("path");
const barcodeLib = require("bwip-js");

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

