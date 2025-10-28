/**
 * 헬스체크 라우트
 */
const { Router } = require("express");
const healthCheckController = require("../controller/healthCheckController");

const router = Router();

/**
 * GET /api/health
 * 전체 헬스체크
 */
router.get("/", healthCheckController.healthCheck);

/**
 * GET /api/health/ping
 * 간단한 ping 체크
 */
router.get("/ping", healthCheckController.ping);

/**
 * GET /api/health/readiness
 * Kubernetes readiness probe
 */
router.get("/readiness", healthCheckController.readiness);

/**
 * GET /api/health/liveness
 * Kubernetes liveness probe
 */
router.get("/liveness", healthCheckController.liveness);

/**
 * GET /api/health/metrics
 * 시스템 메트릭스
 */
router.get("/metrics", healthCheckController.metrics);

module.exports = router;

