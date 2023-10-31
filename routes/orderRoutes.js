const express = require("express");
const orderController = require("./../controllers/orderController");

const router = express.Router();

router
  .route("/")
  .get(orderController.getAllOrders)
  .post(orderController.createOrder);

router
  .route("/:order")
  .get(orderController.getOrder)
  .patch(orderController.updateOrder)
  .delete(orderController.deleteOrder);

module.exports = router;
