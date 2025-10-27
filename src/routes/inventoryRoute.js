const Router = require("express");
const ctrl = require("../controller/inventoryController");
const vr = require("../middleware/validateInventory");

const router = Router();

// 목록(+요약 메타)
router.get("/", vr.listRules, ctrl.index);

// 요약 전용
router.get("/summary", vr.summaryRules, ctrl.summary);

// 창고 이용률
router.get("/utilization", ctrl.utilization);

// 이동 이력
router.get("/movements", vr.movementListRules, ctrl.movements);

router.post("/receive", vr.receiveRules, ctrl.receive);
router.post("/issue", vr.issueRules, ctrl.issue);
router.post("/transfer", vr.transferRules, ctrl.transfer);
router.delete("/:id", ctrl.destroy);

module.exports = router;
