const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware"); // Ensure you have this middleware to handle JWT authentication
const {
  createOrder,
  getOrdersBySeller,
  getOrdersByCustomer,
  cancelOrder,
} = require("../controllers/orderController");

// Route to create an order and initiate payment via Midtrans
router.post("/create", authMiddleware, createOrder);

// Route to retrieve all orders for a specific seller
router.get("/seller", authMiddleware, getOrdersBySeller);

// Route to retrieve all orders by a customer
router.get("/customer", authMiddleware, getOrdersByCustomer);

// Route to cancel an order
router.post("/cancel", authMiddleware, cancelOrder);

module.exports = router;
