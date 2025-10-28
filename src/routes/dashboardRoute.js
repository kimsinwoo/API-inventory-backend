/**
 * 대시보드 라우트
 */
const { Router } = require("express");
const dashboardController = require("../controller/dashboardController");

const router = Router();

/**
 * GET /api/dashboard
 * 메인 대시보드 (모든 데이터)
 */
router.get("/", dashboardController.getMainDashboard);

/**
 * GET /api/dashboard/total-value
 * 총 재고 가치
 */
router.get("/total-value", dashboardController.getTotalValue);

/**
 * GET /api/dashboard/category-breakdown
 * 카테고리별 재고 분포
 */
router.get("/category-breakdown", dashboardController.getCategoryBreakdown);

/**
 * GET /api/dashboard/recent-movements
 * 최근 재고 이동
 */
router.get("/recent-movements", dashboardController.getRecentMovements);

/**
 * GET /api/dashboard/top-moving-items
 * 가장 많이 움직인 품목
 */
router.get("/top-moving-items", dashboardController.getTopMovingItems);

/**
 * GET /api/dashboard/stock-status
 * 재고 상태 요약
 */
router.get("/stock-status", dashboardController.getStockStatus);

/**
 * GET /api/dashboard/monthly-trend
 * 월별 트렌드
 */
router.get("/monthly-trend", dashboardController.getMonthlyTrend);

/**
 * GET /api/dashboard/factory-comparison
 * 공장별 비교
 */
router.get("/factory-comparison", dashboardController.getFactoryComparison);

/**
 * GET /api/dashboard/kpis
 * KPI 지표
 */
router.get("/kpis", dashboardController.getKPIs);

module.exports = router;

