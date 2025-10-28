/**
 * 재고 예측 라우트
 */
const { Router } = require("express");
const predictionController = require("../controller/predictionController");

const router = Router();

/**
 * GET /api/predictions/stockouts
 * 전체 품목 재고 소진 예측
 */
router.get("/stockouts", predictionController.predictAllStockouts);

/**
 * GET /api/predictions/:itemId/consumption-pattern
 * 소비 패턴 분석
 */
router.get(
  "/:itemId/consumption-pattern",
  predictionController.getConsumptionPattern
);

/**
 * GET /api/predictions/:itemId/stockout
 * 품목별 재고 소진 예측
 */
router.get("/:itemId/stockout", predictionController.predictStockout);

/**
 * GET /api/predictions/:itemId/reorder-quantity
 * 재주문 수량 계산
 */
router.get("/:itemId/reorder-quantity", predictionController.getReorderQuantity);

/**
 * GET /api/predictions/:itemId/seasonality
 * 계절성 분석
 */
router.get("/:itemId/seasonality", predictionController.getSeasonality);

/**
 * GET /api/predictions/:itemId/forecast
 * 수요 예측
 */
router.get("/:itemId/forecast", predictionController.forecastDemand);

module.exports = router;

