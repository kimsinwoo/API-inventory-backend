const db = require("../../models");
const { Inventories, Items, sequelize } = db;
const { Op } = require("sequelize");
const dayjs = require("dayjs");

// FIFO로 lot 차감
async function fifoIssue({ itemId, factoryId, quantity, unit, t }) {
  let remain = Number(quantity);
  if (remain <= 0) return 0;

  const lots = await Inventories.findAll({
    where: { item_id: itemId, factory_id: factoryId, quantity: { [Op.gt]: 0 } },
    order: [["received_at", "ASC"], ["id","ASC"]],
    transaction: t,
    lock: t.LOCK.UPDATE,
  });

  let issued = 0;
  for (const lot of lots) {
    if (remain <= 0) break;
    const take = Math.min(Number(lot.quantity), remain);
    if (take > 0) {
      await lot.update({ quantity: Number(lot.quantity) - take }, { transaction: t });
      issued += take;
      remain -= take;
    }
  }
  if (remain > 1e-9) {
    throw new Error("재고가 부족합니다.");
  }
  return issued;
}

exports.list = async (filter = {}) => {
  const where = {};
  if (filter.itemId) where.item_id = filter.itemId;
  if (filter.factoryId) where.factory_id = filter.factoryId;
  if (filter.status) where.status = filter.status;

  return Inventories.findAll({ where, order: [["received_at","DESC"],["id","DESC"]] });
};

exports.receive = async (payload) => {
  const {
    itemId, factoryId, storageConditionId,
    lotNumber, wholesalePrice, quantity, receivedAt, firstReceivedAt, expirationDate, unit,
  } = payload;

  return sequelize.transaction(async (t) => {
    // lot 신규 생성
    const inv = await Inventories.create({
      item_id: itemId,
      factory_id: factoryId,
      storage_condition_id: storageConditionId,
      lot_number: String(lotNumber).trim(),
      wholesale_price: Number(wholesalePrice),
      quantity: Number(quantity),
      received_at: receivedAt,
      first_received_at: firstReceivedAt || receivedAt,
      expiration_date: dayjs(expirationDate).format("YYYY-MM-DD"),
      status: "Normal",
      unit: String(unit).trim(),
    }, { transaction: t });

    // 입고 후 만료 임박/만료 상태 업데이트(간단 규칙)
    const today = dayjs().startOf("day");
    const exp = dayjs(inv.expiration_date);
    let status = "Normal";
    if (exp.isBefore(today)) status = "Expired";
    else if (exp.diff(today,"day") <= 3) status = "Expiring";
    await inv.update({ status }, { transaction: t });

    return inv;
  });
};

exports.issue = async (payload) => {
  const { itemId, factoryId, quantity, unit } = payload;
  return sequelize.transaction(async (t) => {
    const issued = await fifoIssue({ itemId, factoryId, quantity, unit, t });
    return { issued };
  });
};

exports.transfer = async (payload) => {
  const {
    itemId, sourceFactoryId, destFactoryId, storageConditionId,
    quantity, unit,
  } = payload;

  return sequelize.transaction(async (t) => {
    // 1) 출고(FIFO 차감)
    const issued = await fifoIssue({ itemId, factoryId: sourceFactoryId, quantity, unit, t });

    // 2) 입고(이동분: 동일 lotNumber를 복제하거나 신규 lot 부여)
    const now = dayjs();
    const lotNum = `TR-${itemId}-${now.valueOf()}`;

    const inv = await Inventories.create({
      item_id: itemId,
      factory_id: destFactoryId,
      storage_condition_id: storageConditionId,
      lot_number: lotNum,
      wholesale_price: 0, // 필요시 단가 정책 반영
      quantity: issued,
      received_at: now.toDate(),
      first_received_at: now.toDate(),
      expiration_date: now.add(365, "day").format("YYYY-MM-DD"), // 필요시 정책 반영/원로트 승계
      status: "Normal",
      unit: String(unit).trim(),
    }, { transaction: t });

    return { moved: issued, lotId: inv.id };
  });
};

exports.remove = async (id) => {
  return Inventories.destroy({ where: { id } });
};
