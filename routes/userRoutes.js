const express = require("express");
const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController")

const router = express.Router();

router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.post('/forgotPassword', authController.forgotPassword)
router.patch('/resetPassword/:token', authController.login)
router.patch('/updatePassword/:email', authController.updatePassword)

router
  .route("/")
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
