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
