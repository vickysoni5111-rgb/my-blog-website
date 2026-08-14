// const express = require("express");
// const bcrypt = require("bcryptjs");
// const User = require("../models/User");

// const router = express.Router();

// router.post("/register", async (req, res) => {
//   try {
//     const { username, email, password } = req.body;

//     // Check required fields
//     if (!username || !email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Username, email and password are required",
//       });
//     }

//     // Check password length
//     if (password.length < 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Password must be at least 6 characters",
//       });
//     }

//     // Check existing user
//     const existingUser = await User.findOne({
//       email: email.toLowerCase(),
//     });

//     if (existingUser) {
//       return res.status(409).json({
//         success: false,
//         message: "User already exists with this email",
//       });
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create user
//     const user = await User.create({
//       username,
//       email: email.toLowerCase(),
//       password: hashedPassword,
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Registration successful",
//       data: {
//         id: user._id,
//         username: user.username,
//         email: user.email,
//       },
//     });
//   } catch (error) {
//     console.error("Register Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Server error during registration",
//     });
//   }
// });

// module.exports = router;
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    console.log("REGISTER DATA:", {
      username,
      email,
      password: password ? "******" : undefined,
    });

    // Required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email and password are required",
      });
    }

    // Password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Check existing user
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
    });

    console.log("✅ USER CREATED:", user.email);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("❌ Register Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
});

module.exports = router;