const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    dateUpdate: {
      type: Date,
      default: Date.now(),
    },
    totalPrice: {
      type: Number,
      required: [true, "An order must always have a price"],
    },
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
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Order = mongoose.model("Order", productSchema);

module.exports = Order;
