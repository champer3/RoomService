const jwt = require("jsonwebtoken");
const User = require("./../Models/userModel");
const { promisify } = require("util");

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

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(201).json({
      status: "success",
      token,
      data: {
        user: newUser,
      },
    });
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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    res.status(200).json({
      status: "success",
      token,
    });
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
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
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
  next();

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      res.status(401).json({
        status: "fail",
        message: "This user does not exist",
      })
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      res.status(401).json({
        status: "fail",
        message: "User recently changed password! Please login again",
      })
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
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
