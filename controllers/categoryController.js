const Category = require("../Models/categoryModel");
const Department = require("../Models/departmentModel");

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

exports.getAllCategories = async (req, res) => {
  try {
    const query = {};
    if (req.query.department) {
      query.department = req.query.department;
    }
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === "true";
    }
    const categories = await Category.find(query)
      .populate("department", "name slug")
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    res.status(200).json({
      status: "success",
      results: categories.length,
      data: { categories },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate(
      "department",
      "name slug"
    );
    if (!category) {
      return res.status(404).json({
        status: "fail",
        message: "Category not found",
      });
    }
    res.status(200).json({
      status: "success",
      data: { category },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, department, displayOrder, isActive, isFeatured, iconUrl, imageUrl } = req.body;
    if (!name || !department) {
      return res.status(400).json({
        status: "fail",
        message: "Category name and department are required",
      });
    }
    const slug = slugify(name);
    const category = await Category.create({
      name,
      slug,
      description: description || "",
      department,
      displayOrder: displayOrder != null ? Number(displayOrder) : 0,
      isActive: isActive !== false,
      isFeatured: isFeatured === true,
      iconUrl: iconUrl || "",
      imageUrl: imageUrl || "",
    });
    const populated = await Category.findById(category._id).populate(
      "department",
      "name slug"
    );
    res.status(201).json({
      status: "success",
      data: { category: populated },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const allowed = [
      "name",
      "slug",
      "description",
      "department",
      "iconUrl",
      "imageUrl",
      "displayOrder",
      "isActive",
      "isFeatured",
    ];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });
    if (updates.name) updates.slug = slugify(updates.name);

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate("department", "name slug");

    if (!category) {
      return res.status(404).json({
        status: "fail",
        message: "Category not found",
      });
    }
    res.status(200).json({
      status: "success",
      data: { category },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({
        status: "fail",
        message: "Category not found",
      });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};
