const Comment = require("../models/Comment");

// GET /api/comments -> sab comments, latest first, post title ke sath
exports.getAllComments = async (req, res) => {
  try {
    const comments = await Comment.find()
      .populate("post", "title slug")
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/comments  (public blog se aayega, but ready rakho)
exports.createComment = async (req, res) => {
  try {
    const { post, name, email, message } = req.body;
    const comment = await Comment.create({ post, name, email, message });
    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/comments/:id
exports.deleteComment = async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/comments/post/:postId -> sirf ek post ke comments
exports.getCommentsByPost = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId, approved: true })
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// GET /api/comments  (optionally filtered by ?post=postId)
exports.getAllComments = async (req, res) => {
  try {
    const filter = { approved: true };
    if (req.query.post) {
      filter.post = req.query.post;
    }
    const comments = await Comment.find(filter)
      .populate("post", "title slug")
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};