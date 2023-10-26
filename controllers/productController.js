const Product = require("./../Models/productModel");

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({
      status: "success",
      results: products.length,
      data: {
        products,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.createProduct = async (req, res) => {
    try {
      const product = await Product.create(req.body);

      res.status(201).json({
        status: "success",
        data: {
            product,
        },
      });
    } catch (err) {
      res.status(400).json({
        status: "fail",
        message: err,
      });
    }
  };

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.find({email: req.params.product});
    res.status(200).json({
      status: "success",
      data: {
        product,
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
    const product = await Product.find({email: req.params.product});
    await Product.findByIdAndDelete(product[0].id)

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
    const product = await Product.find({email: req.params.product});
    const updatedProduct = await Product.findByIdAndUpdate(product[0].id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: "success",
      product: updatedProduct,
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};
