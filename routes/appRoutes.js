const express = require('express');
const appPromotionController = require('../controllers/appPromotionController');

const router = express.Router();

router.get('/home', appPromotionController.getAppHome);
router.get('/departments/:slug', appPromotionController.getAppDepartment);
router.get('/categories/:slug', appPromotionController.getAppCategory);
router.get('/products/:productId', appPromotionController.getAppProduct);
router.post('/cart/promotions', appPromotionController.postAppCartPromotions);
router.post('/cart/apply-coupon', appPromotionController.postAppApplyCoupon);

module.exports = router;
