const { body, param } = require("express-validator");

exports.addItemValidator = [
  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID"),
  body("variantId")
    .notEmpty()
    .withMessage("Variant ID is required")
    .isMongoId()
    .withMessage("Invalid variant ID"),
  body("quantity")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Quantity must be between 1 and 10"),
];

exports.updateQuantityValidator = [
  param("variantId")
    .notEmpty()
    .withMessage("Variant ID is required")
    .isMongoId()
    .withMessage("Invalid variant ID"),
  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 1, max: 10 })
    .withMessage("Quantity must be between 1 and 10"),
];

exports.removeItemValidator = [
  param("variantId")
    .notEmpty()
    .withMessage("Variant ID is required")
    .isMongoId()
    .withMessage("Invalid variant ID"),
];

exports.mergeGuestCartValidator = [
  body("guestItems")
    .notEmpty()
    .withMessage("Guest items are required")
    .isArray({ min: 1, max: 50 })
    .withMessage("Guest items must be an array with 1 to 50 items"),
  body("guestItems.*.product_id")
    .notEmpty()
    .withMessage("Product ID is required in each item")
    .isMongoId()
    .withMessage("Invalid product ID in guest items"),
  body("guestItems.*.variant_id")
    .notEmpty()
    .withMessage("Variant ID is required in each item")
    .isMongoId()
    .withMessage("Invalid variant ID in guest items"),
  body("guestItems.*.quantity")
    .notEmpty()
    .withMessage("Quantity is required in each item")
    .isInt({ min: 1, max: 10 })
    .withMessage("Quantity must be between 1 and 10 in each item"),
];
