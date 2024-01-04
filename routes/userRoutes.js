const express = require("express");
const passport = require('passport');
const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController")

const router = express.Router();

router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.post('/loginWithEmail', authController.loginEmail)
router.post('/forgotPassword', authController.forgotPassword)
router.patch('/resetPassword/:token', authController.resetPassword)
router.patch('/updatePassword/:email', authController.updatePassword)



router
  .route("/")
  // .get(authController.protect, authController.restrictTo('admin', 'owner'), userController.getAllUsers)
  .get(authController.protect, authController.restrictTo('admin', 'owner'), userController.getAllUsers)
  .post(authController.protect, authController.restrictTo('admin', 'owner'), userController.createUser);

router
  .route("/:user")
  .get(authController.protect, authController.restrictTo('admin', 'owner'),  userController.getUser)
  .patch(authController.protect,  userController.updateUser)
  .patch(authController.protect,  userController.deleteMe)
  .patch(authController.protect,  userController.updateMe)
  .delete(authController.protect, authController.restrictTo('admin', 'owner'), userController.deleteUser);

module.exports = router;
