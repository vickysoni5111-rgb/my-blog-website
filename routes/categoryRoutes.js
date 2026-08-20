const express = require("express");
const multer = require("multer");
const cloudinary = require("../lib/cloudinary");
const Category = require("../models/Category");

const router = express.Router();

// ---- Cloudinary Upload Setup (memory storage, phir stream Cloudinary ko) ----
// File ko disk par save karne ki jagah memory (RAM) me rakhte hain,
// fir seedha Cloudinary ko stream kar dete hain. Isse Render restart
// hone par bhi images gayab nahi hoti (pehle "uploads/" local disk
// folder use ho raha tha jo ephemeral hai).
const storage = multer.memoryStorage();
const upload = multer({ storage });

function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "filmycharcha-categories" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

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

    let imagePath = "";
    if (req.file) {
      const result = await uploadBufferToCloudinary(req.file.buffer);
      imagePath = result.secure_url;
    }

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
      const result = await uploadBufferToCloudinary(req.file.buffer);
      updateData.image = result.secure_url;
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