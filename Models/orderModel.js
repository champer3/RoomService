const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now(),
    },
    totalPrice: {
      type: Number,
      required: [true, "An order must always have a price"],
    },
    paymentStatus: {
      type: Boolean,
      default: false,
    },
    shippingAddress: {
      type: String,
      required: [true, "Provide location for the order"],
    },
    orderStatus: {
      type: String,
      enum: ["Ready", "Processing", "Shipped", "Delivered", "Canceled"],
      default: "Ready",
    },
    paymentMothod: {
      type: String,
      required: [true, "An order must have a payment method"],
    },
    fulfillmentDate: Date,
    productID: {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
      required: [true, "An Order must have a product."],
    },
    userID: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "An Order must belong to a user"],
    },
    userName: String,
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
