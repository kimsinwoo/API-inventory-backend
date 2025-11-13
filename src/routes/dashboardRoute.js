/**
 * 대시보드 라우트
 */
const { Router } = require("express");
const dashboardRoute = require("../controller/dashboardController");

const router = Router();

router.use("/summary", dashboardRoute.getDashboardSummary);

module.exports = router;