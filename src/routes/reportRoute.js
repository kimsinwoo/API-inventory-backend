/**
 * 리포트 라우트
 */
const { Router } = require("express");
const reportController = require("../controller/reportController");

const router = Router();

/**
 * GET /api/reports/daily
 * 일일 리포트
 */
router.get("/daily", reportController.getDailyReport);

/**
 * GET /api/reports/weekly
 * 주간 리포트
 */
router.get("/weekly", reportController.getWeeklyReport);

/**
 * GET /api/reports/monthly
 * 월간 리포트
 */
router.get("/monthly", reportController.getMonthlyReport);

/**
 * GET /api/reports/inventory-status
 * 재고 현황 리포트
 */
router.get("/inventory-status", reportController.getInventoryStatusReport);

/**
 * GET /api/reports/turnover-analysis
 * 재고 회전율 분석
 */
router.get("/turnover-analysis", reportController.getTurnoverAnalysis);

/**
 * GET /api/reports/list
 * 생성된 리포트 목록
 */
router.get("/list", reportController.listReports);

/**
 * GET /api/reports/download/:filename
 * 리포트 파일 다운로드
 */
router.get("/download/:filename", reportController.downloadReport);

module.exports = router;

