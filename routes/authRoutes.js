const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// ======================================================
// JWT SECRET
// ======================================================

const JWT_SECRET =
  "8f7d9a2c4e1b6f9a7d3c5e8b2a1f6d4c";

// ======================================================
// REGISTER
// ======================================================

router.post("/register", async (req, res) => {
  try {
    const {
      username,
      email,
      password,
    } = req.body;

    // --------------------------------------------------
    // CHECK REQUIRED FIELDS
    // --------------------------------------------------

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Username, email and password are required",
      });
    }

    // --------------------------------------------------
    // CHECK PASSWORD LENGTH
    // --------------------------------------------------

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
    }

    // --------------------------------------------------
    // NORMALIZE DATA
    // --------------------------------------------------

    const normalizedUsername =
      username.trim();

    const normalizedEmail =
      email.toLowerCase().trim();

    // --------------------------------------------------
    // CHECK EXISTING USER
    // --------------------------------------------------

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "User already exists with this email",
      });
    }

    // --------------------------------------------------
    // HASH PASSWORD
    // --------------------------------------------------

    const hashedPassword =
      await bcrypt.hash(password, 10);

    // --------------------------------------------------
    // CREATE USER
    // --------------------------------------------------

    const newUser = new User({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
    });

    const savedUser =
      await newUser.save();

    // --------------------------------------------------
    // CREATE JWT
    // --------------------------------------------------

    const token = jwt.sign(
      {
        id: savedUser._id.toString(),
        username: savedUser.username,
        email: savedUser.email,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Registration successful",

      token,

      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
      },
    });
  } catch (error) {
    console.error(
      "❌ Register Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error during registration",
    });
  }
});

// ======================================================
// LOGIN
// ======================================================

router.post("/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    // --------------------------------------------------
    // CHECK REQUIRED FIELDS
    // --------------------------------------------------

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    // --------------------------------------------------
    // NORMALIZE EMAIL
    // --------------------------------------------------

    const normalizedEmail =
      email.toLowerCase().trim();

    // --------------------------------------------------
    // FIND USER
    // --------------------------------------------------

    const user =
      await User.findOne({
        email: normalizedEmail,
      });

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    // --------------------------------------------------
    // COMPARE PASSWORD
    // --------------------------------------------------

    const isPasswordCorrect =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    // --------------------------------------------------
    // CREATE JWT
    // --------------------------------------------------

    const token = jwt.sign(
      {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Login successful",

      token,

      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(
      "❌ Login Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error during login",
    });
  }
});

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;