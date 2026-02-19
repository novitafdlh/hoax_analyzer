const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

const SECRET_KEY = "super_secret_key";

const register = async (req, res) => {
  const { username, password, role } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  userModel.createUser(username, hashedPassword, role || "user", (err) => {
    if (err) return res.status(500).json({ message: "Gagal register" });

    res.json({ message: "Register berhasil" });
  });
};

const login = (req, res) => {
  const { username, password } = req.body;

  userModel.findUserByUsername(username, (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (results.length === 0) {
      return res.status(401).json({ message: "Username atau password salah" });
    }

    const user = results[0];

    bcrypt.compare(password, user.password, (err, result) => {
      if (!result) {
        return res.status(401).json({ message: "Username atau password salah" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        SECRET_KEY,
        { expiresIn: "1h" }
      );

      res.json({
        message: "Login berhasil",
        token
      });
    });
  });
};

module.exports = {
  register,
  login
};
