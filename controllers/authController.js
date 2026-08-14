const jwt = require("jsonwebtoken");
const User = require("../models/User"); 
const bcrypt = require("bcryptjs");

// 🔑 LOGIN CONTROLLER
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid Email or Password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid Email or Password" });
    }

    // 🎯 PAYLOAD FIX: Username aur Email ko yahan token ke andar daala
    const token = jwt.sign(
      { 
        id: user._id, 
        username: user.username, 
        email: user.email 
      },
      process.env.JWT_SECRET || "a-string-secret-at-least-256-bits-long",
      { expiresIn: "7d" }
    );

    // Frontend ko sirf token bhejenge
    return res.status(200).json({
      success: true,
      token
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};