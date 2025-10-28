/**
 * 대시보드 컨트롤러
 */
const dashboardService = require("../services/dashboardService");

/**
 * 메인 대시보드 데이터
 */
exports.getMainDashboard = async (req, res, next) => {
  try {
    const { factoryId } = req.query;
    const dashboard = await dashboardService.getMainDashboard(factoryId);

    res.json({
      ok: true,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 총 재고 가치
 */
exports.getTotalValue = async (req, res, next) => {
  try {
    const { factoryId } = req.query;
    const value = await dashboardService.getTotalInventoryValue(factoryId);

    res.json({
      ok: true,
      data: value,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 카테고리별 재고 분포
 */
exports.getCategoryBreakdown = async (req, res, next) => {
  try {
    const { factoryId } = req.query;
    const breakdown = await dashboardService.getCategoryBreakdown(factoryId);

    res.json({
      ok: true,
      data: breakdown,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 최근 재고 이동
 */
exports.getRecentMovements = async (req, res, next) => {
  try {
    const { factoryId, limit = 10 } = req.query;
    const movements = await dashboardService.getRecentMovements(
      factoryId,
      parseInt(limit)
    );

    res.json({
      ok: true,
      data: movements,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 가장 많이 움직인 품목
 */
exports.getTopMovingItems = async (req, res, next) => {
  try {
    const { factoryId, days = 7, limit = 5 } = req.query;
    const items = await dashboardService.getTopMovingItems(
      factoryId,
      parseInt(days),
      parseInt(limit)
    );

    res.json({
      ok: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 재고 상태 요약
 */
exports.getStockStatus = async (req, res, next) => {
  try {
    const { factoryId } = req.query;
    const status = await dashboardService.getStockStatusSummary(factoryId);

    res.json({
      ok: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 월별 트렌드
 */
exports.getMonthlyTrend = async (req, res, next) => {
  try {
    const { factoryId, months = 6 } = req.query;
    const trend = await dashboardService.getMonthlyTrend(
      factoryId,
      parseInt(months)
    );

    res.json({
      ok: true,
      data: trend,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 공장별 비교
 */
exports.getFactoryComparison = async (req, res, next) => {
  try {
    const comparison = await dashboardService.getFactoryComparison();

    res.json({
      ok: true,
      data: comparison,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * KPI 지표
 */
exports.getKPIs = async (req, res, next) => {
  try {
    const { factoryId, period = "month" } = req.query;
    const kpis = await dashboardService.getKPIs(factoryId, period);

    res.json({
      ok: true,
      data: kpis,
    });
  } catch (error) {
    next(error);
  }
};

