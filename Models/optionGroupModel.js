const mongoose = require('mongoose');

const optionGroupSchema = new mongoose.Schema(
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
    selectionType: {
      type: String,
      enum: ['single', 'multiple'],
      required: true,
    },
    isRequired: {
      type: Boolean,
      required: true,
      default: false,
    },
    minSelection: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    maxSelection: {
      type: Number,
      min: 1,
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

optionGroupSchema.index({ product: 1 });
optionGroupSchema.index({ product: 1, isActive: 1, displayOrder: 1 });

const OptionGroup = mongoose.model('OptionGroup', optionGroupSchema);

module.exports = OptionGroup;

