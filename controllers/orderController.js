const Order = require("./../Models/orderModel");
const User = require("./../Models/userModel")


exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json({
      status: "success",
      results: orders.length,
      data: {
        orders,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const order = await Order.create({...req.body, userID: req.user.id});
    const user = await User.findById(order.userID)
    user.order.push(order._id)
    user.save()

    res.status(201).json({
      status: "success",
      data: {
        order,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const orderID = req.params.order;
    if (!req.user.order.includes(orderID)) {
      return res.status(400).json({
        status: "fail",
        message:
          "You are trying to access the orders of another user, that's fucked up bruh",
      });
    }
    const order = await Order.findById(req.params.order);
    res.status(200).json({
      status: "success",
      data: {
        order,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const order = await Order.find({userID: req.user.id});
    res.status(200).json({
      status: "success",
      data: {
        order,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.order);

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

exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.order,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: "success",
      order,
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.deliverOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.order,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    req.order = order
    next()

    // res.status(200).json({
    //   status: "success",
    //   order,
    // });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};
