const Post = require("../models/Post");
const Category = require("../models/Category");
const Comment = require("../models/Comment");
const User = require("../models/User");
const ViewLog = require("../models/ViewLog");

exports.getStats = async (req, res) => {
  try {
    const [
      totalPosts, publishedPosts, draftPosts,
      totalComments, totalUsers,
      viewsAgg, categories,
      recentPosts, recentComments, topPosts,
    ] = await Promise.all([
      Post.countDocuments(),
      Post.countDocuments({ status: "published" }),
      Post.countDocuments({ status: "draft" }),
      Comment.countDocuments(),
      User.countDocuments(),
      Post.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]),
      Category.find(),
      Post.find().sort({ createdAt: -1 }).limit(5).select("title status createdAt category"),
      Comment.find().populate("post", "title").sort({ createdAt: -1 }).limit(5),
      Post.find().sort({ views: -1 }).limit(5).select("title views featuredImage"),
    ]);

    // Category breakdown with %
    const categoryStats = await Promise.all(
      categories.map(async (cat) => {
        const count = await Post.countDocuments({ category: cat.id });
        return { id: cat.id, title: cat.title, count };
      })
    );
    const totalCategorized = categoryStats.reduce((s, c) => s + c.count, 0) || 1;
    const categoryBreakdown = categoryStats.map((c) => ({
      ...c,
      percent: Math.round((c.count / totalCategorized) * 100),
    }));

    // Page views trend - last 14 days
    const last14 = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last14.push(d.toISOString().split("T")[0]);
    }
    const trendAgg = await ViewLog.aggregate([
      { $match: { date: { $in: last14 } } },
      { $group: { _id: "$date", count: { $sum: 1 } } },
    ]);
    const trendMap = {};
    trendAgg.forEach((t) => (trendMap[t._id] = t.count));
    const pageViewsTrend = last14.map((d) => ({ date: d, views: trendMap[d] || 0 }));

    res.json({
      totalPosts,
      publishedPosts,
      draftPosts,
      totalComments,
      totalUsers,
      totalViews: viewsAgg[0]?.total || 0,
      categoryBreakdown,
      recentActivity: recentPosts,
      recentComments,
      topPosts,
      pageViewsTrend,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};