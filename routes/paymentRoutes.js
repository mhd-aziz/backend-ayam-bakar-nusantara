const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// Route untuk membuat pembayaran baru
router.post("/create", paymentController.createPayment);

// Route untuk memperbarui status pembayaran
router.post("/update-status", paymentController.updatePaymentStatus);

module.exports = router;
