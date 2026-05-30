const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
    },
    iconUrl: {
      type: String,
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
    // behavior flags
    supportsVariants: {
      type: Boolean,
      required: true,
      default: false,
    },
    tracksInventory: {
      type: Boolean,
      required: true,
      default: true,
    },
    requiresAgeVerification: {
      type: Boolean,
      required: true,
      default: false,
    },
    requiresIdOnDelivery: {
      type: Boolean,
      required: true,
      default: false,
    },
    /** Drives mobile department screen layout (extensible enum). */
    layoutPreset: {
      type: String,
      enum: ['food', 'grocery'],
      default: 'food',
    },
    /** Grocery-style category chrome: horizontal chips, sticky tabs, or mini grid. */
    categoryNavStyle: {
      type: String,
      enum: ['tabs', 'chips', 'grid'],
      default: 'tabs',
    },
  },
  {
    timestamps: true,
  }
);

departmentSchema.index({ isActive: 1, displayOrder: 1 });

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;

