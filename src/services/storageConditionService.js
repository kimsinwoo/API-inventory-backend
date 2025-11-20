const db = require("../../models");
const { StorageCondition } = db;

// itemNames 배열을 쉼표로 구분된 문자열로 변환
function formatApplicableItems(itemNames) {
  if (!Array.isArray(itemNames) || itemNames.length === 0) {
    return null;
  }
  
  const trimmedNames = itemNames
    .map(name => String(name).trim())
    .filter(name => name.length > 0);
  
  return trimmedNames.length > 0 ? trimmedNames.join(", ") : null;
}

exports.list = async () => {
  return StorageCondition.findAll({
    order: [["id", "ASC"]],
    attributes: ["id", "name", "temperature_range", "humidity_range", "applicable_items", "created_at", "updated_at"],
  });
};

exports.get = async (id) => {
  return StorageCondition.findByPk(id, {
    attributes: ["id", "name", "temperature_range", "humidity_range", "applicable_items", "created_at", "updated_at"],
  });
};

exports.create = async (payload) => {
  const { name, temperature_range, humidity_range, itemNames } = payload;
  
  const applicableItems = formatApplicableItems(itemNames);
  
  return StorageCondition.create({
    name: name.trim(),
    temperature_range: temperature_range?.trim() ?? null,
    humidity_range: humidity_range?.trim() ?? null,
    applicable_items: applicableItems,
  });
};

exports.update = async (id, payload) => {
  const { name, temperature_range, humidity_range, itemNames } = payload;
  
  const existing = await StorageCondition.findByPk(id);
  if (!existing) {
    const err = new Error("NotFound");
    err.status = 404;
    throw err;
  }

  const updateData = {
    name: name?.trim() ?? existing.name,
    temperature_range: temperature_range?.trim() ?? existing.temperature_range,
    humidity_range: humidity_range?.trim() ?? existing.humidity_range,
  };

  // itemNames가 제공되면 applicable_items 업데이트
  if (itemNames !== undefined) {
    updateData.applicable_items = formatApplicableItems(itemNames);
  }

  const updated = await existing.update(updateData);

  return updated;
};

exports.addItems = async (id, itemNames = []) => {
  const storageCondition = await StorageCondition.findByPk(id);
  if (!storageCondition) {
    const err = new Error("StorageCondition not found");
    err.status = 404;
    throw err;
  }

  // itemNames가 배열이 아니거나 비어있으면 에러
  if (!Array.isArray(itemNames) || itemNames.length === 0) {
    const err = new Error("itemNames는 비어있지 않은 배열이어야 합니다.");
    err.status = 400;
    throw err;
  }

  // 기존 applicable_items 가져오기
  const existingItems = storageCondition.applicable_items 
    ? storageCondition.applicable_items.split(", ").map(s => s.trim())
    : [];

  // 새로운 품목 이름들 추가 (중복 제거)
  const newItemNames = itemNames
    .map(name => String(name).trim())
    .filter(name => name.length > 0);
  
  const combinedItems = [...new Set([...existingItems, ...newItemNames])];
  const applicableItems = combinedItems.length > 0 ? combinedItems.join(", ") : null;

  const updated = await storageCondition.update({ applicable_items: applicableItems });

  return updated;
};

exports.removeItem = async (id, itemName) => {
  const storageCondition = await StorageCondition.findByPk(id);
  if (!storageCondition) {
    const err = new Error("StorageCondition not found");
    err.status = 404;
    throw err;
  }

  if (!storageCondition.applicable_items) {
    return storageCondition;
  }

  // applicable_items에서 해당 품목 제거
  const items = storageCondition.applicable_items
    .split(", ")
    .map(s => s.trim())
    .filter(s => s.length > 0 && s !== itemName);

  const applicableItems = items.length > 0 ? items.join(", ") : null;

  const updated = await storageCondition.update({ applicable_items: applicableItems });

  return updated;
};

exports.remove = async (id) => {
  return StorageCondition.destroy({ where: { id } });
};
