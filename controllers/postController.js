const Post = require("../models/Post");

// ==========================================
// HELPER: get logged-in user's id from req.user
// Works regardless of whether your JWT payload
// uses id / _id / userId as the key.
// ==========================================
const getUserId = (req) => {
  return (
    req.user?.id ||
    req.user?._id ||
    req.user?.userId ||
    null
  );
};

// ==========================================
// GET ALL POSTS (ADMIN — only logged-in user's own posts)
// GET /api/posts
// ==========================================
const getAllPosts = async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login again.",
      });
    }

    const filter = { author: userId };

    if (status) {
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.title = {
        $regex: search,
        $options: "i",
      };
    }

    const posts = await Post.find(filter).sort({
      createdAt: -1,
    });

    res.status(200).json(posts);
  } catch (error) {
    console.error("GET ALL POSTS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET PUBLISHED POSTS (PUBLIC — all authors)
// GET /api/posts/public
// ==========================================
const getPublishedPosts = async (req, res) => {
  try {
    const posts = await Post.find({
      status: "published",
    }).sort({
      publishDate: -1,
    });

    res.status(200).json(posts);
  } catch (error) {
    console.error("GET PUBLISHED POSTS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET TOP NEWS (PUBLIC — all authors)
// GET /api/posts/topnews
// ==========================================
const getTopNews = async (req, res) => {
  try {
    const posts = await Post.find({
      featuredPost: true,
      status: "published",
    }).sort({
      publishDate: -1,
    });

    res.status(200).json(posts);
  } catch (error) {
    console.error("GET TOP NEWS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET GALLERY (PUBLIC — all authors)
// GET /api/posts/gallery
// ==========================================
const getGallery = async (req, res) => {
  try {
    const posts = await Post.find({
      featuredImage: {
        $ne: "",
      },
    })
      .select(
        "title featuredImage featuredImageAlt category createdAt"
      )
      .sort({
        createdAt: -1,
      });

    res.status(200).json(posts);
  } catch (error) {
    console.error("GET GALLERY ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET POSTS BY CATEGORY (PUBLIC — all authors)
// GET /api/posts/category/:category
// ==========================================
const getPostsByCategory = async (req, res) => {
  try {
    const posts = await Post.find({
      category: req.params.category,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json(posts);
  } catch (error) {
    console.error("GET CATEGORY POSTS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// SEARCH POSTS (PUBLIC)
// GET /api/posts/search?q=keyword
// ==========================================
const searchPosts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(200).json([]);
    }

    const regex = new RegExp(q.trim(), "i");

    const posts = await Post.find({
      status: "published",
      $or: [
        { title: regex },
        { category: regex },
        { tags: regex },
        { secondaryKeywords: regex },
      ],
    })
      .select("title slug featuredImage featuredImageAlt category publishDate")
      .sort({ publishDate: -1 })
      .limit(10);

    res.status(200).json(posts);
  } catch (error) {
    console.error("SEARCH POSTS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET POST BY SLUG (PUBLIC)
// GET /api/posts/slug/:slug
// ==========================================
const getPostBySlug = async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate(
      {
        slug: req.params.slug,
      },
      {
        $inc: {
          views: 1,
        },
      },
      {
        new: true,
      }
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("GET POST BY SLUG ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET POST BY ID (ADMIN — must be owner)
// GET /api/posts/:id
// ==========================================
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const userId = getUserId(req);
    if (post.author && String(post.author) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this post",
      });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("GET POST BY ID ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// CREATE POST
// POST /api/posts
// ==========================================
const createPost = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login again.",
      });
    }

    const body = {
      ...req.body,
      author: userId,
    };

    // Normalize status
    if (body.status) {
      body.status = body.status.toLowerCase();
    }

    // Convert tags string to array
    if (typeof body.tags === "string") {
      body.tags = body.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }

    // Convert secondary keywords string to array
    if (typeof body.secondaryKeywords === "string") {
      body.secondaryKeywords = body.secondaryKeywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean);
    }

    // Parse FAQ JSON
    if (typeof body.faq === "string") {
      try {
        body.faq = JSON.parse(body.faq);
      } catch (error) {
        body.faq = [];
      }
    }

    // Parse SEO JSON
    if (typeof body.seo === "string") {
      try {
        body.seo = JSON.parse(body.seo);
      } catch (error) {
        body.seo = {};
      }
    }

    // Featured post checkbox
    if (body.featuredPost !== undefined) {
      body.featuredPost =
        body.featuredPost === true ||
        body.featuredPost === "true" ||
        body.featuredPost === "on";
    }

    // Allow comments checkbox
    if (body.allowComments !== undefined) {
      body.allowComments =
        body.allowComments === true ||
        body.allowComments === "true" ||
        body.allowComments === "on";
    }

    // Uploaded image — ab Cloudinary se aayi hui secure_url use hogi
    // (pehle: `/uploads/${req.file.filename}` — local disk path tha
    // jo Render restart hone par delete ho jata tha)
    if (req.cloudinaryUrl) {
      body.featuredImage = req.cloudinaryUrl;
    }

    // Create post
    const post = new Post(body);

    const savedPost = await post.save();

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: savedPost,
    });
  } catch (error) {
    console.error("CREATE POST ERROR:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// UPDATE POST (must be owner)
// PUT /api/posts/:id
// ==========================================
const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const userId = getUserId(req);
    if (post.author && String(post.author) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to edit this post",
      });
    }

    const body = {
      ...req.body,
    };

    // author cannot be changed via update
    delete body.author;

    // Normalize status
    if (body.status) {
      body.status = body.status.toLowerCase();
    }

    // Convert tags
    if (typeof body.tags === "string") {
      body.tags = body.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }

    // Convert secondary keywords
    if (typeof body.secondaryKeywords === "string") {
      body.secondaryKeywords = body.secondaryKeywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean);
    }

    // Parse FAQ
    if (typeof body.faq === "string") {
      try {
        body.faq = JSON.parse(body.faq);
      } catch (error) {
        body.faq = [];
      }
    }

    // Parse SEO
    if (typeof body.seo === "string") {
      try {
        body.seo = JSON.parse(body.seo);
      } catch (error) {
        body.seo = {};
      }
    }

    // Uploaded image — ab Cloudinary se aayi hui secure_url use hogi
    // (pehle: `/uploads/${req.file.filename}` — local disk path tha
    // jo Render restart hone par delete ho jata tha)
    if (req.cloudinaryUrl) {
      body.featuredImage = req.cloudinaryUrl;
    }

    Object.assign(post, body);

    const updatedPost = await post.save();

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: updatedPost,
    });
  } catch (error) {
    console.error("UPDATE POST ERROR:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// UPDATE STATUS (must be owner)
// PATCH /api/posts/:id/status
// ==========================================
const updateStatus = async (req, res) => {
  try {
    let { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    status = status.toLowerCase();

    if (!["draft", "published"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const userId = getUserId(req);
    if (post.author && String(post.author) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to change this post's status",
      });
    }

    post.status = status;
    if (status === "published") {
      post.publishDate = new Date();
    }

    const updatedPost = await post.save();

    res.status(200).json({
      success: true,
      message: "Post status updated",
      data: updatedPost,
    });
  } catch (error) {
    console.error("UPDATE STATUS ERROR:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// TOGGLE TOP NEWS (must be owner)
// PATCH /api/posts/:id/toggle-topnews
// ==========================================
const toggleTopNews = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const userId = getUserId(req);
    if (post.author && String(post.author) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to change this post",
      });
    }

    post.featuredPost = !post.featuredPost;

    await post.save();

    res.status(200).json({
      success: true,
      message: "Top news status updated",
      data: post,
    });
  } catch (error) {
    console.error("TOGGLE TOP NEWS ERROR:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// DELETE POST (must be owner)
// DELETE /api/posts/:id
// ==========================================
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const userId = getUserId(req);
    if (post.author && String(post.author) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this post",
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("DELETE POST ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================
module.exports = {
  getAllPosts,
  getPublishedPosts,
  getTopNews,
  getGallery,
  getPostsByCategory,
  searchPosts,
  getPostBySlug,
  getPostById,
  createPost,
  updatePost,
  updateStatus,
  toggleTopNews,
  deletePost,
};