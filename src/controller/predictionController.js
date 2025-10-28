/**
 * 재고 예측 컨트롤러
 */
const predictionService = require("../services/predictionService");

/**
 * 소비 패턴 분석
 */
exports.getConsumptionPattern = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { days = 30 } = req.query;

    const pattern = await predictionService.analyzeConsumptionPattern(
      itemId,
      parseInt(days)
    );

    res.json({
      ok: true,
      data: pattern,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 재고 소진 예측
 */
exports.predictStockout = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { factoryId } = req.query;

    const prediction = await predictionService.predictStockout(
      itemId,
      factoryId
    );

    res.json({
      ok: true,
      data: prediction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 전체 품목 재고 소진 예측
 */
exports.predictAllStockouts = async (req, res, next) => {
  try {
    const { factoryId } = req.query;

    const predictions = await predictionService.predictAllStockouts(factoryId);

    res.json({
      ok: true,
      data: predictions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 재주문 수량 계산
 */
exports.getReorderQuantity = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const reorder = await predictionService.calculateReorderQuantity(itemId);

    res.json({
      ok: true,
      data: reorder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 계절성 분석
 */
exports.getSeasonality = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { months = 12 } = req.query;

    const seasonality = await predictionService.analyzeSeasonality(
      itemId,
      parseInt(months)
    );

    res.json({
      ok: true,
      data: seasonality,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 수요 예측
 */
exports.forecastDemand = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { days = 7 } = req.query;

    const forecast = await predictionService.forecastDemand(
      itemId,
      parseInt(days)
    );

    res.json({
      ok: true,
      data: forecast,
    });
  } catch (error) {
    next(error);
  }
};

