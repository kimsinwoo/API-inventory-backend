/**
 * 입고/출고 예정 트랜잭션 라우트
 */
const { Router } = require("express");
const ctrl = require("../controller/plannedTransactionController");
const vr = require("../middleware/validatePlannedTransaction");
// const { authenticate } = require("../utils/sessionAuth");
// const { requirePermission } = require("../middleware/permissionMiddleware");

const router = Router();

/* ===============================
 * 🔹 예정 트랜잭션 CRUD
 * =============================== */

// 예정 트랜잭션 생성
router.post(
  "/",
  // authenticate,
  // requirePermission("can_receiving"),
  vr.validateCreatePlanned,
  ctrl.create
);

// 예정 트랜잭션 목록 조회
router.get(
  "/",
  // authenticate,
  // requirePermission("can_receiving"),
  vr.validateListPlanned,
  ctrl.list
);

// 통계 조회
router.get(
  "/stats",
  // authenticate,
  // requirePermission("can_receiving"),
  ctrl.stats
);

// 예정 트랜잭션 상세 조회
router.get(
  "/:id",
  // authenticate,
  // requirePermission("can_receiving"),
  vr.validatePlannedId,
  ctrl.detail
);

// 예정 트랜잭션 수정
router.put(
  "/:id",
  // authenticate,
  // requirePermission("can_receiving"),
  vr.validatePlannedId,
  vr.validateUpdatePlanned,
  ctrl.update
);

// 예정 트랜잭션 삭제
router.delete(
  "/:id",
  // authenticate,
  // requirePermission("can_receiving"),
  vr.validatePlannedId,
  ctrl.remove
);

/* ===============================
 * 🔹 승인/거부
 * =============================== */

// 승인
router.post(
  "/:id/approve",
  // authenticate,
  // requirePermission("can_receiving"),
  vr.validatePlannedId,
  vr.validateApprovePlanned,
  ctrl.approve
);

// 거부/취소
router.post(
  "/:id/reject",
  // authenticate,
  // requirePermission("can_receiving"),
  vr.validatePlannedId,
  ctrl.reject
);

/* ===============================
 * 🔹 완료 처리
 * =============================== */

// 입고 예정 → 실제 입고 처리
router.post(
  "/:id/complete-receive",
  // authenticate,
  // requirePermission("can_receiving"),
  vr.validatePlannedId,
  vr.validateCompletePlannedReceive,
  ctrl.completeReceive
);

// 출고 예정 → 실제 출고 처리
router.post(
  "/:id/complete-issue",
  // authenticate,
  // requirePermission("can_shipping"),
  vr.validatePlannedId,
  vr.validateCompletePlannedIssue,
  ctrl.completeIssue
);

module.exports = router;

