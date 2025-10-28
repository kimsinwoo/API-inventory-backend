/**
 * 알림 컨트롤러
 */
const notificationService = require("../services/notificationService");

/**
 * 재고 부족 알림 조회
 */
exports.getLowStock = async (req, res, next) => {
  try {
    const { factoryId } = req.query;
    const lowStock = await notificationService.checkLowStock(factoryId);

    res.json({
      ok: true,
      data: lowStock,
      count: lowStock.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 유통기한 임박 알림 조회
 */
exports.getExpiring = async (req, res, next) => {
  try {
    const { factoryId, days = 3 } = req.query;
    const expiring = await notificationService.checkExpiringItems(
      parseInt(days),
      factoryId
    );

    res.json({
      ok: true,
      data: expiring,
      count: expiring.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 만료된 재고 조회
 */
exports.getExpired = async (req, res, next) => {
  try {
    const { factoryId } = req.query;
    const expired = await notificationService.checkExpiredItems(factoryId);

    res.json({
      ok: true,
      data: expired,
      count: expired.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 전체 알림 요약
 */
exports.getSummary = async (req, res, next) => {
  try {
    const { factoryId } = req.query;
    const summary = await notificationService.getNotificationSummary(factoryId);

    res.json({
      ok: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 공장별 알림 조회
 */
exports.getFactoryAlerts = async (req, res, next) => {
  try {
    const alerts = await notificationService.getFactoryAlerts();

    res.json({
      ok: true,
      data: alerts,
      count: alerts.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 일일 알림 리포트
 */
exports.getDailyAlertReport = async (req, res, next) => {
  try {
    const report = await notificationService.generateDailyAlertReport();

    res.json({
      ok: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

