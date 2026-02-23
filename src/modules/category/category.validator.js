const { body, param } = require("express-validator");

exports.createCategoryValidator = [
  body("name").notEmpty().withMessage("Category name is required"),
  body("parent")
    .optional()
    .isMongoId()
    .withMessage("Invalid parent category id"),
];

exports.updateCategoryValidator = [
  param("id")
    .notEmpty()
    .withMessage("Category id is required")
    .isMongoId()
    .withMessage("Invalid category id"),
  body("name").notEmpty().withMessage("Category name is required"),
];

exports.deleteCategoryValidator = [
  param("id")
    .notEmpty()
    .withMessage("Category id is required")
    .isMongoId()
    .withMessage("Invalid category id"),
];
