const express = require("express");
const orderController = require("./../controllers/orderController");
const authController = require("./../controllers/authController")

const router = express.Router();

router
  .route("/")
  .get(authController.protect, authController.restrictTo('admin', 'owner'), orderController.getAllOrders)
  .post(authController.protect, orderController.createOrder);

router
  .route("/:order")
  .get(authController.protect, orderController.getOrder)
  .patch(authController.protect, authController.restrictTo('admin', 'owner'), orderController.updateOrder)
  .delete(authController.protect, authController.restrictTo('admin', 'owner'), orderController.deleteOrder);

module.exports = router;
