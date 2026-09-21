const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const {
  createUser,
  loginUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  sendTestEmail,
  verifyOTP,
  forgotPassword,
  verifyResetOTP,
  resetPassword
} = require("../controllers/userController");

router.use((req, res, next) => {
  console.log("User router middleware");

  next();
});

router.post("/", createUser);

router.post("/login", loginUser);

router.get("/test-email", sendTestEmail);

router.post("/verify-otp", verifyOTP);

router.post("/reset-password",resetPassword);

router.post("/forgot-password", forgotPassword);

router.post("/verify-reset-otp", verifyResetOTP);

router.get("/", authMiddleware, getUsers);

router.get("/:id", authMiddleware, getUser);

router.put("/:id", authMiddleware, updateUser);

router.delete("/:id", authMiddleware, deleteUser);

module.exports = router;
