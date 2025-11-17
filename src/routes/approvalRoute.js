"use strict";

const express = require("express");

module.exports = (models) => {
  const router = express.Router();
  const requireAuth = require("../middleware/auth")(models);
  const ctrl = require("../controllers/approvalController")(models);
  router.get("/approvals/inbox", requireAuth, ctrl.inbox);

  router.get("/approvals/:id", requireAuth, ctrl.detail);

  router.post("/approvals/:id/approve", requireAuth, ctrl.approve);
  router.post("/approvals/:id/reject", requireAuth, ctrl.reject);

  return router;
};
