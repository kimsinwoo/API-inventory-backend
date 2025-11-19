/**
 * 공장/창고 간 이동 라우트
 */
const { Router } = require("express");
const ctrl = require("../controller/warehouseTransferController");
const vr = require("../middleware/validateWarehouseTransfer");
const { authenticate } = require("../utils/sessionAuth");
const { requirePermission } = require("../middleware/permissionMiddleware");

const router = Router();

/* ===============================
 * 🔹 공장/창고 간 이동
 * =============================== */

// 공장/창고 간 이동
router.post(
  "/",
  authenticate,
  requirePermission("can_plant_transfer"),
  vr.validateTransfer,
  ctrl.transfer
);

// 이동 이력 조회
router.get(
  "/history",
  authenticate,
  requirePermission("can_plant_transfer"),
  vr.validateHistory,
  ctrl.history
);

// 이동 경로 통계
router.get(
  "/path-stats",
  authenticate,
  requirePermission("can_plant_transfer"),
  vr.validatePathStats,
  ctrl.pathStats
);

module.exports = router;

