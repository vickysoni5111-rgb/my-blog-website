const mongoose = require("mongoose");

// ==========================================
// FAQ SCHEMA
// ==========================================

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      default: "",
    },

    answer: {
      type: String,
      default: "",
    },
  },
  {
    _id: false,
  }
);

// ==========================================
// TABLE OF CONTENTS SCHEMA
// ==========================================

const tocItemSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      default: "",
    },

    id: {
      type: String,
      default: "",
    },

    level: {
      type: Number,
      default: 2,
    },
  },
  {
    _id: false,
  }
);

// ==========================================
// POST SCHEMA
// ==========================================

const postSchema = new mongoose.Schema(
  {
    // --------------------------------------
    // BASIC POST INFORMATION
    // --------------------------------------

    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    excerpt: {
      type: String,
      default: "",
    },

    content: {
      type: String,
      default: "",
    },

    // --------------------------------------
    // SEO KEYWORDS
    // --------------------------------------

    focusKeyword: {
      type: String,
      default: "",
    },

    secondaryKeywords: {
      type: [String],
      default: [],
    },

    // --------------------------------------
    // CATEGORY & TAGS
    // --------------------------------------

    category: {
      type: String,
      default: "",
    },

    tags: {
      type: [String],
      default: [],
    },

    // --------------------------------------
    // FEATURED IMAGE
    // --------------------------------------

    featuredImage: {
      type: String,
      default: "",
    },

    featuredImageAlt: {
      type: String,
      default: "",
    },

    // --------------------------------------
    // FAQ & TABLE OF CONTENTS
    // --------------------------------------

    faq: {
      type: [faqSchema],
      default: [],
    },

    toc: {
      type: [tocItemSchema],
      default: [],
    },

    // --------------------------------------
    // SEO
    // --------------------------------------

    seo: {
      metaTitle: {
        type: String,
        default: "",
      },

      metaDescription: {
        type: String,
        default: "",
      },

      canonicalUrl: {
        type: String,
        default: "",
      },

      robotsMeta: {
        type: String,
        default: "index, follow",
      },

      schemaType: {
        type: String,
        default: "BlogPosting",
      },

      language: {
        type: String,
        default: "English",
      },

      // ------------------------------------
      // OPEN GRAPH
      // ------------------------------------

      og: {
        title: {
          type: String,
          default: "",
        },

        description: {
          type: String,
          default: "",
        },

        image: {
          type: String,
          default: "",
        },
      },

      // ------------------------------------
      // TWITTER
      // ------------------------------------

      twitter: {
        card: {
          type: String,
          default: "summary_large_image",
        },

        title: {
          type: String,
          default: "",
        },

        description: {
          type: String,
          default: "",
        },

        image: {
          type: String,
          default: "",
        },
      },
    },

    // --------------------------------------
    // STATUS
    // --------------------------------------

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    publishDate: {
      type: Date,
      default: Date.now,
    },

    // --------------------------------------
    // READING TIME
    // --------------------------------------

    readingTime: {
      type: Number,
      default: 1,
    },

    // --------------------------------------
    // COMMENTS
    // --------------------------------------

    allowComments: {
      type: Boolean,
      default: true,
    },

    // --------------------------------------
    // TOP NEWS
    // --------------------------------------

    featuredPost: {
      type: Boolean,
      default: false,
    },

    // --------------------------------------
    // ANALYTICS
    // --------------------------------------

    views: {
      type: Number,
      default: 0,
    },

    likes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// PRE VALIDATE MIDDLEWARE
// ==========================================
//
// IMPORTANT:
// Mongoose 9 me yahan `next` callback use nahi
// karna hai.
//
// Isliye:
// postSchema.pre("validate", function () {
//
// aur end me:
// });
//
// `next()` nahi lagana hai.
// ==========================================

postSchema.pre("validate", function () {
  // ========================================
  // AUTO FORMAT / GENERATE SLUG
  // ========================================

  // Agar user ne manually slug diya hai
  // to usko automatically clean karo.

  if (this.slug) {
    this.slug = this.slug
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  // Agar slug nahi diya hai
  // to title se slug generate karo.

  else if (this.title) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  // ========================================
  // READING TIME + TABLE OF CONTENTS
  // ========================================

  if (this.content) {
    // HTML tags remove karo
    const cleanContent = this.content
      .replace(/<[^>]+>/g, " ")
      .trim();

    // Words count
    const words = cleanContent
      .split(/\s+/)
      .filter(Boolean).length;

    // Approx 200 words per minute
    this.readingTime = Math.max(
      1,
      Math.ceil(words / 200)
    );

    // ======================================
    // GENERATE TOC FROM H2 / H3
    // ======================================

    const headingRegex =
      /<h([23])[^>]*>(.*?)<\/h\1>/gi;

    const toc = [];

    let match;

    while (
      (match = headingRegex.exec(this.content)) !== null
    ) {
      // Heading ke andar se HTML tags remove
      const text = match[2]
        .replace(/<[^>]+>/g, "")
        .trim();

      // Heading text se ID generate
      const id = text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

      toc.push({
        text: text,
        id: id,
        level: parseInt(match[1], 10),
      });
    }

    this.toc = toc;
  }

  // ========================================
  // SEO DEFAULTS
  // ========================================

  if (!this.seo) {
    this.seo = {};
  }

  if (!this.seo.og) {
    this.seo.og = {};
  }

  if (!this.seo.twitter) {
    this.seo.twitter = {};
  }

  // ========================================
  // META TITLE
  // ========================================

  if (!this.seo.metaTitle) {
    this.seo.metaTitle = this.title || "";
  }

  // ========================================
  // META DESCRIPTION
  // ========================================

  if (!this.seo.metaDescription) {
    this.seo.metaDescription =
      this.excerpt || "";
  }

  // ========================================
  // OPEN GRAPH DEFAULTS
  // ========================================

  if (!this.seo.og.title) {
    this.seo.og.title =
      this.seo.metaTitle;
  }

  if (!this.seo.og.description) {
    this.seo.og.description =
      this.seo.metaDescription;
  }

  if (!this.seo.og.image) {
    this.seo.og.image =
      this.featuredImage || "";
  }

  // ========================================
  // TWITTER DEFAULTS
  // ========================================

  if (!this.seo.twitter.title) {
    this.seo.twitter.title =
      this.seo.metaTitle;
  }

  if (!this.seo.twitter.description) {
    this.seo.twitter.description =
      this.seo.metaDescription;
  }

  if (!this.seo.twitter.image) {
    this.seo.twitter.image =
      this.featuredImage || "";
  }
});

// ==========================================
// EXPORT MODEL
// ==========================================

module.exports = mongoose.model(
  "Post",
  postSchema
);