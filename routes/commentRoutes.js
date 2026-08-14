const express = require("express");
const router = express.Router();
const c = require("../controllers/commentController");

router.get("/post/:postId", c.getCommentsByPost);
router.get("/", c.getAllComments);
router.post("/", c.createComment);
router.delete("/:id", c.deleteComment);

module.exports = router;