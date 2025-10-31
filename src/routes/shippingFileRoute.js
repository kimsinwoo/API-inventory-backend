const express = require("express");
const router = express.Router();

const controller = require("../controller/shippingFileController");
const { uploadSingle, uploadMultiple, handleUploadError } = require("../middleware/uploadMiddleware");
const { validateShippingParams } = require("../middleware/validateShippingFile");
const asyncHandler = require("../middleware/asyncHandler");

// 업로드 (단일/다중 모두 지원)
router.post(
  "/upload",
  validateShippingParams,
  uploadMultiple,
  handleUploadError,
  asyncHandler(controller.upload)
);

// 저장하기 (그룹 상태 저장)
router.post(
  "/save",
  asyncHandler(controller.save)
);

// 그룹 목록 조회 (issueType별)
router.get(
  "/groups",
  asyncHandler(controller.list)
);

// 그룹 다운로드 (정리된 엑셀, 기본 cj, ?format=standard 지원)
router.get(
  "/download/:groupId",
  asyncHandler(controller.download)
);

// 개별 파일 삭제
router.delete(
  "/files/:id",
  asyncHandler(controller.remove)
);

module.exports = router;


