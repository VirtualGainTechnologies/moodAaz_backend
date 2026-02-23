const { body, param } = require("express-validator");

exports.createCategoryValidator = [
  body("name").notEmpty().withMessage("Category name is required"),
  body("parent")
    .optional()
    .isMongoId()
    .withMessage("Invalid parent category id"),
];

exports.updateCategoryValidator = [
  param("id").isMongoId(),
  body("name").optional().notEmpty(),
];

exports.deleteCategoryValidator = [param("id").isMongoId()];
