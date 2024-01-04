const express = require("express");
const productController = require("./../controllers/productController");
const authController = require("./../controllers/authController")

const router = express.Router();

router
  .route("/")
  .get(productController.getAllProducts)
  .post(authController.protect, authController.restrictTo('admin', 'owner'), productController.createProduct);

router
  .route("/:product")
  .get(productController.getProduct)
  .patch(authController.protect, authController.restrictTo('admin', 'owner'), productController.updateProduct)
  .delete(authController.protect, authController.restrictTo('admin', 'owner'), productController.deleteProduct);

module.exports = router;
