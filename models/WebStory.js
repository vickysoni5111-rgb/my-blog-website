const mongoose = require("mongoose");

const webStorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    coverImage: { type: String, required: true },
    images: [{ type: String }],
    author: { type: String },
    category: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WebStory", webStorySchema);