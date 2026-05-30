const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = path.join(__dirname, "../public/uploads/categories");

exports.uploadCategoryImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "fail",
        message: "No file uploaded",
      });
    }
    const url = `/uploads/categories/${req.file.filename}`;
    res.status(200).json({
      status: "success",
      data: { url },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};
