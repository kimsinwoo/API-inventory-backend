const { Router } = require("express");
const authController = require("../controller/authController");
const { authenticate } = require("../utils/sessionAuth");
const { uploadSignature, handleUploadError } = require("../middleware/signatureUploadMiddleware");

const router = Router();

router.post("/login", authController.login);
router.post("/join", authController.signup);
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.getMe);
router.get("/", authenticate, authController.getAllUsers);
router.get("/:id", authenticate, authController.getUserById);
router.put("/:id", authenticate, authController.updateUser);
router.delete("/:id", authenticate, authController.deleteUser);

// 도장(서명) 관련 라우트
// router.post("/signature", authenticate, uploadSignature, handleUploadError, authController.uploadSignature);
// router.get("/signature", authenticate, authController.getSignature);

module.exports = router;
