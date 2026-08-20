const express = require("express");
const multer = require("multer");
const cloudinary = require("../lib/cloudinary");

const router = express.Router();

const postController = require("../controllers/postController");
// ❌ Purana Path (Isko hatao):
// const authMiddleware = require("../middleware/authMiddleware");

// ✅ Naya Path (Isko likho):
const authMiddleware = require("../authMiddleware");

// ==========================================
// MULTER + CLOUDINARY CONFIGURATION
// ==========================================

// File ko disk par save karne ki jagah memory (RAM) me rakhte hain,
// fir seedha Cloudinary ko stream kar dete hain. Isse Render restart
// hone par bhi images gayab nahi hoti (pehle local /uploads folder
// use ho raha tha jo ephemeral hai).
const storage = multer.memoryStorage();

const upload = multer({
  storage,
});

// Multer ke baad chalne wala middleware — file buffer ko Cloudinary
// par upload karke result ka secure_url req.cloudinaryUrl me daal deta hai,
// jise aage controller (createPost / updatePost) use karta hai.
const uploadToCloudinary = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const streamUpload = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "filmycharcha-posts" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

    const result = await streamUpload();
    req.cloudinaryUrl = result.secure_url;
    next();
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    res.status(500).json({
      success: false,
      message: "Image upload failed",
    });
  }
};

// ==========================================
// PUBLIC GET ROUTES (visible on the website, no login needed)
// ==========================================

// Get published posts
router.get("/public", postController.getPublishedPosts);

// Get top news
router.get("/topnews", postController.getTopNews);

// Get gallery
router.get("/gallery", postController.getGallery);

// Search posts (title, category, tags, keywords)
router.get("/search", postController.searchPosts);

// Get posts by category
router.get(
  "/category/:category",
  postController.getPostsByCategory
);

// Get post by slug
router.get(
  "/slug/:slug",
  postController.getPostBySlug
);

// ==========================================
// ADMIN GET ROUTES (login required, owner-only)
// ==========================================

// Get all posts — ONLY the logged-in user's own posts
router.get("/", authMiddleware, postController.getAllPosts);

// Get post by ID — must belong to logged-in user
router.get("/:id", authMiddleware, postController.getPostById);

// ==========================================
// POST
// ==========================================

// Create new post — saved under the logged-in user
router.post(
  "/",
  authMiddleware,
  upload.single("featuredImage"),
  uploadToCloudinary,
  postController.createPost
);

// ==========================================
// PUT
// ==========================================

// Update post — only if owner
router.put(
  "/:id",
  authMiddleware,
  upload.single("featuredImage"),
  uploadToCloudinary,
  postController.updatePost
);

// ==========================================
// PATCH
// ==========================================

// Update status — only if owner
router.patch(
  "/:id/status",
  authMiddleware,
  postController.updateStatus
);

// Toggle top news — only if owner
router.patch(
  "/:id/toggle-topnews",
  authMiddleware,
  postController.toggleTopNews
);

// ==========================================
// DELETE
// ==========================================

// Delete post — only if owner
router.delete(
  "/:id",
  authMiddleware,
  postController.deletePost
);

module.exports = router;