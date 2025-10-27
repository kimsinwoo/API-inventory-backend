const express = require("express");
const ctrl = require("../controller/itemController");
const vr = require("../middleware/validateItem");

const router = express.Router();

router.get("/", ctrl.index);
router.get("/id/:id", ctrl.showById);
router.get("/code/:code", ctrl.showByCode);
router.post("/", vr.validateItemCreate, ctrl.create);
router.patch("/:id", vr.validateItemCreate, ctrl.update);
router.delete("/:id", ctrl.destroy);

module.exports = router;
