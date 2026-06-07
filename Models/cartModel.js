const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    dateUpdate: {
      type: Date,
      default: Date.now(),
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
    items: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    userID: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Cart must belong to a user"],
      unique: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
