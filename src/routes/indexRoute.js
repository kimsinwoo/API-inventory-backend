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
router.use("/planned-transactions", require("./plannedTransactionRoute"));
router.use("/warehouse-transfers", require("./warehouseTransferRoute"));
router.use("/storage-conditions", require("./storageConditionRoute"));
router.use("/order-import", require("./orderImportRoute"));

// 생산 작업 지시서
router.use("/work-orders", require("./workOrderRoute"));

// 라벨 프린트
router.use("/label", require("./labelRoute"));

// 배송 관리
router.use("/shipping", require("./shippingRoute"));

router.use("/dashboard", require("./dashboardRoute"));
router.use("/notifications", require("./notificationRoute"));
router.use("/reports", require("./reportRoute"));

router.use("/health", require("./healthCheckRoute"));
router.use("/predictions", require("./predictionRoute"));

// router.use("/temperature", temperatureRoute);

module.exports = router;
