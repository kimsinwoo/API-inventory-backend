const { Router } = require("express");

// const temperatureRoute = require("./temperatureRoute");

const router = Router();

router.use("/approval", require("./approvalRoute"));
router.use("/auth", require("./authRoute"));
router.use("/processes", require("./processRoute"));
router.use("/factories", require("./factoryRoute"));
router.use("/items", require("./itemRoute"));
router.use("/boms", require("./bomRoute"));
router.use("/inventories", require("./inventoryRoute"));

// router.use("/temperature", temperatureRoute);

module.exports = router;
