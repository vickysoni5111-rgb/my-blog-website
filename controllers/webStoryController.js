const WebStory = require("../models/WebStory"); // ⚠️ apna sahi model path check kar lena

// GET all stories
exports.getAllStories = async (req, res) => {
  try {
    const stories = await WebStory.find().sort({ createdAt: -1 });
    res.json(stories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET single story by slug
exports.getStoryBySlug = async (req, res) => {
  try {
    const story = await WebStory.findOne({ slug: req.params.slug });
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    res.json(story);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE new story
exports.createStory = async (req, res) => {
  try {
    const { title, author, category } = req.body;

    // Ab image paths Cloudinary se aayenge (route middleware ne
    // req.cloudinaryUrls me daal diye hain) — pehle yaha
    // `/uploads/${f.filename}` local disk path banta tha jo
    // Render restart hone par delete ho jata tha.
    const imagePaths = req.cloudinaryUrls;
    if (!imagePaths || imagePaths.length === 0) {
      return res.status(400).json({ message: "At least one image required" });
    }

    let slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existing = await WebStory.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const story = new WebStory({
      title,
      slug,
      author,
      category,
      coverImage: imagePaths[0],
      images: imagePaths,
    });

    await story.save();
    res.status(201).json(story);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE story by id
exports.deleteStory = async (req, res) => {
  try {
    const story = await WebStory.findByIdAndDelete(req.params.id);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    res.json({ message: "Story deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};