const Router = require("express");
const ctrl = require("../controller/storageConditionController");
const vr = require("../middleware/validateStorageCondition");
const { authenticate } = require("../utils/sessionAuth");
const { requirePermission } = require("../middleware/permissionMiddleware");

const router = Router();

// ✅ CRUD
router.get("/", authenticate, requirePermission("can_basic_info"), ctrl.index);
router.get("/:id", authenticate, requirePermission("can_basic_info"), ctrl.detail);
router.post("/", authenticate, requirePermission("can_basic_info"), vr.createRules, ctrl.create);
router.put("/:id", authenticate, requirePermission("can_basic_info"), vr.updateRules, ctrl.update);
router.delete("/:id", authenticate, requirePermission("can_basic_info"), ctrl.destroy);

// ✅ 품목 관리
router.post("/:id/items", authenticate, requirePermission("can_basic_info"), ctrl.addItems);
router.delete("/:id/items", authenticate, requirePermission("can_basic_info"), ctrl.removeItem);

module.exports = router;
