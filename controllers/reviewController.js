const Review = require("./../Models/reviewModel");

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find();
    res.status(200).json({
      status: "success",
      results: reviews.length,
      data: {
        reviews,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.createReview = async (req, res) => {
  try {
    const userID = req.user.id;
    const productID = req.body.productID;
    if (!req.user) {
      return res.status(400).json({
        status: "fail",
        message: "You have to be loggedIn to make a review",
      });
    }
    if (!req.user.order.includes(productID)) {
      return res.status(400).json({
        status: "fail",
        message:
          "You are trying to write a review for a product you have not purchased",
      });
    }

    const existingReview = await Review.findOne({ userID, productID });

    if (existingReview) {
      return res.status(400).json({
        status: "fail",
        message: "You have already provided a review for this product.",
      });
    }

    const review = await Review.create({ ...req.body, userID: req.user.id });

    res.status(201).json({
      status: "success",
      data: {
        review,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.getReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.review);
    res.status(200).json({
      status: "success",
      data: {
        review,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.getUserReview = async (req, res) => {
  try {
    const userReviews = await Review.find({ userID: req.params.userReviews });
    res.status(200).json({
      status: "success",
      results: userReviews.length,
      data: {
        reviews: userReviews,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.review);

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.review,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: "success",
      review,
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};
