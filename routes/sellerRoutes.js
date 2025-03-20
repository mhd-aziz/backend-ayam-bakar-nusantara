// routes/sellerRoutes.js

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const {
  createSeller,
  getSeller,
  updateSeller,
  deleteSeller,
} = require("../controllers/sellerController");

// POST: Menambahkan Seller
router.post(
  "/seller",
  authMiddleware,
  upload.single("storeImage"),
  createSeller
);

// GET: Mendapatkan Detail Seller
router.get("/seller", authMiddleware, getSeller);

// PUT: Mengupdate Seller
router.put(
  "/seller",
  authMiddleware,
  upload.single("storeImage"),
  updateSeller
);

// DELETE: Menghapus Seller
router.delete("/seller", authMiddleware, deleteSeller);

module.exports = router;
