const mongoose = require('mongoose');

const addonSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 120,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    imageUrl: {
      type: String,
    },
    sku: {
      type: String,
    },
    stockQuantity: {
      type: Number,
      min: 0,
    },
    displayOrder: {
      type: Number,
      required: true,
      default: 0,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

addonSchema.index({ product: 1 });
addonSchema.index({ product: 1, isActive: 1, displayOrder: 1 });

const Addon = mongoose.model('Addon', addonSchema);

module.exports = Addon;

