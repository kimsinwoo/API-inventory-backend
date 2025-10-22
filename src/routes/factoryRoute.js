const express = require("express");
const ctrl = require("../controller/factoryController");
const { validateFactoryCreate, validateFactoryUpdate } = require("../middleware/validate");

const router = express.Router();

// /api/factories
router.get("/", ctrl.index);
router.get("/:id", ctrl.show);
router.post("/", validateFactoryCreate, ctrl.create);
router.put("/:id", validateFactoryUpdate, ctrl.update);
router.delete("/:id", ctrl.destroy);

// processes 관리
router.get("/:id/processes", ctrl.show); // 포함 반환(상동)
router.post("/:id/processes", ctrl.addProcesses); // body: { processIds: [1,2,3] }
router.delete("/:id/processes/:processId", ctrl.removeProcess);

module.exports = router;
