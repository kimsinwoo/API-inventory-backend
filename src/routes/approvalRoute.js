"use strict";

const express = require("express");

module.exports = (models) => {
  const router = express.Router();
  const requireAuth = require("../middleware/auth")(models);
  const ctrl = require("../controllers/approvalController")(models);

  // “현재 차례만 보이는” 내 결재함
  router.get("/approvals/inbox", requireAuth, ctrl.inbox);

  // 상세(현재차례/직전단계 열람은 프론트에서 버튼 숨김 처리)
  router.get("/approvals/:id", requireAuth, ctrl.detail);

  // 승인/반려 (현재 차례 & 내 역할/내 id 아닐 경우 서비스에서 에러)
  router.post("/approvals/:id/approve", requireAuth, ctrl.approve);
  router.post("/approvals/:id/reject", requireAuth, ctrl.reject);

  return router;
};
