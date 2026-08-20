const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("../lib/cloudinary");
const authMiddleware = require("../authMiddleware");
const {
  getAllStories,
  getStoryBySlug,
  createStory,
  deleteStory,
} = require("../controllers/webStoryController");

// File ko disk par save karne ki jagah memory (RAM) me rakhte hain,
// fir seedha Cloudinary ko stream kar dete hain. Isse Render restart
// hone par bhi images gayab nahi hoti.
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Multer ke baad chalne wala middleware — saari uploaded files ko
// Cloudinary par upload karke unke secure_url ka array
// req.cloudinaryUrls me daal deta hai, jise controller use karta hai.
const uploadMultipleToCloudinary = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  try {
    const uploadOne = (file) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "filmycharcha-webstories" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        stream.end(file.buffer);
      });

    req.cloudinaryUrls = await Promise.all(req.files.map(uploadOne));
    next();
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    res.status(500).json({ message: "Image upload failed" });
  }
};

router.get("/", getAllStories);
router.get("/:slug", getStoryBySlug);
router.post(
  "/",
  authMiddleware,
  upload.array("images", 10),
  uploadMultipleToCloudinary,
  createStory
);
router.delete("/:id", authMiddleware, deleteStory);

module.exports = router;