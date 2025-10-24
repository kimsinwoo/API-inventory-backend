const db = require("../../models");
const { BOM, BOMComponent, Items } = db;
const { Op } = require("sequelize");

async function resolveItemId({ itemId, itemCode }) {
  if (itemId) return Number(itemId);
  if (!itemCode) return null;
  const item = await Items.findOne({ where: { code: itemCode } });
  return item ? item.id : null;
}

exports.list = async ({ search = "", page = 1, limit = 50 }) => {
  const where = search
    ? { name: { [Op.like]: `%${search}%` } }
    : {};

  const offset = (Number(page) - 1) * Number(limit);

  const { rows, count } = await BOM.findAndCountAll({
    where,
    attributes: ["id", "name", "description", "created_at", "updated_at"], // BOM 필드
    include: [{
      model: BOMComponent,
      as: "components",
      attributes: ["id", "quantity", "unit", "sort_order", "loss_rate"], // BOMComponent 필드
      include: [{ 
        model: Items, 
        as: "item", 
        attributes: ["id", "code", "name", "category"] // Items 필드 (unit 제거)
      }],
    }],
    order: [["updated_at", "DESC"], [{ model: BOMComponent, as: "components" }, "sort_order", "ASC"]],
    limit: Number(limit),
    offset,
  });

  return { rows, count, page: Number(page), limit: Number(limit) };
};

// services/bomService.js (또는 현재 get 이 있는 파일)

exports.get = async (id) => {
  return BOM.findByPk(id, {
    attributes: ["id", "name", "description"],
    include: [
      {
        model: BOMComponent,
        as: "components",
        attributes: ["id", "bom_id", "item_id", "quantity", "unit", "sort_order", "loss_rate"],
        include: [
          {
            model: Items,
            as: "item",
            attributes: ["id", "code", "name", "unit", "category"],
          },
        ],
      },
    ],
    order: [
      [{ model: BOMComponent, as: "components" }, "sort_order", "ASC"],
      [{ model: BOMComponent, as: "components" }, "id", "ASC"],
    ],
  });
};


exports.create = async ({ name, description, lines = [] }) => {
  const t = await db.sequelize.transaction();
  try {
    const bom = await BOM.create({ name, description }, { transaction: t });

    let order = 1;
    for (const line of lines) {
      const item_id = await resolveItemId({ itemId: line.itemId, itemCode: line.itemCode });
      if (!item_id) throw new Error(`존재하지 않는 품목입니다: ${line.itemCode || line.itemId}`);
      await BOMComponent.create({
        bom_id: bom.id,
        item_id,
        quantity: Number(line.quantity),
        unit: String(line.unit),
        sort_order: order++,
        loss_rate: Number(line.lossRate ?? 0),
      }, { transaction: t });
    }

    await t.commit();
    return exports.get(bom.id);
  } catch (e) {
    await t.rollback();
    throw e;
  }
};

exports.update = async (id, { name, description, lines }) => {
  const t = await db.sequelize.transaction();
  try {
    const bom = await BOM.findByPk(id, { transaction: t });
    if (!bom) return null;

    await bom.update(
      {
        name: name !== undefined ? name : bom.name,
        description: description !== undefined ? description : bom.description,
      },
      { transaction: t }
    );
    
    if (Array.isArray(lines)) {
      await BOMComponent.destroy({ where: { bom_id: id }, transaction: t });

      let order = 1;
      for (const line of lines) {
        const item_id = await resolveItemId({ itemId: line.itemId, itemCode: line.itemCode });
        if (!item_id) throw new Error(`존재하지 않는 품목입니다: ${line.itemCode || line.itemId}`);
        await BOMComponent.create({
          bom_id: id,
          item_id,
          quantity: Number(line.quantity),
          unit: String(line.unit),
          sort_order: order++,
          loss_rate: Number(line.lossRate ?? 0),
        }, { transaction: t });
      }
    }

    await t.commit();
    return exports.get(id);
  } catch (e) {
    await t.rollback();
    throw e;
  }
};

exports.destroy = async (id) => {
  return BOM.destroy({ where: { id } });
};
