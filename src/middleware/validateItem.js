/**
 * 품목 생성 요청 데이터 검증 및 정규화 미들웨어
 * - camelCase와 snake_case 모두 지원
 * - 한글 카테고리명을 영문으로 변환
 * - 필수 필드 검증
 */
exports.validateItemCreate = (req, res, next) => {
  try {
    const body = req.body || {};

    /**
     * 카테고리 값을 정규화 (한글 → 영문, 다양한 형식 지원)
     */
    const normalizeCategory = (value) => {
      if (!value) return null;
      
      const stringValue = String(value).trim();
      const categoryMap = {
        '원재료': 'RawMaterial',
        'rawmaterial': 'RawMaterial',
        'raw_material': 'RawMaterial',
        '반재료': 'SemiFinished',
        '반제품': 'SemiFinished',
        'semifinished': 'SemiFinished',
        'semi_finished': 'SemiFinished',
        '완제품': 'Finished',
        'finished': 'Finished',
        '소모품': 'Supply',
        'supply': 'Supply',
      };
      
      const normalized = categoryMap[stringValue.toLowerCase()];
      if (normalized) return normalized;
      
      // 이미 정규화된 값인 경우 그대로 반환
      const validCategories = ['RawMaterial', 'SemiFinished', 'Finished', 'Supply'];
      return validCategories.includes(stringValue) ? stringValue : null;
    };

    /**
     * 단위 값을 정규화 (소문자 → 표준 형식)
     */
    const normalizeUnit = (value) => {
      if (!value) return null;
      
      const stringValue = String(value).trim().toLowerCase();
      const unitMap = { 
        kg: 'kg', 
        g: 'g', 
        ea: 'EA', 
        box: 'BOX', 
        pcs: 'PCS' 
      };
      
      const normalized = unitMap[stringValue];
      if (normalized) return normalized;
      
      // 이미 정규화된 값인 경우 그대로 반환
      const validUnits = ['kg', 'g', 'EA', 'BOX', 'PCS'];
      return validUnits.includes(value) ? value : null;
    };

    // 요청 데이터 정규화 (camelCase와 snake_case 모두 지원)
    const normalizedData = {
      code: String(body.code || '').trim(),
      name: String(body.name || '').trim(),
      category: normalizeCategory(body.category),
      unit: normalizeUnit(body.unit),
      
      // 공장 ID (camelCase와 snake_case 모두 지원)
      factory_id: body.factoryId != null 
        ? Number(body.factoryId) 
        : (body.factory_id != null ? Number(body.factory_id) : null),
      
      // 재고 부족 기준 수량
      shortage: body.shortage != null ? Number(body.shortage) : 0,
      
      // 유통기한 (일 단위) - 다양한 필드명 지원
      expiration_date: body.shelfLife != null && body.shelfLife !== ''
        ? Number(body.shelfLife)
        : (body.expiration_date != null && body.expiration_date !== ''
          ? Number(body.expiration_date)
          : 0),
      
      // 도매가 (원)
      wholesale_price: body.wholesalePrice != null 
        ? Number(body.wholesalePrice)
        : (body.wholesale_price != null ? Number(body.wholesale_price) : null),
      
      // 보관 조건 ID (camelCase와 snake_case 모두 지원)
      storage_condition_id: body.storageConditionId !== undefined
        ? (body.storageConditionId != null && body.storageConditionId !== '' ? Number(body.storageConditionId) : null)
        : (body.storage_condition_id !== undefined
          ? (body.storage_condition_id != null && body.storage_condition_id !== '' ? Number(body.storage_condition_id) : null)
          : undefined),
      
      // 보관 온도
      storage_temp: body.storageTemp !== undefined
        ? (body.storageTemp != null && body.storageTemp !== '' ? String(body.storageTemp).trim() : null)
        : (body.storage_temp !== undefined
          ? (body.storage_temp != null && body.storage_temp !== '' ? String(body.storage_temp).trim() : null)
          : undefined),
    };

    // 필수 필드 검증
    const missingFields = [];
    if (!normalizedData.code) missingFields.push('code (품목 코드)');
    if (!normalizedData.name) missingFields.push('name (품목명)');
    if (!normalizedData.category) missingFields.push('category (카테고리)');
    if (!normalizedData.unit) missingFields.push('unit (단위)');
    if (normalizedData.factory_id == null || Number.isNaN(normalizedData.factory_id)) {
      missingFields.push('factoryId (공장 ID)');
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        ok: false,
        message: `필수 필드가 누락되었거나 형식이 올바르지 않습니다: ${missingFields.join(', ')}`,
      });
    }

    // 정규화된 데이터를 req.body에 저장
    req.body = normalizedData;
    next();
    
  } catch (error) {
    next(error);
  }
};
