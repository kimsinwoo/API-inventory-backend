/**
 * 입고/출고 트랜잭션 라우트
 */
const { Router } = require("express");
const ctrl = require("../controller/inventoryTransactionController");
const vr = require("../middleware/validateinventoryTransaction");
const { authenticate } = require("../utils/sessionAuth");

const router = Router();

/* ===============================
 * 🔹 트랜잭션 목록 및 통계
 * =============================== */

// 트랜잭션 목록 조회
router.get(
  "/",
  authenticate,
  vr.validateListTransactions,
  ctrl.list
);

// 트랜잭션 통계
router.get(
  "/stats",
  authenticate,
  vr.validateTransactionStats,
  ctrl.stats
);

// 월별 입출고 현황 (창고 이용률용)
router.get(
  "/monthly-utilization",
  authenticate,
  ctrl.monthlyUtilization
);

// 트랜잭션 상세 조회
router.get(
  "/:id",
  authenticate,
  vr.validateTransactionId,
  ctrl.detail
);

/* ===============================
 * 🔹 입고 처리
 * =============================== */

// 입고
router.post(
  "/receive",
  authenticate,
  vr.validateReceiveTransaction,
  ctrl.receive
);

/* ===============================
 * 🔹 출고 처리
 * =============================== */

// 출고
router.post(
  "/issue",
  authenticate,
  vr.validateIssueTransaction,
  ctrl.issue
);

// 일괄 출고 (배송 관리용)
router.post(
  "/batch-issue",
  authenticate,
  vr.validateBatchIssue,
  ctrl.batchIssue
);

/* ===============================
 * 🔹 공장 간 이동
 * =============================== */

// 공장 간 이동
router.post(
  "/transfer",
  authenticate,
  vr.validateTransferTransaction,
  ctrl.transfer
);

module.exports = router;

