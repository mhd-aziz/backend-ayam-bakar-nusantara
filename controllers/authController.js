// controllers/authController.js

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");
const prisma = new PrismaClient();

// Setup Nodemailer untuk mengirim email
const transporter = nodemailer.createTransport({
  service: "gmail", // Atau bisa menggunakan SMTP server lain
  auth: {
    user: process.env.EMAIL_USER, // Email pengirim
    pass: process.env.EMAIL_PASS, // Password atau App Password jika 2FA aktif
  },
});

// Registrasi Pengguna
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Mengecek apakah username atau email sudah terdaftar
    let user = await prisma.authUser.findFirst({
      // Ganti dari prisma.user ke prisma.authUser
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Membuat pengguna baru di model AuthUser
    user = await prisma.authUser.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    res.status(201).json({ msg: "User registered successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Login Pengguna
const loginUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Mencari user berdasarkan username atau email di model AuthUser
    let user = await prisma.authUser.findFirst({
      // Ganti dari prisma.user ke prisma.authUser
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Verifikasi password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Membuat dan mengirimkan token JWT
    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.authUser.findUnique({
      // Ganti dari prisma.user ke prisma.authUser
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    // Membuat token untuk reset password
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h", // Token berlaku selama 1 jam
    });

    // URL untuk reset password
    const resetUrl = `http://localhost:5000/api/auth/reset-password/${token}`;

    // Mengirim email dengan link reset password
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Request",
      text: `Click the following link to reset your password: ${resetUrl}`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ msg: "Error sending email" });
      }
      res.status(200).json({ msg: "Password reset link sent to email" });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Memverifikasi token reset password
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Meng-hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password pengguna di database model AuthUser
    const user = await prisma.authUser.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ msg: "Password has been successfully reset" });
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ msg: "Invalid or expired token" });
  }
};

// Update Profil Pengguna
const updateUserProfile = async (req, res) => {
  const { userId } = req.user; // Pastikan userId diambil dari req.user setelah melalui authMiddleware
  const { username, email, password, newPassword } = req.body;

  try {
    // Mengecek apakah email atau username sudah digunakan oleh pengguna lain
    const existingUser = await prisma.authUser.findFirst({
      where: {
        OR: [
          { username }, // Mengecek apakah username sudah ada
          { email }, // Mengecek apakah email sudah ada
        ],
        NOT: { id: userId }, // Mengabaikan pengguna yang sama
      },
    });

    if (existingUser) {
      return res.status(400).json({ msg: "Username or email already in use" });
    }

    // Jika password baru diberikan, hash password baru
    let hashedPassword;
    if (newPassword) {
      hashedPassword = await bcrypt.hash(newPassword, 10);
    }

    // Update profil pengguna
    const updatedUser = await prisma.authUser.update({
      where: { id: userId }, // Pastikan menggunakan userId di sini
      data: {
        username: username || undefined, // Jika username diberikan
        email: email || undefined, // Jika email diberikan
        password: hashedPassword || undefined, // Jika password baru diberikan
      },
    });

    res.status(200).json({
      msg: "Profile updated successfully",
      userProfile: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  updateUserProfile,
};
