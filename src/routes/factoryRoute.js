const express = require("express");
const ctrl = require("../controller/factoryController");
const { validateFactoryCreate, validateFactoryUpdate } = require("../middleware/validate");
// const { authenticate } = require("../utils/sessionAuth");
// const { requirePermission } = require("../middleware/permissionMiddleware");

const router = express.Router();

router.get("/", /* authenticate, requirePermission("can_basic_info"), */ ctrl.index);
router.get("/:id", /* authenticate, requirePermission("can_basic_info"), */ ctrl.show);
router.post("/", /* authenticate, requirePermission("can_basic_info"), */ validateFactoryCreate, ctrl.create);
router.put("/:id", /* authenticate, requirePermission("can_basic_info"), */ validateFactoryUpdate, ctrl.update);
router.delete("/:id", /* authenticate, requirePermission("can_basic_info"), */ ctrl.destroy);

router.get("/:id/processes", /* authenticate, requirePermission("can_basic_info"), */ ctrl.show); 
router.post("/:id/processes", /* authenticate, requirePermission("can_basic_info"), */ ctrl.addProcesses);
router.delete("/:id/processes/:processId", /* authenticate, requirePermission("can_basic_info"), */ ctrl.removeProcess);

module.exports = router;
