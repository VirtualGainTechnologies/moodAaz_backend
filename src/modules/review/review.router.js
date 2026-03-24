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
const { authenticate, authorize, multer } = require("../../middlewares");
const {
  createReviewValidator,
  updateReviewValidator,
  getProductReviewsValidator,
  deleteReviewValidator,
} = require("./review.validator");

router.post(
  "/create/:productId",
  authenticate,
  authorize("USER"),
  multer.array("images", 5),
  createReviewValidator,
  catchAsyncWithSession("createReview api", createReview),
);
router.get(
  "/:productId",
  authenticate,
  authorize("USER"),
  getProductReviewsValidator,
  catchAsync("getProductReviews api", getProductReviews),
);
router.put(
  "/:reviewId",
  authenticate,
  authorize("USER"),
  multer.array("images", 5),
  updateReviewValidator,
  catchAsyncWithSession("updateReview api", updateReview),
);
router.delete(
  "/:reviewId",
  authenticate,
  authorize("USER"),
  deleteReviewValidator,
  catchAsyncWithSession("deleteReview api", deleteReview),
);

module.exports = router;
