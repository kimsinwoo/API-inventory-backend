"use strict";

const express = require("express");
const router = express.Router();

const ctrl = require("../controller/factoryController");
const pagination = require("../middleware/pagination");
const idParam = require("../middleware/idParam");
const validateFactory = require("../middleware/validateFactory");

// 목록
router.get("/", pagination, ctrl.list);

// 상세
router.get("/:id", idParam, ctrl.detail);

// 생성
router.post("/", validateFactory, ctrl.create);

// 수정(일부 필드만 보낼 수도 있으므로 validate는 요청 본문 유효성에 맞게 사용)
router.patch("/:id", idParam, validateFactory, ctrl.update);

// 삭제
router.delete("/:id", idParam, ctrl.remove);

module.exports = router;
