const express = require("express");
const ctrl = require("../controller/factoryController");
const { validateFactoryCreate, validateFactoryUpdate } = require("../middleware/validate");

const router = express.Router();


router.get("/", ctrl.index);
router.get("/:id", ctrl.show);
router.post("/", validateFactoryCreate, ctrl.create);
router.put("/:id", validateFactoryUpdate, ctrl.update);
router.delete("/:id", ctrl.destroy);

router.get("/:id/processes", ctrl.show); 
router.post("/:id/processes", ctrl.addProcesses);
router.delete("/:id/processes/:processId", ctrl.removeProcess);

module.exports = router;
