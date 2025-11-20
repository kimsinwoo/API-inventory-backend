const Router = require("express");
const ctrl = require("../controller/inventoryController");
const vr = require("../middleware/validateInventory");
// const { authenticate } = require("../utils/sessionAuth");
// const { requirePermission } = require("../middleware/permissionMiddleware");

const router = Router();

// 목록(+요약 메타)
router.get("/", /* authenticate, requirePermission("can_inventory"), */ vr.listRules, ctrl.index);

// 요약 전용
router.get("/summary", /* authenticate, requirePermission("can_inventory"), */ vr.summaryRules, ctrl.summary);

// 창고 이용률
router.get("/utilization", /* authenticate, requirePermission("can_inventory"), */ ctrl.utilization);

// 이동 이력
router.get("/movements", /* authenticate, requirePermission("can_inventory"), */ vr.movementListRules, ctrl.movements);

router.post("/receive", /* authenticate, requirePermission("can_receiving"), */ vr.receiveRules, ctrl.receive);
router.post("/issue", /* authenticate, requirePermission("can_shipping"), */ vr.issueRules, ctrl.issue);
router.post("/transfer", /* authenticate, requirePermission("can_plant_transfer"), */ vr.transferRules, ctrl.transfer);
router.delete("/:id", /* authenticate, requirePermission("can_inventory"), */ ctrl.destroy);

module.exports = router;
