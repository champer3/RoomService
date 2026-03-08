const mongoose = require('mongoose');

const communicationSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
    },
    body: {
      type: String,
      required: [true, "A communication must always have a body"]
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    statuts: {
      type: String,
      enum: ['resolved', 'read', 'in-progress'],
      default: "in-progress"
    },
    communicationType: {
      type: String,
      enum: ['email', 'sms', 'in-app']
    },
    userID: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const Communication = mongoose.model('Communication', communicationSchema);

module.exports = Communication;