/**
 * 헬스체크 및 시스템 모니터링 서비스
 */
const db = require("../../models");
const { sequelize } = db;
const dayjs = require("dayjs");

/**
 * 데이터베이스 연결 확인
 */
async function checkDatabaseConnection() {
  try {
    await sequelize.authenticate();
    const [[result]] = await sequelize.query("SELECT 1 + 1 AS result");
    return {
      status: "healthy",
      responseTime: 0, // 실제로는 측정 필요
      details: {
        connected: true,
        result: result?.result === 2,
      },
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error.message,
      details: {
        connected: false,
      },
    };
  }
}

/**
 * 데이터베이스 통계
 */
async function getDatabaseStats() {
  try {
    const tables = [
      "Inventories",
      "Items",
      "Factory",
      "InventoryMovements",
      "Approvals",
      "Users",
    ];

    const stats = {};

    for (const table of tables) {
      const [[result]] = await sequelize.query(
        `SELECT COUNT(*) as count FROM ${table}`
      );
      stats[table] = result.count;
    }

    return {
      status: "success",
      stats,
    };
  } catch (error) {
    return {
      status: "error",
      error: error.message,
    };
  }
}

/**
 * 시스템 정보
 */
function getSystemInfo() {
  const os = require("os");

  return {
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    uptime: process.uptime(),
    uptimeFormatted: formatUptime(process.uptime()),
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
      usagePercent: Math.round(
        ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
      ),
    },
    cpu: {
      model: os.cpus()[0]?.model,
      cores: os.cpus().length,
      loadAverage: os.loadavg(),
    },
  };
}

/**
 * 업타임 포맷팅
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${days}일 ${hours}시간 ${minutes}분 ${secs}초`;
}

/**
 * 전체 헬스체크
 */
exports.performHealthCheck = async () => {
  const startTime = Date.now();

  const [dbHealth, dbStats] = await Promise.all([
    checkDatabaseConnection(),
    getDatabaseStats(),
  ]);

  const systemInfo = getSystemInfo();

  const responseTime = Date.now() - startTime;

  const overallStatus =
    dbHealth.status === "healthy" ? "healthy" : "degraded";

  return {
    status: overallStatus,
    timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    responseTime: `${responseTime}ms`,
    services: {
      database: dbHealth,
      databaseStats: dbStats,
    },
    system: systemInfo,
  };
};

/**
 * 간단한 ping 체크
 */
exports.ping = () => {
  return {
    status: "ok",
    timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    message: "pong",
  };
};

/**
 * 준비 상태 확인 (Kubernetes readiness probe)
 */
exports.checkReadiness = async () => {
  try {
    await sequelize.authenticate();
    return {
      ready: true,
      timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    };
  } catch (error) {
    return {
      ready: false,
      error: error.message,
      timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    };
  }
};

/**
 * 활성 상태 확인 (Kubernetes liveness probe)
 */
exports.checkLiveness = () => {
  return {
    alive: true,
    timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  };
};

/**
 * 시스템 메트릭스
 */
exports.getMetrics = async () => {
  const [dbStats] = await Promise.all([getDatabaseStats()]);

  const systemInfo = getSystemInfo();

  return {
    timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    database: dbStats,
    system: {
      uptime: systemInfo.uptime,
      memory: systemInfo.memory,
      cpu: systemInfo.cpu,
    },
    process: {
      memoryUsage: process.memoryUsage(),
      pid: process.pid,
      version: process.version,
    },
  };
};

