const { Router } = require("express");

// const temperatureRoute = require("./temperatureRoute");

const router = Router();

// 기존 라우트
router.use("/approval", require("./approvalRoute"));
router.use("/auth", require("./authRoute"));
router.use("/processes", require("./processRoute"));
router.use("/factories", require("./factoryRoute"));
router.use("/items", require("./itemRoute"));
router.use("/boms", require("./bomRoute"));
router.use("/inventories", require("./inventoryRoute"));
router.use("/inventory-transactions", require("./inventoryTransactionRoute"));
router.use("/warehouse-transfers", require("./warehouseTransferRoute"));
router.use("/storage-conditions", require("./storageConditionRoute"));
router.use("/order-import", require("./orderImportRoute"));

// 새로운 라우트 - 대시보드, 알림, 리포트
router.use("/dashboard", require("./dashboardRoute"));
router.use("/notifications", require("./notificationRoute"));
router.use("/reports", require("./reportRoute"));

// 헬스체크 및 예측
router.use("/health", require("./healthCheckRoute"));
router.use("/predictions", require("./predictionRoute"));

// router.use("/temperature", temperatureRoute);

module.exports = router;
