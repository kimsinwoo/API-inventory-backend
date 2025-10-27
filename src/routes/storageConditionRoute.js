const Router = require("express");
const ctrl = require("../controller/storageConditionController");
const vr = require("../middleware/validateStorageCondition");

const router = Router();

// ✅ CRUD
router.get("/", ctrl.index);
router.get("/:id", ctrl.detail);
router.post("/", vr.createRules, ctrl.create);
router.put("/:id", vr.updateRules, ctrl.update);
router.delete("/:id", ctrl.destroy);

module.exports = router;
