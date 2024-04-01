const cart = require("./../Models/cartModel");
const userModel = require("./../Models/userModel")

exports.getAllCarts = async (req, res) => {
  try {
    const carts = await cart.find();
    res.status(200).json({
      status: "success",
      results: carts.length,
      data: {
        carts,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.createCart = async (req, res) => {
  try {
    const cart = await cart.create(req.body);
    const user = await userModel.findById(cart.userID)
    user.cart.push(cart._id)
    user.save()

    res.status(201).json({
      status: "success",
      data: {
        cart,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.getCart = async (req, res) => {
  try {
    const cart = await cart.findById(req.params.cart);
    res.status(200).json({
      status: "success",
      data: {
        cart,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.deleteCart = async (req, res) => {
  try {
    await cart.findByIdAndDelete(req.params.cart);

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

exports.updateCart = async (req, res) => {
  try {
    const cart = await cart.findByIdAndUpdate(
      req.params.cart,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: "success",
      cart,
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};
