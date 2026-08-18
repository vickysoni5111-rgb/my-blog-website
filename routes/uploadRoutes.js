const express = require("express");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const router = express.Router();

cloudinary.config({
  cloud_name: "wqsxsuzd",
  api_key:"653714997574679",
  api_secret:"t3rCKsGukDMypeY_MWUZX0EhI9g",
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "filmycharcha-uploads",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
  },
});

const upload = multer({ storage });

router.post("/", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  res.json({ url: req.file.path });
});

module.exports = router;