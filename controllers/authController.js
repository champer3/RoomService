const crypto = require('crypto');
const jwt = require("jsonwebtoken");
const User = require("./../Models/userModel");
const { promisify } = require("util");
const sendEmail = require("./../utils/email");


const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  console.log('here')
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  console.log('here2')
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;
  // console.log('here2')
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = async (req, res, next) => {
  try {
    let newUser;
    if (req.body.password && req.body.email) {
      newUser = await User.create({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
      });
    } else {
      if (req.body.email) {
        newUser = await User.create({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          phoneNumber: req.body.phoneNumber,
        });
      } else {
        newUser = await User.create({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          phoneNumber: req.body.phoneNumber,
        });
      }
    }
    createSendToken(newUser, 201, res)
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        status: "fail",
        message: "Yu have not provided either the email or the password",
      });
      return;
    }
    const user = await User.findOne({ email });
    const correct = await user.correctPassword(password, user.password);
    console.log(password, user.password);
    console.log(correct);

    if (!user || !correct) {
      res.status(401).json({
        status: "fail",
        message: "Incorrect email or password",
      });
      return;
    }
    createSendToken(user, 200, res)
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.protect = async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    console.log("we actually have a token")
    token = req.headers.authorization.split(" ")[1];
    console.log(token)
  }

  if (!token) {
    console.log("we do not have a token")
    return next(
      res.status(400).json({
        status: "fail",
        message: "The token is wrong",
      })
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // const decoded = await jwt.verify(token, process.env.JWT_SECRET);
  console.log(decoded);
  console.log("We have it all decoded")

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    console.log("This user doesn't exist so we cannot move on")
    return next(
      res.status(401).json({
        status: "fail",
        message: "This user does not exist",
      })
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    console.log("The user changed password so we are fucked")
    return next(
      res.status(401).json({
        status: "fail",
        message: "User recently changed password! Please login again",
      })
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  console.log("if we are here, then we are fucking good, so what?")
  req.user = currentUser;
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        res.status(403).json({
          status: "fail",
          message: "You do not have permission to perform this action",
        })
      );
    }

    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      res.status(404).json({
        status: "fail",
        message: "There is no user with email address.",
      })
    );
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 min)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      res.status(500).json({
        status: "fail",
        message: "There was an error sending the email. Try again later!",
      })
    );
  }
};

exports.resetPassword = async (req, res, next) => {
  try{

    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
      return next(
        res.status(400).json({
          status: "fail",
          message: "Token is invalid or has expired",
        })
      );
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changedPasswordAt property for the user
    // 4) Log the user in, send JWT
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user
      }
    });
  } catch(err) {
    res.status(400).json({
      status: 'fail',
      message: 'shit failed'
    });
  }
};

exports.updatePassword = async (req, res, next) =>{
  const user = await User.findOne({ email: req.params.email });
  if (!user) {
    return next(
      res.status(404).json({
        status: "fail",
        message: "There is no user with email address.",
      })
    );
  }

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
      return next(
        res.status(400).json({
          status: "fail",
          message: "This user does not exist",
        })
      );
    }
  console.log(user)

  const checkPassword = await user.correctPassword(req.body.passwordCurrent, user.password)
  if (!checkPassword){
    return next(
      res.status(401).json({
        status: "fail",
        message: "Y0u entered the wrong password"
      })
    )
  }
  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  user.save()
  try{
    createSendToken(user, 200, res)
  } catch(err){
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }

}