// src/services/itemService.js
const db = require('../../models');
const { Items, Factory } = db;

exports.listItems = async () => {
  return Items.findAll({
    include: [
      { model: Factory },
    ],
    order: [['id', 'DESC']],
  });
};

exports.getItem = async (id) => {
  return Items.findByPk(id, {
    include: [
      { model: Factory },
    ],
  });
};

exports.getItemByCode = async (code) => {
  return Items.findOne({
    where: { code },
    include: [
      { model: Factory },
    ],
  });
};

exports.createItem = async (payload) => {
  // payload는 validateItemCreate에서 표준화됨
  const {
    code, name, category, unit,
    factory_id,
    shortage, expiration_date,
    wholesale_price, // 있으면 저장(모델에 없으면 무시)
  } = payload;

  // factory_id가 제공된 경우 해당 factory가 존재하는지 확인
  if (factory_id != null && !Number.isNaN(factory_id)) {
    const factoryExists = await Factory.findByPk(factory_id);
    if (!factoryExists) {
      const error = new Error(`Factory ID ${factory_id}가 존재하지 않습니다.`);
      error.status = 400;
      throw error;
    }
  }

  // factory_id가 유효한 경우만 포함
  const data = {
    code,
    name,
    category,
    unit,
    shortage,
    expiration_date,
    wholesale_price,
  };

  // factory_id가 있고 유효한 경우에만 추가
  if (factory_id != null && !Number.isNaN(factory_id)) {
    data.factory_id = factory_id;
  }

  return Items.create(data);
};

exports.updateItem = async (id, body) => {
  const item = await Items.findByPk(id);
  if (!item) return null;

  // 부분 업데이트 허용 + 안전 매핑
  const patch = {};
  if (body.code != null) patch.code = String(body.code).trim();
  if (body.name != null) patch.name = String(body.name).trim();
  if (body.category != null) patch.category = body.category; // 필요 시 별도 norm 함수 사용
  if (body.unit != null) patch.unit = body.unit;
  if (body.factoryId != null) patch.factory_id = Number(body.factoryId);
  if (body.shortage != null) patch.shortage = Number(body.shortage);
  if (body.expiration_date != null) patch.expiration_date = Number(body.expiration_date);
  if (body.shelfLife != null) patch.expiration_date = Number(body.shelfLife);
  if (body.wholesalePrice != null) patch.wholesale_price = Number(body.wholesalePrice);

  await item.update(patch);
  return this.getItem(id);
};

exports.deleteItem = async (id) => {
  return Items.destroy({ where: { id } });
};
