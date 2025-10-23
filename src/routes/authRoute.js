const { Router } = require("express");

const authController = require("../controller/authController");

const router = Router();

// router.get("/")
router.post("/login", authController.login);
// router.post("/join",)
router.post("/logout", authController.logout);

module.exports = router;
