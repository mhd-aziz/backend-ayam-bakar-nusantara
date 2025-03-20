const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const midtransClient = require("midtrans-client"); // Midtrans SDK

// Initialize Midtrans client
const midtrans = new midtransClient.CoreApi({
  isProduction: false, // Change to true for production
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

/**
 * 1. CREATE: Place an order (including order items and initiate payment)
 */
const createOrder = async (req, res) => {
  const { productIds, quantities, totalAmount } = req.body;
  const customerId = req.user.userId; // customerId from JWT

  try {
    // 1. Find customer details and seller details
    const seller = await prisma.seller.findUnique({
      where: { userId: customerId },
    });

    if (!seller) {
      return res.status(404).json({ msg: "Seller not found" });
    }

    // 2. Create the order
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}`,
        orderStatus: "Pending",
        totalAmount,
        customerId,
        sellerId: seller.sellerId, // Use sellerId from the Seller model
      },
    });

    // 3. Verify if each productId exists in the Product table before creating order items
    for (let i = 0; i < productIds.length; i++) {
      const product = await prisma.product.findUnique({
        where: { id: productIds[i] }, // Ensure product exists
      });

      if (!product) {
        return res
          .status(404)
          .json({ msg: `Product with id ${productIds[i]} not found` });
      }

      // Add order items
      await prisma.orderItem.create({
        data: {
          productId: productIds[i], // Ensure this is a valid productId
          quantity: quantities[i],
          orderId: order.id,
        },
      });
    }

    // 4. Create payment for the order
    const payment = await prisma.payment.create({
      data: {
        transactionId: `TXN-${Date.now()}`,
        paymentStatus: "Pending",
        paymentMethod: "Midtrans",
        paymentAmount: totalAmount,
        orderId: order.id,
      },
    });

    // 5. Initiate Midtrans payment
    const parameter = {
      payment_type: "credit_card",
      transaction_details: {
        order_id: payment.transactionId,
        gross_amount: totalAmount,
      },
      credit_card: {
        secure: true,
      },
    };

    // 6. Perform the payment charge with Midtrans
    midtrans
      .charge(parameter)
      .then(async (chargeResponse) => {
        // If charge succeeds, update the payment status
        await prisma.payment.update({
          where: { id: payment.id },
          data: { paymentStatus: "Success" },
        });

        res.status(200).json({
          msg: "Order created and payment processed successfully",
          order,
          chargeResponse,
        });
      })
      .catch((err) => {
        console.log(err);
        return res.status(500).json({ msg: "Payment initiation failed" });
      });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error placing the order" });
  }
};

/**
 * 2. GET: Retrieve orders for a specific seller
 */
const getOrdersBySeller = async (req, res) => {
  const sellerId = req.user.userId; // sellerId from JWT

  try {
    const orders = await prisma.order.findMany({
      where: { sellerId },
      include: { orderItems: true, payment: true },
    });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ msg: "No orders found" });
    }

    res.status(200).json({
      msg: "Orders retrieved successfully",
      orders,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error retrieving orders" });
  }
};

/**
 * 3. GET: Retrieve orders by customer
 */
const getOrdersByCustomer = async (req, res) => {
  const customerId = req.user.userId;

  try {
    const orders = await prisma.order.findMany({
      where: { customerId },
      include: { orderItems: true, payment: true },
    });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ msg: "No orders found" });
    }

    res.status(200).json({
      msg: "Orders retrieved successfully",
      orders,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error retrieving orders" });
  }
};

/**
 * 4. DELETE: Cancel an order
 */
const cancelOrder = async (req, res) => {
  const { id } = req.body; // Order ID to cancel

  try {
    let order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    // Update the order status to cancelled
    order = await prisma.order.update({
      where: { id },
      data: {
        orderStatus: "Cancelled",
      },
    });

    return res.status(200).json({
      msg: "Order cancelled successfully",
      order,
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: "Error cancelling order" });
  }
};

module.exports = {
  createOrder,
  getOrdersBySeller,
  getOrdersByCustomer,
  cancelOrder,
};
