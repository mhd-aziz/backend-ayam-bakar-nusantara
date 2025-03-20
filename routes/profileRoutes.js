// routes/profileRoutes.js

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  upload,
  uploadProfilePicture,
  updateProfile,
  getProfile,
  deleteProfilePicture,
} = require("../controllers/profileController");

// POST: Upload foto profil
router.post(
  "/profile/picture",
  authMiddleware,
  upload.single("profilePicture"),
  uploadProfilePicture
);

// PUT: Update data profil (selain foto)
router.put("/profile", authMiddleware, updateProfile);

// GET: Dapatkan profil
router.get("/profile", authMiddleware, getProfile);

// DELETE: Hapus foto profil
router.delete("/profile/picture", authMiddleware, deleteProfilePicture);

module.exports = router;
