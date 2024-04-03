const express = require("express");
const orderController = require("./../controllers/orderController");
const authController = require("./../controllers/authController");
// const io = require("../index");


const router = express.Router();

router
  .route("/")
  .post(authController.protect, orderController.createOrder)
  .get(
    authController.protect,
    authController.restrictTo("admin", "owner"),
    orderController.getAllOrders
  );

router
  .route("/get-your-orders")
  .get(authController.protect, orderController.getUserOrders);

router
  .route("/:order")
  .get(authController.protect, orderController.getOrder)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "owner"),
    orderController.updateOrder
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "owner"),
    orderController.deleteOrder
  );

module.exports = router;
