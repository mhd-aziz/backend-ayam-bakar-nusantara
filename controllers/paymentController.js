const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const axios = require("axios"); // Jika Anda perlu menggunakan Midtrans API

// Fungsi untuk membuat pembayaran baru
async function createPayment(req, res) {
  const { userId, productId, paymentMethod, grossAmount } = req.body;

  try {
    // Membuat entri pembayaran di database tanpa menyertakan paymentUrl
    const payment = await prisma.payment.create({
      data: {
        userId,
        productId,
        paymentMethod,
        grossAmount,
        paymentStatus: "pending",
        transactionId: `txn-${Date.now()}`, // Menggunakan timestamp untuk membuat ID transaksi unik
        orderId: `order-${Date.now()}`, // ID order unik
      },
    });

    // Buat request ke Midtrans untuk mendapatkan Snap Token
    const snapToken = await createSnapToken(payment);

    // Perbarui URL pembayaran dengan URL dari Midtrans
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        paymentUrl: snapToken.payment_url, // pastikan untuk menggunakan field yang benar dari respon API Midtrans
      },
    });

    return res.json({
      message: "Payment created successfully",
      payment,
      paymentUrl: snapToken.payment_url, // pastikan URL yang dikembalikan Midtrans
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create payment" });
  }
}

// Fungsi untuk menangani pembaruan status pembayaran
async function updatePaymentStatus(req, res) {
  const { orderId, paymentStatus } = req.body;

  try {
    // Cari pembayaran berdasarkan orderId
    const payment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Perbarui status pembayaran
    await prisma.payment.update({
      where: { orderId },
      data: {
        paymentStatus,
      },
    });

    return res.json({
      message: "Payment status updated successfully",
      payment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update payment status" });
  }
}

// Fungsi untuk membuat Snap Token dari Midtrans
async function createSnapToken(payment) {
  try {
    const response = await axios.post(
      "https://api.midtrans.com/v2/charge",
      {
        transaction_details: {
          order_id: payment.orderId, // pastikan orderId di sini
          gross_amount: payment.grossAmount,
        },
        credit_card: {
          secure: true,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            "SB-Mid-server-vDpXvL84IiTvOxvkVqlv8MqR"
          ).toString("base64")}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to create Snap Token");
  }
}

module.exports = {
  createPayment,
  updatePaymentStatus,
};
