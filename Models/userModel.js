const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs")
const crypto = require("crypto")

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "A user must have a first name"],
      trim: true,
      maxlength: [
        20,
        "A user's name must have less or equal then 20 characters",
      ],
      minlength: [
        1,
        "A user's name must have more or equal then 10 characters",
      ],
    },
    lastName: {
      type: String,
      required: [true, "A user must have a first name"],
      trim: true,
      maxlength: [
        20,
        "A user's name must have less or equal then 20 characters",
      ],
      minlength: [
        1,
        "A user's name must have more or equal then 10 characters",
      ],
    },
    googleID: {
      type: String,
      unique: true,
    },
    email: {
      type: String,
      // required: [true, "Please provide your email"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    phoneNumber: {
      type: String,
      unique: true,
      lowercase: true,
      // required: [true, "Please provide your phoneNumber"],
      validate: [
        validator.isMobilePhone,
        "Please provide a valid phone number",
      ],
    },
    password: {
      type: String,
      // required: [true, "Please provide a password"],
      minlength: 8,
      // select: false,
    },
    passwordConfirm: {
      type: String,
      // required: [true, "Please confirm your password"],
      validate: {
        // This only works on CREATE and SAVE!!!
        validator: function (el) {
          return el === this.get("password");
        },
        message: "Passwords are not the same!",
      },
    },
    role: {
      type: String,
      enum: ["user", "editor", "admin"],
      default: "user",
    },
    active: {
      type: Boolean,
      default: true,
    },
    photo: {
      type: String,
      default: "An image based on the users name",
    },
    address: String,
    dob: {
      type: Date,
      validate: [validator.isDate, "give a valid date of birth"],
    },
    verification: {
      type: Boolean,
      default: false,
    },
    registrationDate: {
      type: Date,
      default: new Date(),
    },
    cart: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Cart'
    }],
    order: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Order'
    }],
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.pre('save', async function(next){
  if(!this.isModified('password')) return next()

  this.password = await bcrypt.hash(this.password, 12)

  this.passwordConfirm = undefined
  next()
})

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  console.log(candidatePassword, userPassword)
  return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
