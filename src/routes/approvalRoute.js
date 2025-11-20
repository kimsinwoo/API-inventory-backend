"use strict";

const express = require("express");

module.exports = (models) => {
  const router = express.Router();
  // const requireAuth = require("../middleware/auth")(models);
  const ctrl = require("../controller/approvalController")(models);
  
  router.post("/", /* requireAuth, */ ctrl.create);
  router.get("/", /* requireAuth, */ ctrl.inbox);
  router.get("/:id", /* requireAuth, */ ctrl.detail);
  router.post("/:id/approve", /* requireAuth, */ ctrl.approve);
  router.post("/:id/reject", /* requireAuth, */ ctrl.reject);

  return router;
};
