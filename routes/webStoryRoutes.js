const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const authMiddleware = require("../authMiddleware");
const {
  getAllStories,
  getStoryBySlug,
  createStory,
  deleteStory,
} = require("../controllers/webStoryController");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

router.get("/", getAllStories);
router.get("/:slug", getStoryBySlug);
router.post("/", authMiddleware, upload.array("images", 10), createStory);
router.delete("/:id", authMiddleware, deleteStory);

module.exports = router;