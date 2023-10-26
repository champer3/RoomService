const express = require("express");
const productController = require("./../controllers/productController");

const router = express.Router();

router
  .route("/")
  .get(productController.getAllProducts)
  .post(productController.createProduct);

// router
//   .route("/:user")
//   .get(userController.getUser)
//   .patch(userController.updateUser)
//   .delete(userController.deleteUser);

module.exports = router;
