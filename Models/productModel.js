const mongoose = require('mongoose');

const variantChoiceSchema = new mongoose.Schema(
  {
    id: { type: String },
    name: { type: String, default: '' },
    priceDelta: { type: Number, default: 0 },
  },
  { _id: false }
);

const variantGroupSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, default: '' },
    selectionType: {
      type: String,
      enum: ['single', 'multiple'],
      default: 'single',
    },
    required: { type: Boolean, default: false },
    choices: { type: [variantChoiceSchema], default: [] },
  },
  { _id: false }
);

const productAddonSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, default: '' },
    price: { type: Number, default: 0 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'A product must have a name'],
      trim: true,
      maxlength: [150, 'Product name is too long'],
      minlength: [3, 'Product name is too short'],
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [500, 'Short description is too long'],
    },
    description: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    /** Department the product was created under (resolved from productType slug on create) */
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'A product must belong to a category'],
    },
    price: {
      type: Number,
      required: [true, 'A product must have a price'],
      min: 0,
    },
    comparePrice: {
      type: Number,
      min: 0,
    },
    cost: {
      type: Number,
      min: 0,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    trackInventory: {
      type: Boolean,
      default: true,
    },
    lowStockThreshold: {
      type: Number,
      min: 0,
    },
    sku: {
      type: String,
      trim: true,
    },
    availability: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    chefSpecial: {
      type: Boolean,
      default: false,
    },
    /** Search / display tags (Add Product “Tags”) */
    tags: {
      type: [String],
      default: [],
    },
    /** Per-department custom fields from DepartmentField definitions */
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    variantGroups: {
      type: [variantGroupSchema],
      default: [],
    },
    addons: {
      type: [productAddonSchema],
      default: [],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5,
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    reviews: {
      type: [String],
      default: [],
    },
    dateAdded: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.index({ category: 1 });
productSchema.index({ department: 1 });
productSchema.index({ slug: 1 }, { sparse: true });
productSchema.index({ sku: 1 }, { sparse: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
