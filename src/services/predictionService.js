/**
 * 재고 예측 및 분석 서비스
 */
const db = require("../../models");
const { InventoryMovement, Items } = db;
const { Op, fn, col } = require("sequelize");
const dayjs = require("dayjs");

/**
 * 품목별 소비 패턴 분석
 */
exports.analyzeConsumptionPattern = async (itemId, days = 30) => {
  const startDate = dayjs().subtract(days, "day");

  const movements = await InventoryMovement.findAll({
    where: {
      item_id: itemId,
      type: "ISSUE",
      occurred_at: {
        [Op.gte]: startDate.toDate(),
      },
    },
    attributes: [
      [fn("DATE", col("occurred_at")), "date"],
      [fn("SUM", col("quantity")), "dailyQuantity"],
    ],
    group: [fn("DATE", col("occurred_at"))],
    order: [[fn("DATE", col("occurred_at")), "ASC"]],
    raw: true,
  });

  if (movements.length === 0) {
    return {
      itemId,
      period: `${days}일`,
      pattern: "데이터 부족",
      avgDailyConsumption: 0,
      maxDailyConsumption: 0,
      minDailyConsumption: 0,
      trend: "unknown",
    };
  }

  const quantities = movements.map((m) => Number(m.dailyQuantity));
  const total = quantities.reduce((sum, qty) => sum + qty, 0);
  const avg = total / days; // 기간 전체로 나눔 (이동 없는 날 포함)
  const max = Math.max(...quantities);
  const min = Math.min(...quantities);

  // 트렌드 분석 (최근 1/3 vs 이전 2/3)
  const recentThird = Math.floor(movements.length / 3);
  const recentAvg =
    movements
      .slice(-recentThird)
      .reduce((sum, m) => sum + Number(m.dailyQuantity), 0) / recentThird;
  const previousAvg =
    movements
      .slice(0, -recentThird)
      .reduce((sum, m) => sum + Number(m.dailyQuantity), 0) /
    (movements.length - recentThird);

  let trend = "stable";
  if (recentAvg > previousAvg * 1.2) trend = "increasing";
  else if (recentAvg < previousAvg * 0.8) trend = "decreasing";

  return {
    itemId,
    period: `${days}일`,
    totalConsumption: total,
    avgDailyConsumption: Math.round(avg * 100) / 100,
    maxDailyConsumption: max,
    minDailyConsumption: min,
    trend,
    trendDetails: {
      recentAvg: Math.round(recentAvg * 100) / 100,
      previousAvg: Math.round(previousAvg * 100) / 100,
    },
  };
};

/**
 * 재고 소진 예상 날짜 계산
 */
exports.predictStockout = async (itemId, factoryId = null) => {
  // 현재 재고
  const whereInventory = { item_id: itemId, quantity: { [Op.gt]: 0 } };
  if (factoryId) whereInventory.factory_id = factoryId;

  const currentStock = await db.Inventories.findOne({
    attributes: [[fn("SUM", col("quantity")), "totalQuantity"]],
    where: whereInventory,
    raw: true,
  });

  const totalQty = Number(currentStock?.totalQuantity ?? 0);

  if (totalQty === 0) {
    return {
      itemId,
      factoryId,
      currentStock: 0,
      status: "재고 없음",
      daysUntilStockout: 0,
      estimatedStockoutDate: dayjs().format("YYYY-MM-DD"),
    };
  }

  // 소비 패턴 분석
  const pattern = await exports.analyzeConsumptionPattern(itemId, 30);

  if (pattern.avgDailyConsumption === 0) {
    return {
      itemId,
      factoryId,
      currentStock: totalQty,
      status: "소비 없음",
      daysUntilStockout: 999,
      estimatedStockoutDate: null,
      avgDailyConsumption: 0,
    };
  }

  const daysUntilStockout = Math.floor(totalQty / pattern.avgDailyConsumption);
  const estimatedStockoutDate = dayjs()
    .add(daysUntilStockout, "day")
    .format("YYYY-MM-DD");

  let status = "정상";
  if (daysUntilStockout <= 3) status = "긴급";
  else if (daysUntilStockout <= 7) status = "주의";
  else if (daysUntilStockout <= 14) status = "경고";

  return {
    itemId,
    factoryId,
    currentStock: totalQty,
    avgDailyConsumption: pattern.avgDailyConsumption,
    daysUntilStockout,
    estimatedStockoutDate,
    status,
    trend: pattern.trend,
  };
};

/**
 * 모든 품목의 재고 소진 예측
 */
exports.predictAllStockouts = async (factoryId = null) => {
  const where = {};
  if (factoryId) where.factory_id = factoryId;

  const items = await Items.findAll({
    attributes: ["id", "code", "name", "category", "unit", "shortage"],
    where,
  });

  const predictions = [];

  for (const item of items) {
    const prediction = await exports.predictStockout(item.id, factoryId);

    if (prediction.currentStock > 0 && prediction.daysUntilStockout < 30) {
      predictions.push({
        ...prediction,
        itemCode: item.code,
        itemName: item.name,
        category: item.category,
        unit: item.unit,
        minimumStock: Number(item.shortage),
      });
    }
  }

  // 긴급도 순으로 정렬
  predictions.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);

  return {
    factoryId,
    totalItems: items.length,
    itemsAtRisk: predictions.length,
    predictions,
    generatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  };
};

/**
 * 최적 재주문 수량 계산 (EOQ - Economic Order Quantity)
 */
exports.calculateReorderQuantity = async (itemId) => {
  const pattern = await exports.analyzeConsumptionPattern(itemId, 30);
  const item = await Items.findByPk(itemId);

  if (!item || pattern.avgDailyConsumption === 0) {
    return {
      itemId,
      error: "데이터 부족 또는 소비 없음",
    };
  }

  // 간단한 재주문 수량 계산
  // 실제로는 리드타임, 안전재고, 주문비용 등을 고려해야 함
  const leadTimeDays = 7; // 기본 리드타임 7일
  const safetyStockDays = 3; // 안전재고 3일분

  const avgDailyDemand = pattern.avgDailyConsumption;
  const reorderPoint = avgDailyDemand * (leadTimeDays + safetyStockDays);
  const orderQuantity = avgDailyDemand * 30; // 30일분 주문

  return {
    itemId,
    itemCode: item.code,
    itemName: item.name,
    avgDailyDemand: Math.round(avgDailyDemand * 100) / 100,
    leadTimeDays,
    safetyStockDays,
    reorderPoint: Math.round(reorderPoint),
    recommendedOrderQuantity: Math.round(orderQuantity),
    unit: item.unit,
    estimatedCost: Math.round(orderQuantity * Number(item.wholesale_price)),
  };
};

/**
 * 계절성 분석 (월별 소비 패턴)
 */
exports.analyzeSeasonality = async (itemId, months = 12) => {
  const startDate = dayjs().subtract(months, "month");

  const movements = await InventoryMovement.findAll({
    where: {
      item_id: itemId,
      type: "ISSUE",
      occurred_at: {
        [Op.gte]: startDate.toDate(),
      },
    },
    attributes: [
      [fn("DATE_FORMAT", col("occurred_at"), "%Y-%m"), "month"],
      [fn("SUM", col("quantity")), "monthlyQuantity"],
    ],
    group: [fn("DATE_FORMAT", col("occurred_at"), "%Y-%m")],
    order: [[fn("DATE_FORMAT", col("occurred_at"), "%Y-%m"), "ASC"]],
    raw: true,
  });

  if (movements.length < 3) {
    return {
      itemId,
      error: "계절성 분석을 위한 데이터가 부족합니다 (최소 3개월 필요)",
    };
  }

  const monthlyData = movements.map((m) => ({
    month: m.month,
    quantity: Number(m.monthlyQuantity),
  }));

  const quantities = monthlyData.map((m) => m.quantity);
  const avgMonthly = quantities.reduce((sum, qty) => sum + qty, 0) / quantities.length;
  const maxMonth = monthlyData.reduce((max, m) => (m.quantity > max.quantity ? m : max));
  const minMonth = monthlyData.reduce((min, m) => (m.quantity < min.quantity ? m : min));

  // 변동 계수 (CV) 계산
  const stdDev = Math.sqrt(
    quantities.reduce((sum, qty) => sum + Math.pow(qty - avgMonthly, 2), 0) /
      quantities.length
  );
  const cv = (stdDev / avgMonthly) * 100;

  let seasonalityLevel = "낮음";
  if (cv > 30) seasonalityLevel = "높음";
  else if (cv > 15) seasonalityLevel = "중간";

  return {
    itemId,
    period: `${months}개월`,
    monthlyData,
    avgMonthly: Math.round(avgMonthly),
    maxMonth: {
      month: maxMonth.month,
      quantity: maxMonth.quantity,
    },
    minMonth: {
      month: minMonth.month,
      quantity: minMonth.quantity,
    },
    variationCoefficient: Math.round(cv * 100) / 100,
    seasonalityLevel,
  };
};

/**
 * 수요 예측 (단순 이동평균)
 */
exports.forecastDemand = async (itemId, forecastDays = 7) => {
  const pattern = await exports.analyzeConsumptionPattern(itemId, 30);

  if (pattern.avgDailyConsumption === 0) {
    return {
      itemId,
      forecastDays,
      error: "예측을 위한 데이터가 부족합니다",
    };
  }

  const dailyForecasts = [];
  for (let i = 1; i <= forecastDays; i++) {
    const date = dayjs().add(i, "day");
    dailyForecasts.push({
      date: date.format("YYYY-MM-DD"),
      forecastedDemand: Math.round(pattern.avgDailyConsumption * 100) / 100,
      confidence: pattern.trend === "stable" ? "높음" : "중간",
    });
  }

  const totalForecast = dailyForecasts.reduce(
    (sum, f) => sum + f.forecastedDemand,
    0
  );

  return {
    itemId,
    forecastDays,
    totalForecastedDemand: Math.round(totalForecast),
    avgDailyForecast: pattern.avgDailyConsumption,
    trend: pattern.trend,
    dailyForecasts,
    generatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  };
};

