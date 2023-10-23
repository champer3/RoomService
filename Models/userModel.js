const mongoose = require("mongoose")
// const validator = require('validator');
const userSchema = new mongoose.Schema({
    firstName: {
      type: String,
      required: [true, 'A user must have a first name'],
      trim: true,
      maxlength: [20, "A user's name must have less or equal then 20 characters"],
      minlength: [1, "A user's name must have more or equal then 10 characters"],
    },
    lastName: {
      type: String,
      required: [true, 'A user must have a first name'],
      trim: true,
      maxlength: [20, "A user's name must have less or equal then 20 characters"],
      minlength: [1, "A user's name must have more or equal then 10 characters"],
    },
    userName: {
      type: String,
      required: [true, 'A user must have a first name'],
      trim: true,
      maxlength: [20, "A user's name must have less or equal then 20 characters"],
      minlength: [1, "A user's name must have more or equal then 10 characters"],
    },
})

const User = mongoose.model('User', userSchema)

module.exports = User