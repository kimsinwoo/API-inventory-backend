/**
 * 생산 작업 지시서 라우트
 */
const { Router } = require("express");
const ctrl = require("../controller/workOrderController");
const vr = require("../middleware/validateWorkOrder");
// const { authenticate } = require("../utils/sessionAuth");
// const { requirePermission } = require("../middleware/permissionMiddleware");

const router = Router();

/* ===============================
 * 🔹 작업 지시서 CRUD
 * =============================== */

// 작업 지시서 생성
router.post(
  "/",
  // authenticate,
  // requirePermission("can_plant2_manufacture"),
  vr.validateCreateWorkOrder,
  ctrl.create
);

// 작업 지시서 목록 조회
router.get(
  "/",
  // authenticate,
  // requirePermission("can_plant2_manufacture"),
  vr.validateListWorkOrders,
  ctrl.list
);

// 통계 조회
router.get(
  "/stats",
  // authenticate,
  // requirePermission("can_plant2_manufacture"),
  vr.validateWorkOrderStats,
  ctrl.stats
);

// 작업 지시서 상세 조회
router.get(
  "/:id",
  // authenticate,
  // requirePermission("can_plant2_manufacture"),
  vr.validateWorkOrderId,
  ctrl.detail
);

// 작업 지시서 수정
router.put(
  "/:id",
  // authenticate,
  // requirePermission("can_plant2_manufacture"),
  vr.validateWorkOrderId,
  vr.validateUpdateWorkOrder,
  ctrl.update
);

// 작업 지시서 삭제
router.delete(
  "/:id",
  // authenticate,
  // requirePermission("can_plant2_manufacture"),
  vr.validateWorkOrderId,
  ctrl.remove
);

/* ===============================
 * 🔹 작업 상태 변경
 * =============================== */

// 작업 시작
router.post(
  "/:id/start",
  // authenticate,
  // requirePermission("can_plant2_manufacture"),
  vr.validateWorkOrderId,
  ctrl.start
);

// 생산 완료 처리
router.post(
  "/:id/complete",
  // authenticate,
  // requirePermission("can_plant2_manufacture"),
  vr.validateWorkOrderId,
  vr.validateCompleteWorkOrder,
  ctrl.complete
);

// 작업 취소
router.post(
  "/:id/cancel",
  // authenticate,
  // requirePermission("can_plant2_manufacture"),
  vr.validateWorkOrderId,
  vr.validateCancelWorkOrder,
  ctrl.cancel
);

module.exports = router;
