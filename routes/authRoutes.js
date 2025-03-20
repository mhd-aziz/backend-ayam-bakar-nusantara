// routes/auth.js

const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  validateRegisterInput,
  validateLoginInput,
} = require("../middleware/validateInputMiddleware");
const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  updateUserProfile,
} = require("../controllers/authController");
const router = express.Router();

// Registrasi
router.post("/register", validateRegisterInput, registerUser);

// Login
router.post("/login", validateLoginInput, loginUser);

// Forgot Password
router.post("/forgot-password", forgotPassword);

// Reset Password
router.post("/reset-password", resetPassword);

// Update Profil Pengguna
router.put("/account", authMiddleware, updateUserProfile);

module.exports = router;
