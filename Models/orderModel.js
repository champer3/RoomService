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
    shippingMethod: {
      type: String,
      default: [true, "An order must have a shipping method"],
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
    productID: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
        required: [true, "Review must belong to a Product."],
      },
    ],
    userID: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Order = mongoose.model("Order", productSchema);

module.exports = Order;
