"use strict";

const express = require("express");
const roleController = require("../controller/roleController");
// const { authenticate } = require("../utils/sessionAuth");
// const { requirePermission } = require("../middleware/permissionMiddleware");

const router = express.Router();

// 모든 역할 목록 조회
router.get("/", /* authenticate, requirePermission("can_user_management"), */ roleController.index);

// 역할 상세 조회
router.get("/:id", /* authenticate, requirePermission("can_user_management"), */ roleController.show);

// 역할 생성
router.post("/", /* authenticate, requirePermission("can_user_management"), */ roleController.create);

// 역할 수정
router.put("/:id", /* authenticate, requirePermission("can_user_management"), */ roleController.update);

// 역할 삭제
router.delete("/:id", /* authenticate, requirePermission("can_user_management"), */ roleController.destroy);

// 권한 단일 업데이트
router.put("/:id/permissions/:permissionName", /* authenticate, requirePermission("can_user_management"), */ roleController.updatePermission);

// 권한 일괄 업데이트
router.put("/:id/permissions", /* authenticate, requirePermission("can_user_management"), */ roleController.updatePermissions);

module.exports = router;

