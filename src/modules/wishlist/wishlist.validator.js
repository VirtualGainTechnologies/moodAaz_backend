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
];

exports.removeItemValidator = [
  param("variantId")
    .notEmpty()
    .withMessage("Variant ID is required")
    .isMongoId()
    .withMessage("Invalid variant ID"),
];

exports.moveToCartValidator = [
  param("variantId")
    .notEmpty()
    .withMessage("Variant ID is required")
    .isMongoId()
    .withMessage("Invalid variant ID"),
];

exports.guestWishlistValidator = [
  body("guestItems")
    .notEmpty()
    .withMessage("Guest items are required")
    .isArray({ min: 1, max: 200 })
    .withMessage("Guest items must be an array with 1 to 200 items"),
  body("guestItems.*.productId")
    .notEmpty()
    .withMessage("Product ID is required in each item")
    .isMongoId()
    .withMessage("Invalid product ID in guest items"),
  body("guestItems.*.variantId")
    .notEmpty()
    .withMessage("Variant ID is required in each item")
    .isMongoId()
    .withMessage("Invalid variant ID in guest items"),
];
