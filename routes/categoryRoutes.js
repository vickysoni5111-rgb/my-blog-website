const express = require("express");
const multer = require("multer");
const path = require("path");
const Category = require("../models/Category");

const router = express.Router();

// ---- Image Upload Setup (multer) ----
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // backend/uploads folder me image save hogi
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// ---- GET all categories ----
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---- GET single category by id (slug) ----
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findOne({ id: req.params.id });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---- POST create new category (image ke sath) ----
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { id, title, description, fullContent } = req.body;

    const imagePath = req.file ? `/uploads/${req.file.filename}` : "";

    const newCategory = new Category({
      id,
      title,
      description,
      image: imagePath,
      // fullContent frontend se JSON string me aayega, isliye parse karo
      fullContent: fullContent ? JSON.parse(fullContent) : [],
    });

    const saved = await newCategory.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---- PUT update category ----
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { title, description, fullContent } = req.body;
    const updateData = {
      title,
      description,
      fullContent: fullContent ? JSON.parse(fullContent) : undefined,
    };

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const updated = await Category.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---- DELETE category ----
router.delete("/:id", async (req, res) => {
  try {
    await Category.findOneAndDelete({ id: req.params.id });
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;