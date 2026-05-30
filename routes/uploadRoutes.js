const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const authController = require("../controllers/authController");
const uploadController = require("../controllers/uploadController");

const uploadDir = path.join(__dirname, "../public/uploads/categories");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = (path.extname(file.originalname) || "").toLowerCase() || ".jpg";
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|jpg|png|gif|webp)$/i;
    if (allowed.test(file.mimetype)) return cb(null, true);
    cb(new Error("Only image files (JPEG, PNG, GIF, WebP) are allowed"));
  },
});

const router = express.Router();

router.post(
  "/category-image",
  authController.protect,
  authController.restrictTo("admin", "owner"),
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ status: "fail", message: err.message || "Upload failed" });
      }
      next();
    });
  },
  uploadController.uploadCategoryImage
);

module.exports = router;
