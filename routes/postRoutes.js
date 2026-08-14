const express = require("express");
const multer = require("multer");

const router = express.Router();

const postController = require("../controllers/postController");
// ❌ Purana Path (Isko hatao):
// const authMiddleware = require("../middleware/authMiddleware");

// ✅ Naya Path (Isko likho):
const authMiddleware = require("../authMiddleware");

// ==========================================
// MULTER CONFIGURATION
// ==========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() +
        "-" +
        file.originalname.replace(/\s+/g, "-")
    );
  },
});

const upload = multer({
  storage,
});

// ==========================================
// PUBLIC GET ROUTES (visible on the website, no login needed)
// ==========================================

// Get published posts
router.get("/public", postController.getPublishedPosts);

// Get top news
router.get("/topnews", postController.getTopNews);

// Get gallery
router.get("/gallery", postController.getGallery);

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