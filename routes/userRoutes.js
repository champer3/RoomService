const express = require("express");
const passport = require('passport');
const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController")

const router = express.Router();

router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.post('/forgotPassword', authController.forgotPassword)
router.patch('/resetPassword/:token', authController.login)
router.patch('/updatePassword/:email', authController.updatePassword)
router.get('/homepage', (req, res) => {
  console.log("jdjnnnnnnnnnnnnnnnnnn")
  res.send('Home Page')
})

router.get('/auth/google',
    passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] })
);


router
  .route("/")
  // .get(authController.protect, authController.restrictTo('admin', 'owner'), userController.getAllUsers)
  .get(authController.protect, userController.getAllUsers)
  .post(authController.protect, authController.restrictTo('admin', 'owner'), userController.createUser);

router
  .route("/:user")
  .get(authController.protect, authController.restrictTo('admin', 'owner'),  userController.getUser)
  .patch(authController.protect,  userController.updateUser)
  .patch(authController.protect,  userController.deleteMe)
  .patch(authController.protect,  userController.updateMe)
  .delete(authController.protect, authController.restrictTo('admin', 'owner'), userController.deleteUser);

module.exports = router;
