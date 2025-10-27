const db = require("../../models");
const { Inventories, Items, Factory, InventoryMovement, sequelize } = db;
const { Op, fn, col } = require("sequelize");
const dayjs = require("dayjs");

/* ===============================
 * 🔹 헬퍼 상수 (한글 변환용)
 * =============================== */
const KOR_CATEGORY = {
  RawMaterial: "원재료",
  SemiFinished: "반제품",
  Finished: "완제품",
  Supply: "소모품",
};
const KOR_STATUS = {
  Normal: "정상",
  LowStock: "부족",
  Expiring: "유통기한임박",
  Expired: "유통기한만료",
};

/* ===============================
 * 🔹 유통기한 남은 일수 계산
 * =============================== */
function toDaysLeft(expirationDate) {
  const today = dayjs().startOf("day");
  const exp = dayjs(expirationDate);
  return exp.diff(today, "day");
}

/* ===============================
 * 🔹 FIFO 출고 로직
 * =============================== */
async function fifoIssue({ itemId, factoryId, quantity, t }) {
  let remain = Number(quantity);
  if (remain <= 0) return { issued: 0, traces: [] };

  const lots = await Inventories.findAll({
    where: { item_id: itemId, factory_id: factoryId, quantity: { [Op.gt]: 0 } },
    order: [["received_at", "ASC"], ["id", "ASC"]],
    transaction: t,
    lock: t.LOCK.UPDATE,
  });

  const traces = [];
  let issued = 0;

  for (const lot of lots) {
    if (remain <= 0) break;
    const take = Math.min(Number(lot.quantity), remain);
    if (take > 0) {
      await lot.update({ quantity: Number(lot.quantity) - take }, { transaction: t });
      traces.push({ lotNumber: lot.lot_number, take });
      issued += take;
      remain -= take;
    }
  }

  if (remain > 1e-9) throw new Error("재고가 부족합니다.");
  return { issued, traces };
}

/* ===============================
 * 🔹 재고 목록 조회 (필터 + 검색)
 * =============================== */
exports.list = async (filter = {}) => {
  const { itemId, factoryId, status, category, search, page = 1, limit = 20 } = filter;

  const where = {};
  if (itemId) where.item_id = itemId;
  if (factoryId) where.factory_id = factoryId;
  if (status) where.status = status;

  const include = [
    { model: Items, attributes: ["id", "code", "name", "category", "shortage", "unit"] },
    { model: Factory, attributes: ["id", "name"] },
  ];

  const itemWhere = {};
  if (category) itemWhere.category = category;
  if (search) {
    include[0].where = {
      ...(include[0].where ?? {}),
      [Op.or]: [{ code: { [Op.substring]: search } }, { name: { [Op.substring]: search } }],
    };
  }
  if (Object.keys(itemWhere).length > 0)
    include[0].where = { ...(include[0].where ?? {}), ...itemWhere };

  const { rows, count } = await Inventories.findAndCountAll({
    where,
    include,
    order: [["received_at", "DESC"], ["id", "DESC"]],
    offset: (page - 1) * limit,
    limit,
  });

  const sums = await Inventories.findAll({
    attributes: ["item_id", [fn("SUM", col("quantity")), "sumQty"]],
    group: ["item_id"],
  });
  const sumMap = new Map(sums.map((s) => [Number(s.get("item_id")), Number(s.get("sumQty"))]));

  const data = rows.map((inv) => {
    const daysLeft = toDaysLeft(inv.expiration_date);
    const item = inv.Item;
    const totalQty = sumMap.get(item.id) ?? Number(inv.quantity);
    const low = totalQty < Number(item.shortage ?? 0);
    const normOrTime =
      daysLeft < 0 ? "Expired" : daysLeft <= 3 ? "Expiring" : "Normal";
    const finalStatus = low && normOrTime === "Normal" ? "LowStock" : normOrTime;

    return {
      id: inv.id,
      lotNumber: inv.lot_number,
      quantity: Number(inv.quantity),
      unit: inv.unit,
      expirationDate: inv.expiration_date,
      daysLeft,
      status: finalStatus,
      statusLabel: KOR_STATUS[finalStatus],
      item: {
        id: item.id,
        code: item.code,
        name: item.name,
        category: item.category,
        categoryLabel: KOR_CATEGORY[item.category],
      },
      factory: inv.Factory ? { id: inv.Factory.id, name: inv.Factory.name } : null,
      receivedAt: inv.received_at,
    };
  });

  return { items: data, meta: { page, limit, total: count } };
};

/* ===============================
 * 🔹 재고 요약 통계 (대시보드)
 * =============================== */
exports.summary = async ({ factoryId } = {}) => {
  const where = {};
  if (factoryId) where.factory_id = factoryId;

  const [totalItemsRow] = await Inventories.findAll({
    attributes: [[fn("COUNT", fn("DISTINCT", col("item_id"))), "cnt"]],
    where,
    raw: true,
  });

  const expiringSoon = await Inventories.count({
    where: {
      ...where,
      expiration_date: { [Op.lte]: dayjs().add(3, "day").format("YYYY-MM-DD") },
    },
  });

  const expired = await Inventories.count({
    where: {
      ...where,
      expiration_date: { [Op.lt]: dayjs().format("YYYY-MM-DD") },
    },
  });

  const whCounts = await Inventories.findAll({
    attributes: [[fn("COUNT", fn("DISTINCT", col("factory_id"))), "cnt"]],
    where,
    raw: true,
  });

  const lowStockRows = await Inventories.findAll({
    attributes: ["item_id", [fn("SUM", col("quantity")), "sumQty"]],
    where,
    group: ["item_id"],
    include: [{ model: Items, attributes: ["shortage"] }],
  });
  const lowStock = lowStockRows.filter(
    (r) => Number(r.get("sumQty")) < Number(r.Item?.shortage ?? 0)
  ).length;

  return {
    totalItems: Number(totalItemsRow?.cnt ?? 0),
    lowStock,
    expiringSoon,
    expired,
    warehouseCount: Number(whCounts?.[0]?.cnt ?? 0),
  };
};

/* ===============================
 * 🔹 창고별 이용률
 * =============================== */
exports.utilization = async () => {
  const rows = await Inventories.findAll({
    attributes: ["factory_id", [fn("COUNT", fn("DISTINCT", col("item_id"))), "itemCnt"]],
    group: ["factory_id"],
    include: [{ model: Factory, attributes: ["id", "name"] }],
  });

  const capacity = new Map();
  rows.forEach((r) => capacity.set(r.factory_id, 10));

  return rows.map((r) => {
    const count = Number(r.get("itemCnt"));
    const cap = capacity.get(r.factory_id) ?? 10;
    const percentage = Math.min(100, Math.round((count / cap) * 100));
    return {
      factory: { id: r.factory_id, name: r.Factory?.name ?? "" },
      percentage,
      itemCount: count,
      note: percentage >= 85 ? "창고 포화 주의" : "여유 공간 충분",
    };
  });
};

/* ===============================
 * 🔹 재고 입고
 * =============================== */
exports.receive = async (payload) => {
  const {
    itemId, factoryId, storageConditionId,
    lotNumber, wholesalePrice, quantity, receivedAt, firstReceivedAt, unit, note, actorName,
  } = payload;

  // ✅ 외래 키 검증
  const item = await Items.findByPk(itemId);
  if (!item) {
    throw new Error(`Item with id ${itemId} does not exist`);
  }

  const factory = await Factory.findByPk(factoryId);
  if (!factory) {
    throw new Error(`Factory with id ${factoryId} does not exist`);
  }

  const storageCondition = await db.StorageCondition.findByPk(storageConditionId);
  if (!storageCondition) {
    throw new Error(`StorageCondition with id ${storageConditionId} does not exist`);
  }

  // ✅ 유통기한 자동 계산: 입고날짜 + item의 expiration_date(일수)
  const calculatedExpirationDate = dayjs(receivedAt).add(item.expiration_date, 'day').format("YYYY-MM-DD");

  return sequelize.transaction(async (t) => {
    const inv = await Inventories.create({
      item_id: itemId,
      factory_id: factoryId,
      storage_condition_id: storageConditionId,
      lot_number: String(lotNumber).trim(),
      wholesale_price: Number(wholesalePrice),
      quantity: Number(quantity),
      received_at: receivedAt,
      first_received_at: firstReceivedAt ?? receivedAt,
      expiration_date: calculatedExpirationDate,
      status: "Normal",
      unit: String(unit).trim(),
    }, { transaction: t });

    const today = dayjs().startOf("day");
    const exp = dayjs(inv.expiration_date);
    let status = "Normal";
    if (exp.isBefore(today)) status = "Expired";
    else if (exp.diff(today, "day") <= 3) status = "Expiring";
    await inv.update({ status }, { transaction: t });

    await InventoryMovement.create({
      type: "RECEIVE",
      item_id: itemId,
      lot_number: inv.lot_number,
      quantity: Number(quantity),
      unit,
      from_factory_id: null,
      to_factory_id: factoryId,
      note: note ?? null,
      actor_name: actorName ?? null,
      occurred_at: new Date(receivedAt),
    }, { transaction: t });

    return inv;
  });
};

/* ===============================
 * 🔹 재고 출고 (FIFO)
 * =============================== */
exports.issue = async (payload) => {
  const { itemId, factoryId, quantity, unit, note, actorName } = payload;
  return sequelize.transaction(async (t) => {
    const { issued, traces } = await fifoIssue({ itemId, factoryId, quantity, t });

    // trace별 이력
    for (const tr of traces) {
      await InventoryMovement.create({
        type: "ISSUE",
        item_id: itemId,
        lot_number: tr.lotNumber,
        quantity: tr.take,
        unit,
        from_factory_id: factoryId,
        to_factory_id: null,
        note: note ?? null,
        actor_name: actorName ?? null,
      }, { transaction: t });
    }

    return { issued };
  });
};

/* ===============================
 * 🔹 재고 이동 (공장 간 이동)
 * =============================== */
exports.transfer = async (payload) => {
  const {
    itemId, sourceFactoryId, destFactoryId, storageConditionId,
    quantity, unit, note, actorName,
  } = payload;

  return sequelize.transaction(async (t) => {
    const { issued, traces } = await fifoIssue({ itemId, factoryId: sourceFactoryId, quantity, t });

    const now = dayjs();
    // OUT 이력
    for (const tr of traces) {
      await InventoryMovement.create({
        type: "TRANSFER_OUT",
        item_id: itemId,
        lot_number: tr.lotNumber,
        quantity: tr.take,
        unit,
        from_factory_id: sourceFactoryId,
        to_factory_id: destFactoryId,
        note: note ?? null,
        actor_name: actorName ?? null,
      }, { transaction: t });
    }

    const lotNum = `TR-${itemId}-${now.valueOf()}`;
    const inv = await Inventories.create({
      item_id: itemId,
      factory_id: destFactoryId,
      storage_condition_id: storageConditionId,
      lot_number: lotNum,
      wholesale_price: 0,
      quantity: issued,
      received_at: now.toDate(),
      first_received_at: now.toDate(),
      expiration_date: now.add(365, "day").format("YYYY-MM-DD"),
      status: "Normal",
      unit: String(unit).trim(),
    }, { transaction: t });

    // IN 이력
    await InventoryMovement.create({
      type: "TRANSFER_IN",
      item_id: itemId,
      lot_number: inv.lot_number,
      quantity: issued,
      unit,
      from_factory_id: sourceFactoryId,
      to_factory_id: destFactoryId,
      note: note ?? null,
      actor_name: actorName ?? null,
    }, { transaction: t });

    return { moved: issued, lotId: inv.id };
  });
};

/* ===============================
 * 🔹 재고 삭제
 * =============================== */
exports.remove = async (id) => {
  return Inventories.destroy({ where: { id } });
};

/* ===============================
 * 🔹 재고 이동 이력
 * =============================== */
exports.movements = async ({ itemId, factoryId, from, to, page = 1, limit = 20 }) => {
  const where = {};
  if (itemId) where.item_id = itemId;
  if (from) where.occurred_at = { [Op.gte]: new Date(from) };
  if (to) where.occurred_at = { ...(where.occurred_at ?? {}), [Op.lte]: new Date(to) };
  if (factoryId) {
    where[Op.or] = [{ from_factory_id: factoryId }, { to_factory_id: factoryId }];
  }

  const { rows, count } = await InventoryMovement.findAndCountAll({
    where,
    include: [
      { model: Items, attributes: ["code", "name"] },
      { model: Factory, as: "fromFactory", attributes: ["id", "name"] },
      { model: Factory, as: "toFactory", attributes: ["id", "name"] },
    ],
    order: [["occurred_at", "DESC"], ["id", "DESC"]],
    offset: (page - 1) * limit,
    limit,
  });

  const korType = (t) =>
    ({ RECEIVE: "입고", ISSUE: "소모", TRANSFER_OUT: "이동", TRANSFER_IN: "생산" }[t] ?? t);

  const data = rows.map((r) => ({
    time: dayjs(r.occurred_at).format("YYYY-MM-DD HH:mm"),
    type: korType(r.type),
    category: r.Item?.name ?? "",
    code: r.Item?.code ?? "",
    lotNumber: r.lot_number,
    quantity: `${Number(r.quantity)} ${r.unit}`,
    fromLocation: r.fromFactory ? (r.fromFactory.id || r.fromFactory.name) : "",
    toLocation: r.toFactory ? (r.toFactory.id || r.toFactory.name) : "",
    manager: r.actor_name ?? "",
    note: r.note ?? "",
  }));

  return { items: data, meta: { page, limit, total: count } };
};
