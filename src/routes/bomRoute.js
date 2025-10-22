const express = require("express");
const ctrl = require("../controller/bomController");
const { validateBOMCreate, validateBOMUpdate } = require("../middleware/validateBom");

const router = express.Router();

router.get("/", ctrl.index);
router.get("/:id", ctrl.show);
router.post("/", validateBOMCreate, ctrl.create);
router.put("/:id", validateBOMUpdate, ctrl.update);
router.delete("/:id", ctrl.destroy);

module.exports = router;
