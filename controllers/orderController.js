const userModel = require("./../Models/userModel")
const orderModel = require("./../Models/orderModel");


exports.getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel.find().sort({ createdAt: -1,  _id: -1  });
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
    const order = await orderModel.create({...req.body, userID: req.user.id});
    const new_user = await userModel.findById(order.userID)
    new_user.order.push(order._id)
    new_user.save()

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
    const order = await orderModel.findById(req.params.order);
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
    const order = await orderModel.find({userID: req.user.id});
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
    await orderModel.findByIdAndDelete(req.params.order);

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
    const order = await orderModel.findByIdAndUpdate(
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
    const order = await orderModel.findByIdAndUpdate(
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
