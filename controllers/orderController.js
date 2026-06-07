const userModel = require("./../Models/userModel");
const orderModel = require("./../Models/orderModel");
const crypto = require("crypto");
const {
  buildCreatePayload,
  applyOrderPatch,
} = require("../utils/orderNormalize");
const { getIO, getSocketID } = require("../socketManager");
const { sendPushToUser } = require("../pushService");

const populateOrder = [
  {
    path: "assignedDriverId",
    select: "email firstName lastName photo",
  },
  { path: "customerId", select: "firstName lastName email" },
];

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find()
      .sort({ placedAt: -1, createdAt: -1, _id: -1 })
      .populate(populateOrder);
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
    let payload;
    try {
      payload = buildCreatePayload(req.body, {
        customerId: null,
        guestName,
      });
    } catch (e) {
      return res.status(400).json({
        status: "fail",
        message: e.message || String(e),
      });
    }
    payload.trackingToken = trackingToken;
    payload.guestPhone = guestPhone;
    const order = await orderModel.create(payload);
    await order.populate(populateOrder);
    res.status(201).json({
      status: "success",
      data: {
        order: {
          _id: order._id,
          id: order._id,
          status: order.status,
          orderStatus: order.status,
          totalAmount: order.totalAmount,
          totalPrice: order.totalAmount,
          trackingToken: order.trackingToken,
          placedAt: order.placedAt,
          date: order.placedAt,
          orderNumber: order.orderNumber,
        },
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message || err,
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
    const tokenMatch =
      token && order.trackingToken && order.trackingToken === token;
    const phoneMatch =
      phone && order.guestPhone && order.guestPhone === phone;
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
          status: order.status,
          orderStatus: order.status,
          totalAmount: order.totalAmount,
          totalPrice: order.totalAmount,
          placedAt: order.placedAt,
          date: order.placedAt,
          itemsCount: Array.isArray(order.items) ? order.items.length : 0,
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
    let payload;
    try {
      payload = buildCreatePayload(req.body, {
        customerId: req.user.id,
        guestName:
          [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") ||
          req.user.email ||
          "",
      });
    } catch (e) {
      return res.status(400).json({
        status: "fail",
        message: e.message || String(e),
      });
    }
    payload.userID = req.user.id;
    const order = await orderModel.create(payload);
    await userModel.findByIdAndUpdate(
      req.user.id,
      { $push: { order: order._id } },
      { new: true, runValidators: false }
    );
    await order.populate(populateOrder);

    res.status(201).json({
      status: "success",
      data: {
        order,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message || err,
    });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await orderModel
      .findById(req.params.order)
      .populate(populateOrder);
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
    const order = await orderModel
      .find({
        $or: [{ customerId: req.user.id }, { userID: req.user.id }],
      })
      .sort({ placedAt: -1, _id: -1 })
      .populate(populateOrder);
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
    const order = await orderModel.findById(req.params.order);
    if (!order) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found",
      });
    }
    const previousStatus = order.status;
    await applyOrderPatch(order, req.body, req.user);
    await order.save();
    await order.populate(populateOrder);

    const io = getIO();
    const socketID = getSocketID();

    if (order.status !== previousStatus) {
      const customerIdRaw = order.customerId;
      const userID = (customerIdRaw?._id || customerIdRaw || order.userID || "").toString();
      const userSocketID = socketID[userID];

      console.log('[OrderController] Status changed:', previousStatus, '->', order.status, '| userID:', userID, '| userSocketID:', userSocketID);

      if (io && userSocketID) {
        let message = `Your order status has been updated to: ${order.status}`;
        if (order.status === 'delivered') message = "Your order has been delivered!";
        else if (order.status === 'out_for_delivery' || order.status === 'assigned') message = "Your order is out for delivery";
        else if (order.status === 'ready') message = "Your order is ready";
        else if (order.status === 'confirmed') message = "Your order has been confirmed";
        else if (order.status === 'preparing') message = "Your order is being prepared";

        io.to(userSocketID).emit('orderUpdate', {
          message,
          orderId: order._id.toString(),
          status: order.status,
        });
      }

      // Send push notification to user regardless of socket connection
      let pushMsg = `Your order status has been updated to: ${order.status}`;
      if (order.status === 'delivered') pushMsg = "Your order has been delivered!";
      else if (order.status === 'out_for_delivery' || order.status === 'assigned') pushMsg = "Your order is out for delivery";
      else if (order.status === 'ready') pushMsg = "Your order is ready for pickup";
      else if (order.status === 'confirmed') pushMsg = "Your order has been confirmed";
      else if (order.status === 'preparing') pushMsg = "Your order is being prepared";

      sendPushToUser(userID, "Order Update", pushMsg, { orderId: order._id.toString(), status: order.status });
    }

    if (io) {
      const adminRoom = io.sockets.adapter.rooms.get('admin');
      console.log('[OrderController] Emitting orderStatusUpdate to admin room. Room exists:', !!adminRoom, '| size:', adminRoom?.size || 0, '| status:', order.status);
      io.to('admin').emit('orderStatusUpdate', {
        orderId: order._id.toString(),
        status: order.status,
        previousStatus,
      });
    } else {
      console.log('[OrderController] WARNING: io is null, cannot emit');
    }

    res.status(200).json({
      status: "success",
      order,
    });
  } catch (err) {
    const payload = {
      status: "fail",
      message: err.message || String(err),
    };
    if (err.name === "ValidationError" && err.errors) {
      payload.errors = Object.fromEntries(
        Object.entries(err.errors).map(([k, v]) => [k, v.message])
      );
    }
    res.status(400).json(payload);
  }
};

exports.deliverOrder = async (req, res, next) => {
  try {
    const order = await orderModel.findById(req.params.order);
    if (!order) {
      return res.status(400).json({ status: "fail", message: "Not found" });
    }
    await applyOrderPatch(order, req.body, req.user);
    await order.save();
    await order.populate(populateOrder);

    req.order = order;
    next();
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message || err,
    });
  }
};
