// middleware/validateInputMiddleware.js

// Middleware untuk validasi input registrasi
const validateRegisterInput = (req, res, next) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ msg: "Please provide all fields" });
  }

  // Validasi format email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ msg: "Invalid email format" });
  }

  next();
};

// Middleware untuk validasi input login
const validateLoginInput = (req, res, next) => {
  const { username, email, password } = req.body;
  if ((!username && !email) || !password) {
    return res
      .status(400)
      .json({ msg: "Please provide username/email and password" });
  }
  next();
};

module.exports = { validateRegisterInput, validateLoginInput };
