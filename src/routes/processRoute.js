"use strict";

const express = require("express");
const router = express.Router();

const ctrl = require("../controller/processController");
const pagination = require("../middleware/pagination");
const idParam = require("../middleware/idParam");
const validateProcess = require("../middleware/validateProcess");

// 목록
router.get("/", pagination, ctrl.list);

// 상세
router.get("/:id", idParam, ctrl.detail);

// 생성
router.post("/", validateProcess, ctrl.create);

// 수정
router.patch("/:id", idParam, validateProcess, ctrl.update);

// 삭제
router.delete("/:id", idParam, ctrl.remove);

module.exports = router;
