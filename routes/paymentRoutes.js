const express = require("express");
const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController")
const paymentController = require("./../controllers/paymentController")

const router = express.Router();

router.post('/checkout-session', authController.protect, paymentController.getCheckOutSession)
router.post('/payment-sheet', authController.protect, paymentController.getCardDetails)
router.post('/payment-methods/set-default', authController.protect, paymentController.setDefaultPaymentMethod)
router.post('/payment-methods', authController.protect, paymentController.getPaymentMethods)
router.patch('/payment-methods/:paymentMethodId', authController.protect, paymentController.updatePaymentMethod)
router.delete('/payment-methods/:paymentMethodId', authController.protect, paymentController.deletePaymentMethod)


module.exports = router;
