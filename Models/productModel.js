const mongoose = require('mongoose');
const validator = require('validator');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A product must have a name'],
      unique: true,
      trim: true,
      maxlength: [150, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters'],
    },
    category: {
      type: String,
      required: [true, 'A product must always belong to a category']
    },
    Brand: {
      type: String,
      required: [true, 'A product must always have a brand']
    },
    stock: {
      type: Number,
      default: 0,
    },
    image: {
        type: [String],
        default: []
    },
    tags: {
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
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
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
    },
    variants: {
        type: [String],
        default: []
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);


const Tour = mongoose.model('Product', productSchema);

module.exports = Tour;