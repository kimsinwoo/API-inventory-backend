/**
 * 대시보드 서비스
 * - 실시간 통계
 * - 차트 데이터
 * - KPI 지표
 */

const db = require("../../models");
const { Inventories, Items, Factory, InventoryMovement, sequelize } = db;
const { Op, fn, col, literal } = require("sequelize");
const dayjs = require("dayjs");

/**
 * 메인 대시보드 데이터
 */
exports.getMainDashboard = async (factoryId = null) => {
  const where = {};
  if (factoryId) where.factory_id = factoryId;

  // 병렬로 데이터 조회
  const [
    totalValue,
    categoryBreakdown,
    recentMovements,
    topMovingItems,
    stockStatus,
    monthlyTrend,
  ] = await Promise.all([
    exports.getTotalInventoryValue(factoryId),
    exports.getCategoryBreakdown(factoryId),
    exports.getRecentMovements(factoryId, 10),
    exports.getTopMovingItems(factoryId, 7, 5),
    exports.getStockStatusSummary(factoryId),
    exports.getMonthlyTrend(factoryId, 6),
  ]);

  return {
    overview: {
      totalValue,
      stockStatus,
      lastUpdated: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    },
    categoryBreakdown,
    recentMovements,
    topMovingItems,
    monthlyTrend,
  };
};

/**
 * 총 재고 가치 계산
 */
exports.getTotalInventoryValue = async (factoryId = null) => {
  const where = { quantity: { [Op.gt]: 0 } };
  if (factoryId) where.factory_id = factoryId;

  const result = await Inventories.findOne({
    attributes: [
      [fn("SUM", literal("quantity * wholesale_price")), "totalValue"],
      [fn("COUNT", col("id")), "totalLots"],
      [fn("SUM", col("quantity")), "totalQuantity"],
    ],
    where,
    raw: true,
  });

  const itemCount = await Inventories.count({
    distinct: true,
    col: "item_id",
    where,
  });

  return {
    totalValue: Number(result?.totalValue ?? 0),
    totalLots: Number(result?.totalLots ?? 0),
    totalQuantity: Number(result?.totalQuantity ?? 0),
    uniqueItems: itemCount,
  };
};

/**
 * 카테고리별 재고 분포
 */
exports.getCategoryBreakdown = async (factoryId = null) => {
  const where = { quantity: { [Op.gt]: 0 } };
  if (factoryId) where.factory_id = factoryId;

  const result = await Inventories.findAll({
    attributes: [
      [fn("SUM", col("quantity")), "totalQuantity"],
      [fn("SUM", literal("quantity * wholesale_price")), "totalValue"],
      [fn("COUNT", col("Inventories.id")), "lotCount"],
    ],
    where,
    include: [
      {
        model: Items,
        attributes: ["category"],
        required: true,
      },
    ],
    group: ["Item.category"],
    raw: true,
  });

  const categoryLabels = {
    RawMaterial: "원재료",
    SemiFinished: "반제품",
    Finished: "완제품",
    Supply: "소모품",
  };

  return result.map((item) => ({
    category: item["Item.category"],
    categoryLabel: categoryLabels[item["Item.category"]] || item["Item.category"],
    totalQuantity: Number(item.totalQuantity),
    totalValue: Number(item.totalValue),
    lotCount: Number(item.lotCount),
  }));
};

/**
 * 최근 재고 이동 내역
 */
exports.getRecentMovements = async (factoryId = null, limit = 10) => {
  const where = {};
  if (factoryId) {
    where[Op.or] = [
      { from_factory_id: factoryId },
      { to_factory_id: factoryId },
    ];
  }

  const movements = await InventoryMovement.findAll({
    where,
    include: [
      {
        model: Items,
        attributes: ["code", "name", "category"],
      },
      {
        model: Factory,
        as: "fromFactory",
        attributes: ["name"],
      },
      {
        model: Factory,
        as: "toFactory",
        attributes: ["name"],
      },
    ],
    order: [["occurred_at", "DESC"]],
    limit,
  });

  const typeLabels = {
    RECEIVE: "입고",
    ISSUE: "출고",
    TRANSFER_OUT: "이동(출)",
    TRANSFER_IN: "이동(입)",
  };

  return movements.map((m) => ({
    id: m.id,
    type: m.type,
    typeLabel: typeLabels[m.type] || m.type,
    itemCode: m.Item?.code,
    itemName: m.Item?.name,
    quantity: Number(m.quantity),
    unit: m.unit,
    fromFactory: m.fromFactory?.name || "-",
    toFactory: m.toFactory?.name || "-",
    actor: m.actor_name || "시스템",
    occurredAt: dayjs(m.occurred_at).format("YYYY-MM-DD HH:mm"),
  }));
};

/**
 * 가장 많이 움직인 품목 (기간별)
 */
exports.getTopMovingItems = async (factoryId = null, days = 7, limit = 5) => {
  const where = {
    occurred_at: {
      [Op.gte]: dayjs().subtract(days, "day").toDate(),
    },
  };

  if (factoryId) {
    where[Op.or] = [
      { from_factory_id: factoryId },
      { to_factory_id: factoryId },
    ];
  }

  const result = await InventoryMovement.findAll({
    attributes: [
      "item_id",
      "type",
      [fn("SUM", col("quantity")), "totalQuantity"],
      [fn("COUNT", col("id")), "transactionCount"],
    ],
    where,
    include: [
      {
        model: Items,
        attributes: ["code", "name", "category", "unit"],
      },
    ],
    group: ["item_id", "type"],
    order: [[fn("SUM", col("quantity")), "DESC"]],
    limit: limit * 2, // 여러 타입을 고려해 더 가져옴
  });

  // 품목별로 집계
  const itemMap = new Map();

  for (const record of result) {
    const itemId = record.item_id;
    if (!itemMap.has(itemId)) {
      itemMap.set(itemId, {
        itemId,
        itemCode: record.Item?.code,
        itemName: record.Item?.name,
        category: record.Item?.category,
        unit: record.Item?.unit,
        receive: 0,
        issue: 0,
        transfer: 0,
        totalTransactions: 0,
      });
    }

    const item = itemMap.get(itemId);
    const qty = Number(record.get("totalQuantity"));
    const count = Number(record.get("transactionCount"));

    if (record.type === "RECEIVE") item.receive += qty;
    else if (record.type === "ISSUE") item.issue += qty;
    else if (record.type === "TRANSFER_OUT" || record.type === "TRANSFER_IN")
      item.transfer += qty;

    item.totalTransactions += count;
  }

  return Array.from(itemMap.values())
    .sort((a, b) => b.totalTransactions - a.totalTransactions)
    .slice(0, limit);
};

/**
 * 재고 상태 요약
 */
exports.getStockStatusSummary = async (factoryId = null) => {
  const where = {};
  if (factoryId) where.factory_id = factoryId;

  const statusCounts = await Inventories.findAll({
    attributes: ["status", [fn("COUNT", col("id")), "count"]],
    where,
    group: ["status"],
    raw: true,
  });

  const statusMap = {
    Normal: { label: "정상", count: 0 },
    LowStock: { label: "부족", count: 0 },
    Expiring: { label: "유통기한임박", count: 0 },
    Expired: { label: "유통기한만료", count: 0 },
  };

  for (const item of statusCounts) {
    if (statusMap[item.status]) {
      statusMap[item.status].count = Number(item.count);
    }
  }

  return Object.entries(statusMap).map(([status, data]) => ({
    status,
    label: data.label,
    count: data.count,
  }));
};

/**
 * 월별 입출고 트렌드
 */
exports.getMonthlyTrend = async (factoryId = null, months = 6) => {
  const startDate = dayjs().subtract(months - 1, "month").startOf("month");

  const where = {
    occurred_at: {
      [Op.gte]: startDate.toDate(),
    },
  };

  if (factoryId) {
    where[Op.or] = [
      { from_factory_id: factoryId },
      { to_factory_id: factoryId },
    ];
  }

  const movements = await InventoryMovement.findAll({
    attributes: [
      [fn("DATE_FORMAT", col("occurred_at"), "%Y-%m"), "month"],
      "type",
      [fn("SUM", col("quantity")), "totalQuantity"],
    ],
    where,
    group: [literal("DATE_FORMAT(occurred_at, '%Y-%m')"), "type"],
    order: [[literal("DATE_FORMAT(occurred_at, '%Y-%m')"), "ASC"]],
    raw: true,
  });

  // 월별로 데이터 구조화
  const monthlyData = new Map();

  for (let i = 0; i < months; i++) {
    const month = startDate.add(i, "month").format("YYYY-MM");
    monthlyData.set(month, {
      month,
      monthLabel: startDate.add(i, "month").format("YYYY년 MM월"),
      receive: 0,
      issue: 0,
      transfer: 0,
    });
  }

  for (const record of movements) {
    const month = record.month;
    if (monthlyData.has(month)) {
      const data = monthlyData.get(month);
      const qty = Number(record.totalQuantity);

      if (record.type === "RECEIVE") data.receive += qty;
      else if (record.type === "ISSUE") data.issue += qty;
      else if (record.type === "TRANSFER_IN" || record.type === "TRANSFER_OUT")
        data.transfer += qty / 2; // 중복 방지
    }
  }

  return Array.from(monthlyData.values());
};

/**
 * 공장별 비교 대시보드
 */
exports.getFactoryComparison = async () => {
  const factories = await Factory.findAll({
    attributes: ["id", "name", "type"],
  });

  const comparison = [];

  for (const factory of factories) {
    const [value, status, movements] = await Promise.all([
      exports.getTotalInventoryValue(factory.id),
      exports.getStockStatusSummary(factory.id),
      exports.getRecentMovements(factory.id, 5),
    ]);

    comparison.push({
      factory: {
        id: factory.id,
        name: factory.name,
        type: factory.type,
      },
      totalValue: value.totalValue,
      totalLots: value.totalLots,
      uniqueItems: value.uniqueItems,
      status,
      recentActivity: movements.length,
    });
  }

  return comparison;
};

/**
 * KPI 지표
 */
exports.getKPIs = async (factoryId = null, period = "month") => {
  const periodMap = {
    day: { days: 1, label: "오늘" },
    week: { days: 7, label: "이번 주" },
    month: { days: 30, label: "이번 달" },
  };

  const config = periodMap[period] || periodMap.month;
  const startDate = dayjs().subtract(config.days, "day");

  const where = {
    occurred_at: {
      [Op.gte]: startDate.toDate(),
    },
  };

  if (factoryId) {
    where[Op.or] = [
      { from_factory_id: factoryId },
      { to_factory_id: factoryId },
    ];
  }

  const [movements, currentValue, previousValue] = await Promise.all([
    InventoryMovement.findAll({
      attributes: [
        "type",
        [fn("COUNT", col("id")), "count"],
        [fn("SUM", col("quantity")), "totalQuantity"],
      ],
      where,
      group: ["type"],
      raw: true,
    }),
    exports.getTotalInventoryValue(factoryId),
    exports.getTotalInventoryValue(factoryId), // 실제로는 이전 기간 데이터 조회 필요
  ]);

  const kpis = {
    period: config.label,
    inventoryValue: {
      current: currentValue.totalValue,
      change: 0, // 실제로는 계산 필요
      trend: "stable",
    },
    transactions: {
      total: 0,
      receive: 0,
      issue: 0,
      transfer: 0,
    },
    turnoverRate: 0, // 재고 회전율
    accuracy: 99.5, // 재고 정확도 (실제 측정 필요)
  };

  for (const record of movements) {
    const count = Number(record.count);
    kpis.transactions.total += count;

    if (record.type === "RECEIVE") kpis.transactions.receive = count;
    else if (record.type === "ISSUE") kpis.transactions.issue = count;
    else kpis.transactions.transfer += count;
  }

  // 재고 회전율 계산 (간단한 근사치)
  if (currentValue.totalValue > 0) {
    kpis.turnoverRate = (kpis.transactions.issue / config.days) * 30;
  }

  return kpis;
};

