const express = require("express");
const ctrl = require("../controller/itemController");
const { validateItemCreate, validateItemUpdate } = require("../middleware/validateItem");

const router = express.Router();

router.get("/", ctrl.index);
router.get("/by-code/:code", ctrl.showByCode);
router.get("/:id", ctrl.showById);
router.post("/", validateItemCreate, ctrl.create);
router.put("/:id", validateItemUpdate, ctrl.update);
router.delete("/:id", ctrl.destroy);

module.exports = router;
