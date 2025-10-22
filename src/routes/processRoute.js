const express = require("express");
const ctrl = require("../controller/processController");
const { validateProcessCreate } = require("../middleware/validate");

const router = express.Router();

// /api/processes
router.get("/", ctrl.index);
router.get("/:id", ctrl.show);
router.post("/", validateProcessCreate, ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.destroy);

module.exports = router;
