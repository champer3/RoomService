const express = require("express");
const reviewController = require("./../controllers/reviewController");
const authController = require("../controllers/authController")

const router = express.Router();

router
  .route("/")
  .get(reviewController.getAllReviews)
  .post(authController.protect, reviewController.createReview);

// router.route("/:userReviews").get(reviewController.getUserReview)
router
  .route("/:review")
  .get(reviewController.getReview)
  // .patch(authController.protect, reviewController.updateReview)
  .delete(authController.protect, authController.restrictTo('admin', 'owner'), reviewController.deleteReview);

module.exports = router;
