const express = require("express");
const ctrl = require("../controller/bomController");
const { validateBOMCreate, validateBOMUpdate } = require("../middleware/validateBom");
// const { authenticate } = require("../utils/sessionAuth");
// const { requirePermission } = require("../middleware/permissionMiddleware");

const router = express.Router();

router.get("/", /* authenticate, requirePermission("can_basic_info"), */ ctrl.index);
router.get("/:id", /* authenticate, requirePermission("can_basic_info"), */ ctrl.show);
router.post("/", /* authenticate, requirePermission("can_basic_info"), */ validateBOMCreate, ctrl.create);
router.put("/:id", /* authenticate, requirePermission("can_basic_info"), */ validateBOMUpdate, ctrl.update);
router.delete("/:id", /* authenticate, requirePermission("can_basic_info"), */ ctrl.destroy);

module.exports = router;
