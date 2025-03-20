// routes/sellerRoutes.js

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() }); // Inisialisasi multer untuk gambar

const {
  createProduct, // Menambahkan rute untuk produk
  getProducts, // Menambahkan rute untuk mendapatkan produk
  updateProduct, // Menambahkan rute untuk update produk
  deleteProduct, // Menambahkan rute untuk menghapus produk
} = require("../controllers/productController");

// POST: Menambahkan Produk Baru
router.post(
  "/product",
  authMiddleware,
  upload.single("productImage"),
  createProduct
);

// GET: Mendapatkan Produk dari Seller
router.get("/product", authMiddleware, getProducts);

// PUT: Mengupdate Produk
router.put(
  "/product",
  authMiddleware,
  upload.single("productImage"),
  updateProduct
);

// DELETE: Menghapus Produk
router.delete("/product", authMiddleware, deleteProduct);

module.exports = router;
