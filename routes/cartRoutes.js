const express = require("express");
const cartController = require("./../controllers/cartController");
const authController = require("./../controllers/authController")

const router = express.Router();

router
  .route("/")
  .get(authController.protect, authController.restrictTo('admin', 'owner'), cartController.getAllCarts)
  .post(authController.protect, cartController.createCart);

router
  .route("/:product")
  .get(authController.protect, cartController.getCart)
  .patch(authController.protect, cartController.updateCart)
  .delete(authController.protect, cartController.deleteCart);

module.exports = router;
