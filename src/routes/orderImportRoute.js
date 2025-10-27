/**
 * 주문서 가져오기 라우트
 * - 파일 업로드 및 통합 처리
 * - 엑셀 다운로드
 */

const express = require('express');
const router = express.Router();

const orderImportController = require('../controller/orderImportController');
const { uploadSingle, uploadMultiple, handleUploadError } = require('../middleware/uploadMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @route   POST /api/order-import/upload
 * @desc    단일 파일 업로드 및 분석
 * @access  Private (추후 auth 미들웨어 추가 가능)
 */
router.post(
  '/upload',
  uploadSingle,
  handleUploadError,
  asyncHandler(orderImportController.uploadSingleFile)
);

/**
 * @route   POST /api/order-import/upload-multiple
 * @desc    다중 파일 업로드 및 통합
 * @access  Private
 */
router.post(
  '/upload-multiple',
  uploadMultiple,
  handleUploadError,
  asyncHandler(orderImportController.uploadMultipleFiles)
);

/**
 * @route   GET /api/order-import/download/:filename
 * @desc    통합 파일 다운로드
 * @access  Private
 */
router.get(
  '/download/:filename',
  asyncHandler(orderImportController.downloadFile)
);

/**
 * @route   GET /api/order-import/files
 * @desc    업로드된 파일 목록 조회
 * @access  Private
 */
router.get(
  '/files',
  asyncHandler(orderImportController.getUploadedFiles)
);

/**
 * @route   DELETE /api/order-import/files/:filename
 * @desc    파일 삭제
 * @access  Private
 */
router.delete(
  '/files/:filename',
  asyncHandler(orderImportController.deleteFile)
);

module.exports = router;

