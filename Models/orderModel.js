const mongoose = require("mongoose");

const OrderDetailsSchema = new mongoose.Schema({
  productName: { type: String },
  component: String,
  flavor: { type: [String] },
  dressing: { type: [String]},
  sides: {type: [String]}
});

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
      enum: ['Ordered', 'Ready for Delivery', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: "Ordered",
    },
    paymentMethod: {
      type: String,
      required: [true, "An order must have a payment method"],
    },
    fulfillmentDate: Date,
    productID: [{
      type: mongoose.Schema.ObjectId,
      ref: "Product",
      required: [true, "An Order must have a product."],
    }],
    userID: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "An Order must belong to a user"],
    },
    driver: String,
    userName: String,
    proofOfDelivery: [String],
    proofOfAge: [String],
    dob: {
      type: Date
    },
    orderInstruction: String,
    orderDetails: [OrderDetailsSchema],
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
