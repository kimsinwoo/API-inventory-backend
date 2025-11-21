/**
 * 배송 관리 라우트
 */
const express = require("express");
const router = express.Router();

const shippingController = require("../controller/shippingController");
const { uploadMultiple } = require("../middleware/uploadMiddleware");
const asyncHandler = require("../middleware/asyncHandler");
const { authenticate } = require("../utils/sessionAuth");
const { requirePermission } = require("../middleware/permissionMiddleware");

/* ===============================
 * 📦 주문서 업로드 및 관리
 * =============================== */

/**
 * @route   POST /api/shipping/upload-orders
 * @desc    다중 플랫폼 주문서 업로드
 * @access  Private
 */
router.post(
  "/upload-orders",
  authenticate,
  requirePermission("can_shipping"),
  uploadMultiple,
  asyncHandler(shippingController.uploadOrders)
);

/**
 * @route   GET /api/shipping/orders
 * @desc    주문 목록 조회
 * @access  Private
 */
router.get(
  "/orders",
  authenticate,
  requirePermission("can_shipping"),
  asyncHandler(shippingController.getOrders)
);

/**
 * @route   GET /api/shipping/orders/:id
 * @desc    주문 상세 조회
 * @access  Private
 */
router.get(
  "/orders/:id",
  authenticate,
  requirePermission("can_shipping"),
  asyncHandler(shippingController.getOrderDetail)
);

/**
 * @route   PUT /api/shipping/orders/:id
 * @desc    주문 정보 수정
 * @access  Private
 */
router.put(
  "/orders/:id",
  authenticate,
  requirePermission("can_shipping"),
  asyncHandler(shippingController.updateOrder)
);

/**
 * @route   DELETE /api/shipping/orders/:id
 * @desc    주문 삭제
 * @access  Private
 */
router.delete(
  "/orders/:id",
  authenticate,
  requirePermission("can_shipping"),
  asyncHandler(shippingController.deleteOrder)
);

/* ===============================
 * 📤 CJ대한통운 양식 변환 및 내보내기
 * =============================== */

/**
 * @route   POST /api/shipping/export/cj-logistics
 * @desc    CJ대한통운 양식으로 내보내기
 * @access  Private
 */
router.post(
  "/export/cj-logistics",
  authenticate,
  requirePermission("can_shipping"),
  asyncHandler(shippingController.exportToCJLogistics)
);

/**
 * @route   GET /api/shipping/download/:filename
 * @desc    파일 다운로드
 * @access  Private
 */
router.get(
  "/download/:filename",
  authenticate,
  requirePermission("can_shipping"),
  asyncHandler(shippingController.downloadFile)
);

/* ===============================
 * 📋 출고 리스트 관리
 * =============================== */

/**
 * @route   POST /api/shipping/issue-list/generate
 * @desc    출고 리스트 자동 생성
 * @access  Private
 */
router.post(
  "/issue-list/generate",
  authenticate,
  requirePermission("can_shipping"),
  asyncHandler(shippingController.generateIssueList)
);

/**
 * @route   GET /api/shipping/issue-list/:id/export
 * @desc    출고 리스트 엑셀 내보내기
 * @access  Private
 */
router.get(
  "/issue-list/:id/export",
  authenticate,
  requirePermission("can_shipping"),
  asyncHandler(shippingController.exportIssueList)
);

/**
 * @route   POST /api/shipping/issue-list/:id/process
 * @desc    출고 처리 (재고 연동)
 * @access  Private
 */
router.post(
  "/issue-list/:id/process",
  authenticate,
  requirePermission("can_shipping"),
  asyncHandler(shippingController.processIssue)
);

/* ===============================
 * 📦 송장 번호 관리
 * =============================== */

/**
 * @route   POST /api/shipping/tracking-numbers/bulk
 * @desc    송장 번호 일괄 등록
 * @access  Private
 */
router.post(
  "/tracking-numbers/bulk",
  authenticate,
  requirePermission("can_shipping"),
  asyncHandler(shippingController.bulkUpdateTrackingNumbers)
);

/**
 * @route   POST /api/shipping/tracking-numbers/upload
 * @desc    송장 번호 엑셀 업로드
 * @access  Private
 */
router.post(
  "/tracking-numbers/upload",
  authenticate,
  requirePermission("can_shipping"),
  uploadMultiple,
  asyncHandler(shippingController.uploadTrackingNumbers)
);

/* ===============================
 * 📊 배치 관리
 * =============================== */

/**
 * @route   GET /api/shipping/batches
 * @desc    배치 목록 조회
 * @access  Private
 */
router.get(
  "/batches",
  authenticate,
  requirePermission("can_shipping"),
  asyncHandler(shippingController.getBatches)
);

/**
 * @route   GET /api/shipping/batches/:id
 * @desc    배치 상세 조회
 * @access  Private
 */
router.get(
  "/batches/:id",
  authenticate,
  requirePermission("can_shipping"),
  asyncHandler(shippingController.getBatchDetail)
);

/**
 * @route   POST /api/shipping/batches/:id/confirm
 * @desc    배치 확정
 * @access  Private
 */
router.post(
  "/batches/:id/confirm",
  authenticate,
  requirePermission("can_shipping"),
  asyncHandler(shippingController.confirmBatch)
);

/**
 * @route   DELETE /api/shipping/batches/:id
 * @desc    배치 삭제
 * @access  Private
 */
router.delete(
  "/batches/:id",
  authenticate,
  requirePermission("can_shipping"),
  asyncHandler(shippingController.deleteBatch)
);

module.exports = router;

