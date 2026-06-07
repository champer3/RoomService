const express = require("express");
const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController")

const router = express.Router();

router.get("/getNumber/:phoneNumber", userController.checkNumber)
router.get("/getEmail/:email", userController.checkEmail)
router.post("/signup", authController.signup)
router.post("/signupWithEmail", authController.signUpWithEmail)
router.post("/login", authController.login)
router.post('/loginWithEmail', authController.loginEmail)
router.post('/loginWithNumber', authController.loginNumber)
router.post('/forgotPassword', authController.forgotPassword)
router.patch('/resetPassword/:token', authController.resetPassword)
router.patch('/updatePassword/:email', authController.updatePassword)

router.post('/push-token', authController.protect, userController.registerPushToken);
router.delete('/push-token', authController.protect, userController.unregisterPushToken);

// Address endpoints
router.get('/addresses', authController.protect, userController.getAddresses);
router.put('/addresses', authController.protect, userController.syncAddresses);
router.post('/addresses', authController.protect, userController.addAddress);
router.delete('/addresses/:addressId', authController.protect, userController.deleteAddress);

// Cart endpoints
router.get('/cart', authController.protect, userController.getCart);
router.put('/cart', authController.protect, userController.syncCart);
router.delete('/cart', authController.protect, userController.clearCart);

// Favorites endpoints
router.get('/favorites', authController.protect, userController.getFavorites);
router.put('/favorites', authController.protect, userController.syncFavorites);
router.post('/favorites/toggle', authController.protect, userController.toggleFavorite);

router
  .route("/")
  // .get(authController.protect, authController.restrictTo('admin', 'owner'), userController.getAllUsers)
  .get(authController.protect, authController.restrictTo('admin', 'owner'), userController.getAllUsers)
  // .get(userController.getAllUsers)
  .post(authController.protect, authController.restrictTo('admin', 'owner'), userController.createUser);

router
  .route("/:user")
  .get(authController.protect, authController.restrictTo('admin', 'owner', 'driver'),  userController.getUser)
  .patch(authController.protect,  userController.updateUser)
  .patch(authController.protect,  userController.deleteMe)
  .patch(authController.protect,  userController.updateMe)
  .delete(authController.protect, userController.deleteUser);

module.exports = router;
