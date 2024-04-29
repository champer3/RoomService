const user = require("./../Models/userModel");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await user.find();
    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    const getUser = await user.find({email: req.params.user});
    res.status(200).json({
      status: "success",
      data: {
        user: getUser,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.checkNumber = async (req, res) => {
  try {
    const getUser = await user.find({phoneNumber: req.params.phoneNumber});
    if(getUser.length === 0){
      res.status(200).json({
        status: "success",
        message: "User doesn't exist",
      });
    } else{
      res.status(200).json({
        status: "success",
        data: {
          user: getUser,
        },
      });
    }
    return
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.checkEmail = async (req, res) => {
  try {
    const getUser = await user.find({email: req.params.email});
    if(user.length === 0){
      res.status(200).json({
        status: "success",
        message: "User doesn't exist",
      });
    } else{
      res.status(200).json({
        status: "success",
        data: {
          user: getUser,
        },
      });
    }
    return
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.createUser = async (req, res) => {
  try {
    const newUser = await user.create(req.body);

    res.status(201).json({
      status: "success",
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

exports.updateMe = async (req, res, next) => {
  try{
    // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      res.status(400).json({
        status: "fail",
        message: "'This route is not for password updates. Please use /updateMyPassword.'",
      })
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Update user document
  const getUser = await user.find({email: req.params.user});
  const updatedUser = await user.findByIdAndUpdate(getUser.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
  } catch(err){
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }

};

exports.deleteMe = async (req, res, next) => {
  try{
    const getUser = await user.find({email: req.params.user});
    await user.findByIdAndUpdate(getUser.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
  } catch(err){
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    console.log("ready to delete user")
    const getUser = await user.find({email: req.params.user});
    if(getUser[0].id === req.user.id){
      await user.findByIdAndDelete(getUser[0].id)
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const getUser = await user.find({email: req.params.user});
    const updatedUser = await user.findByIdAndUpdate(getUser[0].id, req.body, {
      new: true,
      runValidators: true
    });
    // user.save()

    res.status(200).json({
      status: "success",
      user: updatedUser,
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};
