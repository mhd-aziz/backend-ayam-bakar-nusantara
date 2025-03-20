const express = require("express");
const { PrismaClient } = require("@prisma/client");
const cors = require("cors"); // Menambahkan CORS
const dotenv = require("dotenv"); // Untuk mengatur environment variables
const prisma = new PrismaClient();
const bodyParser = require("body-parser");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

dotenv.config(); // Memuat variabel lingkungan dari file .env

const app = express();

// Middleware untuk parsing JSON
app.use(express.json());
app.use(bodyParser.json());

// Middleware untuk mengizinkan akses CORS (Cross-Origin Resource Sharing)
// Menambahkan CORS untuk pengembangan atau pengujian frontend di domain yang berbeda
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*", // Membuka akses untuk semua domain
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware untuk menangani route autentikasi dan profil
app.use("/api/auth", authRoutes);
app.use("/api", profileRoutes);
app.use("/api", sellerRoutes);
app.use("/api", productRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/payment", paymentRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack); // Menampilkan error di server console
  res.status(500).json({ msg: "Something went wrong!", error: err.message });
});

// Menjalankan server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
