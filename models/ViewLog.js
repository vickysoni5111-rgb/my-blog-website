const mongoose = require("mongoose");

const viewLogSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  date: { type: String, required: true }, // "YYYY-MM-DD" format, easy grouping ke liye
});

module.exports = mongoose.model("ViewLog", viewLogSchema);