const Router = require("express");
const ctrl = require("../controller/inventoryController");
const vr = require("../middleware/validateInventory");

const router = Router();

router.get("/", vr.listRules, ctrl.index);
router.post("/receive", vr.receiveRules, ctrl.receive);
router.post("/issue", vr.issueRules, ctrl.issue);
router.post("/transfer", vr.transferRules, ctrl.transfer);
router.delete("/:id", ctrl.destroy);

module.exports = router;
