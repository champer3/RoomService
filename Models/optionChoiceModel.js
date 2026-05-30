const mongoose = require('mongoose');

const optionChoiceSchema = new mongoose.Schema(
  {
    optionGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OptionGroup',
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
    priceAdjustment: {
      type: Number,
      required: true,
      default: 0,
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
    isDefault: {
      type: Boolean,
      required: true,
      default: false,
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

optionChoiceSchema.index({ optionGroup: 1 });
optionChoiceSchema.index({ optionGroup: 1, isActive: 1, displayOrder: 1 });

const OptionChoice = mongoose.model('OptionChoice', optionChoiceSchema);

module.exports = OptionChoice;

