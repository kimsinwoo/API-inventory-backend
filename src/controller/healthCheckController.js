/**
 * 헬스체크 컨트롤러
 */
const healthCheckService = require("../services/healthCheckService");

/**
 * 전체 헬스체크
 */
exports.healthCheck = async (req, res, next) => {
  try {
    const health = await healthCheckService.performHealthCheck();

    const statusCode = health.status === "healthy" ? 200 : 503;

    res.status(statusCode).json({
      ok: health.status === "healthy",
      data: health,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Ping (간단한 응답 확인)
 */
exports.ping = (req, res) => {
  const result = healthCheckService.ping();
  res.json(result);
};

/**
 * Readiness Probe (준비 상태)
 */
exports.readiness = async (req, res, next) => {
  try {
    const ready = await healthCheckService.checkReadiness();

    const statusCode = ready.ready ? 200 : 503;

    res.status(statusCode).json(ready);
  } catch (error) {
    next(error);
  }
};

/**
 * Liveness Probe (활성 상태)
 */
exports.liveness = (req, res) => {
  const alive = healthCheckService.checkLiveness();
  res.json(alive);
};

/**
 * 시스템 메트릭스
 */
exports.metrics = async (req, res, next) => {
  try {
    const metrics = await healthCheckService.getMetrics();

    res.json({
      ok: true,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
};

