// middleware/authMiddleware.js

const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  // Mengambil token dari header Authorization (Bearer <token>)
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    // Memverifikasi token dengan JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Pastikan userId ada di dalam token yang terdekripsi
    if (!decoded.userId) {
      return res.status(401).json({ msg: "Invalid token data" });
    }

    // Menyimpan userId di req.user agar bisa digunakan di controller
    req.user = { userId: decoded.userId };

    next(); // Melanjutkan ke middleware berikutnya (seperti controller)
  } catch (err) {
    console.error(err.message);
    res.status(401).json({ msg: "Token is not valid" });
  }
};

module.exports = authMiddleware;
