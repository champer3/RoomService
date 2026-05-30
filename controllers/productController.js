const product = require("./../Models/productModel");
const { buildProductPayload, buildProductUpdatePatch } = require("../utils/productPayload");

const populateProduct = {
  path: "category",
  select: "name slug department",
  populate: { path: "department", select: "name slug _id" },
};

exports.getAllProducts = async (req, res) => {
  try {
    const products = await product
      .find()
      .populate(populateProduct)
      .populate({ path: "department", select: "name slug iconUrl" })
      .lean();
    res.status(200).json({
      status: "success",
      results: products.length,
      data: {
        products,
      },
    });
  } catch (err) {
    const isCategoryCast =
      err.name === "CastError" &&
      err.path === "_id" &&
      String(err.message || "").includes("Category");
    if (isCategoryCast) {
      return res.status(400).json({
        status: "fail",
        message:
          "Some products have category stored as a string instead of ObjectId. Run: node backend/scripts/migrateProductCategories.js",
      });
    }
    res.status(500).json({
      status: "fail",
      message: err.message || String(err),
    });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const payload = await buildProductPayload(req.body);
    const newProduct = await product.create(payload);
    const populated = await product
      .findById(newProduct._id)
      .populate(populateProduct)
      .populate({ path: "department", select: "name slug iconUrl" })
      .lean();
    res.status(201).json({
      status: "success",
      data: {
        product: populated || newProduct,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message || String(err),
    });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const singleProduct = await product
      .findById(req.params.product)
      .populate(populateProduct)
      .populate({ path: "department", select: "name slug iconUrl" });
    res.status(200).json({
      status: "success",
      data: {
        product: singleProduct,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await product.findByIdAndDelete(req.params.product);

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const payload = await buildProductUpdatePatch(req.body);
    const singleProduct = await product
      .findByIdAndUpdate(req.params.product, payload, { new: true, runValidators: true })
      .populate(populateProduct)
      .populate({ path: "department", select: "name slug iconUrl" });
    res.status(200).json({
      status: "success",
      product: singleProduct,
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};
