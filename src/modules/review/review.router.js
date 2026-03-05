const router = require("express").Router();

const {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
} = require("./review.controller");
const {
  catchAsync,
  catchAsyncWithSession,
} = require("../../utils/catch-async");
const { authenticate, authorize } = require("../../middlewares");
const {
  createReviewValidator,
  updateReviewValidator,
  getProductReviewsValidator,
  deleteReviewValidator,
} = require("./review.validator");

router.post(
  "/create/:productId",
  authenticate,
  authorize("SUPER-ADMIN"),
  createReviewValidator,
  catchAsyncWithSession("createReview api", createReview),
);
router.get(
  "/:productId",
  authenticate,
  authorize("SUPER-ADMIN"),
  getProductReviewsValidator,
  catchAsync("getProductReviews api", getProductReviews),
);
router.put(
  "/:reviewId",
  authenticate,
  authorize("SUPER-ADMIN"),
  updateReviewValidator,
  catchAsyncWithSession("updateReview api", updateReview),
);
router.delete(
  "/:reviewId",
  authenticate,
  authorize("SUPER-ADMIN"),
  deleteReviewValidator,
  catchAsyncWithSession("deleteReview api", deleteReview),
);

module.exports = router;
