/**
 * 라벨 템플릿 서비스
 * - 템플릿 데이터 저장
 * - 템플릿별 데이터 구조 관리
 */

const db = require("../../models");
const { LabelTemplate } = db;

/**
 * 템플릿 데이터 저장
 * @param {object} payload - 템플릿 데이터
 * @returns {Promise<object>} 저장된 템플릿
 */
exports.saveTemplate = async (payload) => {
  try {
    // 템플릿 타입에 따라 데이터 구조 검증
    const { labelType } = payload;

    if (!labelType || !['large', 'medium', 'small', 'verysmall'].includes(labelType)) {
      throw new Error('유효하지 않은 템플릿 타입입니다');
    }

    // 템플릿 데이터 생성
    const templateData = {
      item_id: payload.itemId || null,
      item_name: payload.itemName || null,
      label_type: labelType,
      storage_condition: payload.storageCondition || null,
      registration_number: payload.registrationNumber || null,
      category_and_form: payload.categoryAndForm || null,
      ingredients: payload.ingredients || null,
      raw_materials: payload.rawMaterials || null,
      actual_weight: payload.actualWeight || null,
      html_content: payload.htmlContent || null,
      printer_name: payload.printerName || null,
      print_count: payload.printCount || 1,
      print_status: payload.printStatus || 'PENDING',
      error_message: payload.errorMessage || null,
    };

    // 템플릿 저장
    const template = await LabelTemplate.create(templateData);

    return template;
  } catch (error) {
    console.error('템플릿 저장 실패:', error);
    throw new Error(`템플릿 저장 실패: ${error.message}`);
  }
};

/**
 * 템플릿 결과 업데이트
 * @param {number} templateId - 템플릿 ID
 * @param {object} result - 결과 데이터
 * @returns {Promise<object>} 업데이트된 템플릿
 */
exports.updateTemplateResult = async (templateId, result) => {
  try {
    if (!templateId) {
      return null;
    }

    const template = await LabelTemplate.findByPk(templateId);
    if (!template) {
      return null;
    }

    template.print_status = result.success ? 'SUCCESS' : 'FAILED';
    template.error_message = result.errorMessage || null;

    await template.save();

    return template;
  } catch (error) {
    console.error('템플릿 결과 업데이트 실패:', error);
    throw new Error(`템플릿 결과 업데이트 실패: ${error.message}`);
  }
};

/**
 * 템플릿 조회
 * @param {number} templateId - 템플릿 ID
 * @returns {Promise<object>} 템플릿
 */
exports.getTemplate = async (templateId) => {
  try {
    const template = await LabelTemplate.findByPk(templateId);
    return template;
  } catch (error) {
    console.error('템플릿 조회 실패:', error);
    throw new Error(`템플릿 조회 실패: ${error.message}`);
  }
};

/**
 * 템플릿 목록 조회
 * @param {object} options - 조회 옵션
 * @returns {Promise<object>} 템플릿 목록
 */
exports.getTemplates = async (options = {}) => {
  try {
    const { page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    const { rows, count } = await LabelTemplate.findAndCountAll({
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset: Number(offset),
    });

    return {
      rows,
      count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(count / limit),
    };
  } catch (error) {
    console.error('템플릿 목록 조회 실패:', error);
    throw new Error(`템플릿 목록 조회 실패: ${error.message}`);
  }
};

