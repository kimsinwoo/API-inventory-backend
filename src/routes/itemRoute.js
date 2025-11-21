const express = require("express");
const ctrl = require("../controller/itemController");
const vr = require("../middleware/validateItem");
const { authenticate } = require("../utils/sessionAuth");
const { requirePermission } = require("../middleware/permissionMiddleware");

const router = express.Router();

router.get("/", authenticate, requirePermission("can_basic_info"), ctrl.index);
router.get("/id/:id", authenticate, requirePermission("can_basic_info"), ctrl.showById);
router.get("/code/:code", authenticate, requirePermission("can_basic_info"), ctrl.showByCode);
router.post("/", authenticate, requirePermission("can_basic_info"), vr.validateItemCreate, ctrl.create);
router.patch("/:id", authenticate, requirePermission("can_basic_info"), vr.validateItemCreate, ctrl.update);
router.delete("/:id", authenticate, requirePermission("can_basic_info"), ctrl.destroy);

module.exports = router;
