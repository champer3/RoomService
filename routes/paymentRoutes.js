const express = require("express");
const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController")
const paymentController = require("./../controllers/paymentController")

const router = express.Router();

// authController.protect,
router.post('/checkout-session/', authController.protect, paymentController.getCheckOutSession)
router.post('/payment-sheet/', authController.protect, paymentController.getCardDetails)
router.post('/payment-methods/', authController.protect, paymentController.getPaymentMethods)
// router.get('/hello', userController.getAllUsers)


module.exports = router;
