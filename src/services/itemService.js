const db = require("../../models");
const { Items, Factory, StorageCondition } = db;

// 카테고리(한글/영문 혼용) → DB ENUM 매핑
function mapCategory(input) {
  if (!input) return null;
  const t = String(input).trim();
  const map = {
    "원재료": "RawMaterial",
    "반재료": "SemiFinished",
    "반제품": "SemiFinished",
    "완제품": "Finished",
    "소모품": "Supply",
    RawMaterial: "RawMaterial",
    SemiFinished: "SemiFinished",
    Finished: "Finished",
    Supply: "Supply",
  };
  return map[t] || null;
}

// 단위(한글/소문자) → DB ENUM("kg","g","EA","BOX","PCS") 매핑
function mapUnit(input) {
  if (!input) return null;
  const t = String(input).trim().toLowerCase();
  const map = {
    kg: "kg",
    g: "g",
    ea: "EA",
    box: "BOX",
    pcs: "PCS",
    piece: "PCS",
    pc: "PCS",
  };
  return map[t] || null;
}

// storage 값(숫자 id 또는 '냉장/냉동/상온' 이름) → storage_condition_id 해석
async function resolveStorageConditionId(storage) {
  if (storage == null || storage === "") return null;
  if (!isNaN(Number(storage))) return Number(storage);

  const name = String(storage).trim();
  const synonyms = {
    "냉장": ["냉장", "cold", "COLD"],
    "냉동": ["냉동", "freezer", "FROZEN", "동결"],
    "상온": ["상온", "room", "ROOM", "실온"],
  };
  let names = [];
  if (synonyms["냉장"].includes(name)) names = synonyms["냉장"];
  else if (synonyms["냉동"].includes(name)) names = synonyms["냉동"];
  else if (synonyms["상온"].includes(name)) names = synonyms["상온"];
  else names = [name];

  const cond = await StorageCondition.findOne({ where: { name: names } });
  return cond ? cond.id : null;
}

exports.list = async () => {
  return Items.findAll({
    include: [
      { model: Factory, attributes: ["id", "name", "type"] },
      { model: StorageCondition, attributes: ["id", "name"] },
    ],
    order: [["code", "ASC"]],
  });
};

exports.getById = async (id) => {
  return Items.findByPk(id, {
    include: [
      { model: Factory, attributes: ["id", "name", "type"] },
      { model: StorageCondition, attributes: ["id", "name"] },
    ],
  });
};

exports.getByCode = async (code) => {
  return Items.findOne({
    where: { code },
    include: [
      { model: Factory, attributes: ["id", "name", "type"] },
      { model: StorageCondition, attributes: ["id", "name"] },
    ],
  });
};

exports.create = async (payload) => {
  const {
    code, name, category, factoryId, storage, shortage, unit,
  } = payload;

  const cat = mapCategory(category);
  const uni = mapUnit(unit);
  const storage_condition_id = await resolveStorageConditionId(storage);

  return Items.create({
    code,
    name,
    category: cat,                 // ENUM("RawMaterial","SemiFinished","Finished","Supply")
    unit: uni,                     // ENUM("kg","g","EA","BOX","PCS")
    factory_id: factoryId || null,
    storage_condition_id: storage_condition_id,
    shortage: Number(shortage ?? 5),
  });
};

exports.update = async (id, payload) => {
  const item = await Items.findByPk(id);
  if (!item) return null;

  const data = {};
  if (payload.name !== undefined) data.name = payload.name;
  if (payload.category !== undefined) data.category = mapCategory(payload.category);
  if (payload.unit !== undefined) data.unit = mapUnit(payload.unit);
  if (payload.factoryId !== undefined) data.factory_id = Number(payload.factoryId) || null;
  if (payload.shortage !== undefined) data.shortage = Number(payload.shortage);
  if (payload.storage !== undefined) {
    data.storage_condition_id = await resolveStorageConditionId(payload.storage);
  }

  await item.update(data);
  return this.getById(id);
};

exports.destroy = async (id) => {
  return Items.destroy({ where: { id } });
};
