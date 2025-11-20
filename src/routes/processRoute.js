const express = require("express");
const ctrl = require("../controller/processController");
const { validateProcessCreate } = require("../middleware/validate");
// const { authenticate } = require("../utils/sessionAuth");
// const { requirePermission } = require("../middleware/permissionMiddleware");

const router = express.Router();

router.get("/", /* authenticate, requirePermission("can_basic_info"), */ ctrl.index);
router.get("/:id", /* authenticate, requirePermission("can_basic_info"), */ ctrl.show);
router.post("/", /* authenticate, requirePermission("can_basic_info"), */ validateProcessCreate, ctrl.create);
router.put("/:id", /* authenticate, requirePermission("can_basic_info"), */ ctrl.update);
router.delete("/:id", /* authenticate, requirePermission("can_basic_info"), */ ctrl.destroy);

module.exports = router;
