const AppError = require("../../utils/app-error");
const service = require("./review.service");

exports.createReview = async (req, session) => {
  const review = await service.createReview(
    req.params.productId,
    req.user._id,
    req.body,
    session,
  );
  if (!review) {
    throw new AppError(400, "Failed to create review");
  }

  return {
    message: "Review added successfully",
    error: false,
    data: review,
  };
};

exports.getProductReviews = async (req, res) => {
  const reviews = await service.getProductReviews(
    req.params.productId,
    req.query,
  );
  if (!reviews) {
    throw new AppError(400, "Failed to fetch reviews");
  }

  res.status(200).json({
    message: "Product reviews fetched successfully",
    error: false,
    data: reviews,
  });
};

exports.updateReview = async (req, session) => {
  const review = await service.updateReview(
    req.params.reviewId,
    req.user._id,
    req.body,
    session,
  );
  if (!review) {
    throw new AppError(400, "Failed to update review");
  }

  return {
    message: "Review updated successfully",
    error: false,
    data: review,
  };
};

exports.deleteReview = async (req, session) => {
  await service.deleteReview(req.params.reviewId, session);
  return {
    message: "Review deleted successfully",
    error: false,
    data: null,
  };
};
