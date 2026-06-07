const user = require("./../Models/userModel");
const { getIO } = require('../socketManager');

exports.registerPushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    if (!pushToken || !pushToken.startsWith('ExponentPushToken')) {
      return res.status(400).json({ status: 'fail', message: 'Invalid push token' });
    }

    await user.findByIdAndUpdate(req.user.id, {
      $addToSet: { expoPushTokens: pushToken },
    });

    res.status(200).json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

exports.unregisterPushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    if (!pushToken) {
      return res.status(400).json({ status: 'fail', message: 'Push token required' });
    }

    await user.findByIdAndUpdate(req.user.id, {
      $pull: { expoPushTokens: pushToken },
    });

    res.status(200).json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

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
    const getUser = await user.findOne({phoneNumber: req.params.phoneNumber});
    if(!getUser){
      res.status(200).json({
        status: "success",
        message: "User doesn't exist",
        data: null,
      });
    } else{
      res.status(200).json({
        status: "success",
        data: {
          _id: getUser._id,
          email: getUser.email,
          phoneNumber: getUser.phoneNumber,
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
    const getUser = await user.find({ email: req.params.email });
    res.status(200).json({
      status: "success",
      ...(getUser.length === 0 && { message: "User doesn't exist" }),
      data: { user: getUser },
    });
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

  // 2) Filtered out unwanted fields; allow profile completion (phone, email, names)
  const filteredBody = filterObj(req.body, "name", "email", "phoneNumber", "firstName", "lastName");

  // 3) Update user document (protect middleware sets req.user)
  const updatedUser = await user.findByIdAndUpdate(req.user.id, filteredBody, {
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

// ─── Address Sync ──────────────────────────────────────────────────────────

exports.getAddresses = async (req, res) => {
  try {
    const currentUser = await user.findById(req.user.id).select("address");
    res.status(200).json({ status: "success", data: currentUser.address || [] });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

exports.syncAddresses = async (req, res) => {
  try {
    const { addresses } = req.body;
    if (!Array.isArray(addresses)) {
      return res.status(400).json({ status: "fail", message: "addresses must be an array" });
    }
    const updated = await user.findByIdAndUpdate(
      req.user.id,
      { address: addresses },
      { new: true, runValidators: true }
    );
    res.status(200).json({ status: "success", data: updated.address });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const { address } = req.body;
    if (!address || !address.address) {
      return res.status(400).json({ status: "fail", message: "address object with address field required" });
    }
    const updated = await user.findByIdAndUpdate(
      req.user.id,
      { $push: { address } },
      { new: true, runValidators: true }
    );
    res.status(201).json({ status: "success", data: updated.address });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const currentUser = await user.findById(req.user.id);
    currentUser.address = currentUser.address.filter(
      (a) => a._id.toString() !== addressId && String(a.id) !== addressId
    );
    await currentUser.save({ validateBeforeSave: false });
    res.status(200).json({ status: "success", data: currentUser.address });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// ─── Cart Sync ─────────────────────────────────────────────────────────────

const Cart = require("./../Models/cartModel");

exports.getCart = async (req, res) => {
  try {
    const cartDoc = await Cart.findOne({ userID: req.user.id });
    res.status(200).json({ status: "success", data: cartDoc ? cartDoc.items : [] });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

exports.syncCart = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ status: "fail", message: "items must be an array" });
    }
    const cartDoc = await Cart.findOneAndUpdate(
      { userID: req.user.id },
      { items, dateUpdate: Date.now() },
      { new: true, upsert: true, runValidators: true }
    );
    const io = getIO();
    if (io) {
      const socketId = req.headers['x-socket-id'];
      const room = io.to(req.user.id);
      if (socketId) {
        room.except(socketId).emit('cartSync', { items: cartDoc.items });
      } else {
        room.emit('cartSync', { items: cartDoc.items });
      }
    }
    res.status(200).json({ status: "success", data: cartDoc.items });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { userID: req.user.id },
      { items: [], dateUpdate: Date.now() }
    );
    const io = getIO();
    if (io) {
      const socketId = req.headers['x-socket-id'];
      const room = io.to(req.user.id);
      if (socketId) {
        room.except(socketId).emit('cartSync', { items: [] });
      } else {
        room.emit('cartSync', { items: [] });
      }
    }
    res.status(200).json({ status: "success", data: [] });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// ─── Favorites ──────────────────────────────────────────────────────────────

exports.getFavorites = async (req, res) => {
  try {
    const u = await user.findById(req.user.id).select("favorites");
    res.status(200).json({ status: "success", data: u?.favorites || [] });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

exports.syncFavorites = async (req, res) => {
  try {
    const { favorites } = req.body;
    await user.findByIdAndUpdate(req.user.id, { favorites: favorites || [] });
    const io = getIO();
    if (io) {
      const socketId = req.headers['x-socket-id'];
      const room = io.to(req.user.id);
      if (socketId) {
        room.except(socketId).emit('favoritesSync', { ids: favorites || [] });
      } else {
        room.emit('favoritesSync', { ids: favorites || [] });
      }
    }
    res.status(200).json({ status: "success", data: favorites || [] });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

exports.toggleFavorite = async (req, res) => {
  try {
    const { productId } = req.body;
    const u = await user.findById(req.user.id).select("favorites");
    const favs = u?.favorites || [];
    const idx = favs.indexOf(productId);
    if (idx === -1) {
      favs.push(productId);
    } else {
      favs.splice(idx, 1);
    }
    await user.findByIdAndUpdate(req.user.id, { favorites: favs });
    const io = getIO();
    if (io) {
      const socketId = req.headers['x-socket-id'];
      const room = io.to(req.user.id);
      if (socketId) {
        room.except(socketId).emit('favoritesSync', { ids: favs });
      } else {
        room.emit('favoritesSync', { ids: favs });
      }
    }
    res.status(200).json({ status: "success", data: favs });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};
