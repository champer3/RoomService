const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
    },
    iconUrl: {
      type: String,
    },
    imageUrl: {
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
    isFeatured: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.index(
  { department: 1, name: 1 },
  { unique: true, name: 'unique_category_name_per_department' }
);

categorySchema.index(
  { department: 1, slug: 1 },
  { unique: true, name: 'unique_category_slug_per_department' }
);

categorySchema.index({ department: 1 });
categorySchema.index({ isActive: 1, displayOrder: 1 });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;

