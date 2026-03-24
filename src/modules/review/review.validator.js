const { body, param, query } = require("express-validator");

exports.createReviewValidator = [
  param("productId")
    .trim()
    .notEmpty()
    .withMessage("Product ID is required in the request parameters")
    .bail()
    .isMongoId()
    .withMessage("Product ID must be a valid MongoDB ObjectId"),
  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("title")
    .optional()
    .isLength({ max: 120 })
    .withMessage("Title must not exceed 120 characters"),
  body("comment")
    .notEmpty()
    .withMessage("Review comment is required")
    .isLength({ min: 10 })
    .withMessage("Comment must be at least 10 characters"),
];

exports.updateReviewValidator = [
  param("reviewId")
    .trim()
    .notEmpty()
    .withMessage("Review ID is required in the request parameters")
    .bail()
    .isMongoId()
    .withMessage("Review ID must be a valid MongoDB ObjectId"),
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("title")
    .optional()
    .isLength({ max: 120 })
    .withMessage("Title must not exceed 120 characters"),
  body("comment")
    .optional()
    .isLength({ min: 10 })
    .withMessage("Comment must be at least 10 characters"),
  body("removeImages")
    .optional()
    .custom((value) => {
      const validatedImages = JSON.parse(value);
      if (!Array.isArray(validatedImages)) {
        throw new Error("removeImages must be an array of image URLs");
      }
      for (const url of validatedImages) {
        if (typeof url !== "string" || !url.startsWith("https://")) {
          throw new Error(`Invalid image URL: ${url}`);
        }
      }
      return true;
    }),
];

exports.getProductReviewsValidator = [
  param("productId")
    .trim()
    .notEmpty()
    .withMessage("Product ID is required in the request parameters")
    .bail()
    .isMongoId()
    .withMessage("Product ID must be a valid MongoDB ObjectId"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive number"),
  query("limit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Limit must be a positive number"),
  query("sort")
    .optional()
    .isIn(["createdAt", "-createdAt", "rating", "-rating"])
    .withMessage("Invalid sort option"),
];

exports.deleteReviewValidator = [
  param("reviewId")
    .trim()
    .notEmpty()
    .withMessage("Review ID is required in the request parameters")
    .bail()
    .isMongoId()
    .withMessage("Review ID must be a valid MongoDB ObjectId"),
];
