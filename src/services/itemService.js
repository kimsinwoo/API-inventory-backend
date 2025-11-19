/**
 * 품목 관리 서비스
 * - 품목 데이터에 대한 비즈니스 로직 처리
 * - 데이터베이스와의 직접적인 상호작용 담당
 */
const db = require('../../models');
const { Items, Factory, StorageCondition } = db;

/**
 * 모든 품목 목록 조회
 * @returns {Promise<Array>} 품목 목록 (공장 정보 포함)
 */
exports.listItems = async () => {
  return Items.findAll({
    include: [
      { 
        model: Factory,
        attributes: ['id', 'name', 'type', 'address']
      },
      {
        model: StorageCondition,
        as: 'StorageCondition',
        attributes: ['id', 'name', 'temperature_range', 'humidity_range'],
        required: false,
      },
    ],
    order: [['id', 'DESC']], // 최신 등록순
  });
};

/**
 * ID로 특정 품목 조회
 * @param {number} id - 품목 ID
 * @returns {Promise<Object|null>} 품목 정보 또는 null
 */
exports.getItem = async (id) => {
  return Items.findByPk(id, {
    include: [
      { 
        model: Factory,
        attributes: ['id', 'name', 'type', 'address']
      },
      {
        model: StorageCondition,
        as: 'StorageCondition',
        attributes: ['id', 'name', 'temperature_range', 'humidity_range'],
        required: false,
      },
    ],
  });
};

/**
 * 품목 코드로 특정 품목 조회
 * @param {string} code - 품목 코드 (예: RAW001)
 * @returns {Promise<Object|null>} 품목 정보 또는 null
 */
exports.getItemByCode = async (code) => {
  return Items.findOne({
    where: { code },
    include: [
      { 
        model: Factory,
        attributes: ['id', 'name', 'type', 'address']
      },
      {
        model: StorageCondition,
        as: 'StorageCondition',
        attributes: ['id', 'name', 'temperature_range', 'humidity_range'],
        required: false,
      },
    ],
  });
};

/**
 * 새 품목 생성
 * @param {Object} payload - 품목 정보 (validateItemCreate에서 검증 완료)
 * @returns {Promise<Object>} 생성된 품목 정보
 * @throws {Error} 공장 ID가 유효하지 않은 경우
 */
exports.createItem = async (payload) => {
  const {
    code,
    name,
    category,
    unit,
    factory_id,
    storage_temp,
    storage_condition_id,
    shortage,
    expiration_date,
    wholesale_price,
  } = payload;

  // 공장 ID 유효성 검증
  if (factory_id != null && !Number.isNaN(factory_id)) {
    const factory = await Factory.findByPk(factory_id);
    
    if (!factory) {
      const error = new Error(`공장 ID ${factory_id}가 존재하지 않습니다.`);
      error.status = 400;
      throw error;
    }
  }

  // 품목 데이터 준비
  const itemData = {
    code,
    name,
    category,
    unit,
    shortage,
    expiration_date,
    wholesale_price,
  };

  // 공장 ID가 유효한 경우에만 추가
  if (factory_id != null && !Number.isNaN(factory_id)) {
    itemData.factory_id = factory_id;
  }

  // 보관 조건 ID 처리 - payload에 있으면 항상 포함 (null이어도)
  if (storage_condition_id !== undefined) {
    itemData.storage_condition_id = (storage_condition_id != null && !Number.isNaN(storage_condition_id)) 
      ? storage_condition_id 
      : null;
  }

  // 보관 온도 처리 - payload에 있으면 항상 포함 (null이어도)
  if (storage_temp !== undefined) {
    itemData.storage_temp = (storage_temp != null && storage_temp !== '') 
      ? storage_temp 
      : null;
  }

  // 디버깅: 저장되는 데이터 확인
  console.log('=== 저장할 품목 데이터 ===');
  console.log('itemData:', JSON.stringify(itemData, null, 2));

  // 품목 생성
  try {
    const createdItem = await Items.create(itemData);
    
    // 생성된 품목을 공장 정보와 함께 반환
    return this.getItem(createdItem.id);
  } catch (error) {
    // 중복 코드 에러 처리
    if (error.name === 'SequelizeUniqueConstraintError') {
      const duplicateError = new Error(`품목 코드 '${code}'는 이미 사용 중입니다. 다른 코드를 사용해주세요.`);
      duplicateError.status = 409; // Conflict
      throw duplicateError;
    }
    throw error;
  }
};

/**
 * 품목 정보 수정 (부분 업데이트 지원)
 * @param {number} id - 품목 ID
 * @param {Object} updateData - 수정할 데이터
 * @returns {Promise<Object|null>} 수정된 품목 정보 또는 null
 */
exports.updateItem = async (id, updateData) => {
  // 품목 존재 여부 확인
  const item = await Items.findByPk(id);
  if (!item) return null;

  // 수정할 필드만 선택적으로 적용 (부분 업데이트)
  const updateFields = {};
  
  if (updateData.code != null) {
    updateFields.code = String(updateData.code).trim();
  }
  
  if (updateData.name != null) {
    updateFields.name = String(updateData.name).trim();
  }
  
  if (updateData.category != null) {
    updateFields.category = updateData.category;
  }
  
  if (updateData.unit != null) {
    updateFields.unit = updateData.unit;
  }
  
  // 공장 ID (camelCase와 snake_case 모두 지원)
  if (updateData.factoryId != null) {
    updateFields.factory_id = Number(updateData.factoryId);
  } else if (updateData.factory_id != null) {
    updateFields.factory_id = Number(updateData.factory_id);
  }
  
  if (updateData.shortage != null) {
    updateFields.shortage = Number(updateData.shortage);
  }
  
  // 유통기한 (다양한 필드명 지원)
  if (updateData.expiration_date != null) {
    updateFields.expiration_date = Number(updateData.expiration_date);
  } else if (updateData.shelfLife != null) {
    updateFields.expiration_date = Number(updateData.shelfLife);
  }
  
  // 도매가 (camelCase와 snake_case 모두 지원)
  if (updateData.wholesalePrice != null) {
    updateFields.wholesale_price = Number(updateData.wholesalePrice);
  } else if (updateData.wholesale_price != null) {
    updateFields.wholesale_price = Number(updateData.wholesale_price);
  }

  // 보관 조건 ID (camelCase와 snake_case 모두 지원)
  if (updateData.storageConditionId != null) {
    updateFields.storage_condition_id = Number(updateData.storageConditionId);
  } else if (updateData.storage_condition_id != null) {
    updateFields.storage_condition_id = Number(updateData.storage_condition_id);
  }

  // 보관 온도 (camelCase와 snake_case 모두 지원)
  if (updateData.storageTemp != null) {
    updateFields.storage_temp = String(updateData.storageTemp).trim();
  } else if (updateData.storage_temp != null) {
    updateFields.storage_temp = String(updateData.storage_temp).trim();
  }

  // 품목 정보 업데이트
  await item.update(updateFields);
  
  // 업데이트된 품목을 공장 정보와 함께 반환
  return this.getItem(id);
};

/**
 * 품목 삭제
 * @param {number} id - 품목 ID
 * @returns {Promise<number>} 삭제된 행의 개수
 */
exports.deleteItem = async (id) => {
  return Items.destroy({ where: { id } });
};
