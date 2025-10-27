/**
 * 공장/창고 간 이동 라우트
 */
const { Router } = require("express");
const ctrl = require("../controller/warehouseTransferController");
const vr = require("../middleware/validateWarehouseTransfer");
const { authenticate } = require("../utils/sessionAuth");

const router = Router();

/* ===============================
 * 🔹 공장/창고 간 이동
 * =============================== */

// 공장/창고 간 이동
router.post(
  "/",
  authenticate,
  vr.validateTransfer,
  ctrl.transfer
);

// 이동 이력 조회
router.get(
  "/history",
  authenticate,
  vr.validateHistory,
  ctrl.history
);

// 이동 경로 통계
router.get(
  "/path-stats",
  authenticate,
  vr.validatePathStats,
  ctrl.pathStats
);

module.exports = router;

