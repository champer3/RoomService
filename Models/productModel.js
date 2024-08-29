const mongoose = require('mongoose');
const validator = require('validator');
const { options } = require('../app');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'A product must have a name'],
      unique: true,
      trim: true,
      maxlength: [150, 'A product"s name must have less or equal then 40 characters'],
      minlength: [3, 'A product"s name must be equal or more then 10 characters'],
    },
    components: {
      type: [String]
    },
    category: {
      type: String,
      required: [true, 'A product must always belong to a category']
    },
    Brand: {
      type: String,
    },
    extra: Boolean,
    stock: {
      type: Number,
      default: 0,
    },
    instructions: Boolean,
    nutrients: {
      type: [String],
      default: []
    },
    images: {
        type: [String],
        default: []
    },
    options: {
        type: [String],
        default: []
    },
    related: {
        type: [String],
        default: []
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: val => Math.round(val * 10) / 10 // 4.666666, 46.6666, 47, 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    reviews: {
        type: [String],
        default: []
    },
    oldPrice: {
      type: Number
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    description: {
      type: String,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    availability: {
      type: Boolean,
      default: true
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);


const Tour = mongoose.model('Product', productSchema);

module.exports = Tour;