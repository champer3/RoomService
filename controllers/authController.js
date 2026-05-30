const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const userModel = require("./../Models/userModel");
const { promisify } = require("util");
// const Email = require("./../utils/email");

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000);
}

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
  return token;
};

// Sign up with email + password. Final step is firstName + lastName. No phone (add in profile later).
exports.signUpWithEmail = async (req, res, next) => {
  try {
    const { email, password, passwordConfirm, firstName, lastName } = req.body;
    if (!email || !password || !passwordConfirm || !firstName || !lastName) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide email, password, passwordConfirm, firstName, and lastName",
      });
    }
    if (password !== passwordConfirm) {
      return res.status(400).json({
        status: "fail",
        message: "Passwords do not match",
      });
    }
    if (password.length < 8) {
      return res.status(400).json({
        status: "fail",
        message: "Password must be at least 8 characters",
      });
    }

    const existing = await userModel.findOne({ email });
    if (existing) {
      return res.status(400).json({
        status: "fail",
        message: "Email already registered. Sign in or use a different email.",
      });
    }

    const newUser = await userModel.create({
      email: email.toLowerCase().trim(),
      password,
      passwordConfirm,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
    exports.createSendToken(newUser, 201, res);
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message || err,
    });
  }
};

// Sign up with phone (after OTP) or complete Google/phone flow. Requires firstName + lastName (final step). Optional password or googleID.
exports.signup = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phoneNumber, googleID, password, passwordConfirm, address, role } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({
        status: "fail",
        message: "First name and last name are required to complete account creation",
      });
    }

    const createPayload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email && email.trim() ? email.trim().toLowerCase() : undefined,
      phoneNumber: phoneNumber && phoneNumber.trim() ? phoneNumber.trim() : undefined,
      googleID: googleID || undefined,
      address: address || [],
      role: role || "user",
    };

    if (password && passwordConfirm) {
      if (password !== passwordConfirm) {
        return res.status(400).json({
          status: "fail",
          message: "Passwords do not match",
        });
      }
      if (password.length < 8) {
        return res.status(400).json({
          status: "fail",
          message: "Password must be at least 8 characters",
        });
      }
      createPayload.password = password;
      createPayload.passwordConfirm = passwordConfirm;
    }

    const newUser = await userModel.create(createPayload);
    exports.createSendToken(newUser, 201, res);
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message || err,
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide email and password",
      });
    }

    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid email or password",
      });
    }

    // User signed up with Google — must use "Sign in with Google"
    if (user.googleID) {
      return res.status(401).json({
        status: "fail",
        message: "This account uses Google sign-in. Please sign in with Google.",
      });
    }

    if (!user.password) {
      return res.status(401).json({
        status: "fail",
        message: "This account uses Google sign-in. Please sign in with Google.",
      });
    }

    const correct = await user.correctPassword(password, user.password);
    if (!correct) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid email or password",
      });
    }

    exports.createSendToken(user, 200, res);
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message || err,
    });
  }
};

// Login with Google (email + googleID). No password check. If user exists and googleID matches, return token. If no user, optionally create (first-time Google).
exports.loginEmail = async (req, res, next) => {
  try {
    const { email, googleID } = req.body;
    if (!email || !googleID) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide email and googleID for Google sign-in",
      });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      // First-time Google sign-up: create user with email + googleID (no password). Names can be added in app final step.
      const newUser = await userModel.create({
        firstName: req.body.firstName || "",
        lastName: req.body.lastName || "",
        email: req.body.email,
        googleID: req.body.googleID,
        facebookID: req.body.facebookID || undefined,
      });
      return exports.createSendToken(newUser, 201, res);
    }

    if (user.googleID) {
      if (req.body.googleID === user.googleID) {
        return exports.createSendToken(user, 200, res);
      }
      return res.status(401).json({
        status: "fail",
        message: "Invalid Google sign-in. Please try again.",
      });
    }

    if (user.facebookID) {
      if (req.body.facebookID === user.facebookID) {
        return exports.createSendToken(user, 200, res);
      }
      return res.status(401).json({
        status: "fail",
        message: "Invalid Facebook sign-in. Please try again.",
      });
    }

    return res.status(401).json({
      status: "fail",
      message: "This account was created with email/password. Please sign in with email and password.",
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message || err,
    });
  }
};

exports.loginNumber = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;

    const user = await userModel.findOne({ phoneNumber });

    if (!user) {
      return res.status(400).json({
        status: "fail",
        message: "Login with your email again or use a different route",
      });
    }

    // return res.status(200).json({
    //   status: "success",
    //   message: "you have a user",
    //   data: {
    //     user
    //   }
    // });
    exports.createSendToken(user, 200, res);
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.protect = async (req, res, next) => {
  // 1) Getting token and check of it's there
  console.log("User is authorized to access the route");
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(400).json({
        status: "fail",
        message: "The token is wrong",
      })
  }

  // 2) Verification token
  // console.log(process.env.JWT_SECRET);
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.message === "jwt expired") {
      // console.log("Token expired");
      return res.status(400).json({
        status: "fail",
        message: "The token is wrong",
      });
    } else {
      // Handle other JWT verification errors
      return res.status(400).json({
        status: "fail",
        message: "The token is wrong",
      });
    }
  }
  // const decoded = await jwt.verify(token, process.env.JWT_SECRET);
  // console.log("hdiddjddkkkkmjnakdkm");
  // console.log(decoded);
  // console.log("We have it all decoded");

  // 3) Check if user still exists
  const currentUser = await userModel.findById(decoded.id);
  // console.log(currentUser);
  if (!currentUser) {
    // console.log("This user doesn't exist so we cannot move on");
    return res.status(401).json({
      status: "fail",
      message: "This user does not exist",
    });
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    // console.log("The user changed password so we are fucked");
    return res.status(401).json({
        status: "fail",
        message: "User recently changed password! Please login again",
      })
  }
  console.log("User is authorized to access the route");

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;

  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await userModel.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json({
        status: "fail",
        message: "There is no user with email address.",
      })
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3) Send it to user's email
  const verificationCode = generateVerificationCode();
  console.log("Verification Code:", verificationCode);

  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: "Your password reset token (valid for 10 min)",
    //   message,
    // });
    // await new Email(user, resetToken).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
        status: "fail",
        message: "There was an error sending the email. Try again later!",
      })
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    // 1) Get user based on the token

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await userModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
      return res.status(400).json({
          status: "fail",
          message: "Token is invalid or has expired",
        })
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changedPasswordAt property for the user
    // 4) Log the user in, send JWT
    res.status(200).json({
      status: "success",
      // token,
      data: {
        user,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: "shit failed",
    });
  }
};

exports.updatePassword = async (req, res, next) => {
  const user = await userModel.findOne({ email: req.params.email });
  if (!user) {
    return res.status(404).json({
        status: "fail",
        message: "There is no user with email address.",
      })
  }

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return res.status(400).json({
        status: "fail",
        message: "This user does not exist",
      })
  }

  const checkPassword = await user.correctPassword(
    req.body.passwordCurrent,
    user.password
  );
  if (!checkPassword) {
    return res.status(401).json({
        status: "fail",
        message: "Y0u entered the wrong password",
      })
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.save();
  try {
    exports.createSendToken(user, 200, res);
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};
