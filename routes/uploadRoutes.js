const express = require("express");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");

const router = express.Router();

cloudinary.config({
  cloud_name: "wqsxsuzd",
  api_key: "653714997574679",
  api_secret: "t3rCKsGukDMypeY_MWUZX0EhI9g",
});

// File ko disk par save karne ki jagah memory (RAM) me rakhte hain,
// fir seedha Cloudinary ko stream kar dete hain.
const storage = multer.memoryStorage();
const upload = multer({ storage });

function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "filmycharcha-uploads" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

router.post("/", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const result = await uploadBufferToCloudinary(req.file.buffer);
    res.json({ url: result.secure_url });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    res.status(500).json({ message: "Image upload failed" });
  }
});

module.exports = router;