/**
 * 알림 라우트
 */
const { Router } = require("express");
const notificationController = require("../controller/notificationController");

const router = Router();

/**
 * GET /api/notifications/low-stock
 * 재고 부족 알림
 */
router.get("/low-stock", notificationController.getLowStock);

/**
 * GET /api/notifications/expiring
 * 유통기한 임박 알림
 */
router.get("/expiring", notificationController.getExpiring);

/**
 * GET /api/notifications/expired
 * 만료된 재고
 */
router.get("/expired", notificationController.getExpired);

/**
 * GET /api/notifications/summary
 * 전체 알림 요약
 */
router.get("/summary", notificationController.getSummary);

/**
 * GET /api/notifications/factory-alerts
 * 공장별 알림
 */
router.get("/factory-alerts", notificationController.getFactoryAlerts);

/**
 * GET /api/notifications/daily-report
 * 일일 알림 리포트
 */
router.get("/daily-report", notificationController.getDailyAlertReport);

module.exports = router;

