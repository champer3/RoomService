const userModel = require("./../Models/userModel")
const orderModel = require("./../Models/orderModel");


exports.getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel.find().sort({ createdAt: -1, _id: -1 });
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

const crypto = require("crypto");

exports.createGuestOrder = async (req, res) => {
  try {
    const { guestName, guestPhone } = req.body;
    if (!guestName || !guestPhone) {
      return res.status(400).json({
        status: "fail",
        message: "Guest orders require guestName and guestPhone",
      });
    }
    const trackingToken = crypto.randomBytes(4).toString("hex");
    const order = await orderModel.create({
      ...req.body,
      userID: undefined,
      userName: req.body.guestName,
      trackingToken,
    });
    res.status(201).json({
      status: "success",
      data: {
        order: {
          _id: order._id,
          orderStatus: order.orderStatus,
          totalPrice: order.totalPrice,
          trackingToken: order.trackingToken,
          createdAt: order.date,
        },
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.getOrderTrack = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.order);
    if (!order) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found",
      });
    }
    const token = req.query.trackingToken;
    const phone = req.query.phone;
    const tokenMatch = token && order.trackingToken && order.trackingToken === token;
    const phoneMatch = phone && order.guestPhone && order.guestPhone === phone;
    if (!tokenMatch && !phoneMatch) {
      return res.status(403).json({
        status: "fail",
        message: "Invalid tracking token or phone",
      });
    }
    res.status(200).json({
      status: "success",
      data: {
        order: {
          _id: order._id,
          orderStatus: order.orderStatus,
          totalPrice: order.totalPrice,
          fulfillmentDate: order.fulfillmentDate,
          date: order.date,
          orderDetailsCount: order.orderDetails ? order.orderDetails.length : 0,
        },
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
    const order = await orderModel.create({ ...req.body, userID: req.user.id, userName: req.user.firstName });
    const user = await userModel.findByIdAndUpdate(req.user.id, { $push: { order: order._id } }, { new: true, runValidators: false })
    // user.order.push(order._id)
    // user.passwordConfirm = undefined;
    // user.save()

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
    // To be fixed later
    // if (!req.user.order.includes(orderID)) {
    //   return res.status(400).json({
    //     status: "fail",
    //     message:
    //       "You are trying to access the orders of another user, that's fucked up bruh",
    //   });
    // }
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
    const order = await orderModel.find({ userID: req.user.id });
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
