const { Router } = require("express");
const authController = require("../controller/authController");
const { authenticate } = require("../utils/sessionAuth");

const router = Router();

router.post("/login", authController.login);
router.post("/join", authController.signup);
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.getMe);
router.get("/", authenticate, authController.getAllUsers);
router.get("/:id", authenticate, authController.getUserById);
router.put("/:id", authenticate, authController.updateUser);
router.delete("/:id", authenticate, authController.deleteUser);

module.exports = router;
