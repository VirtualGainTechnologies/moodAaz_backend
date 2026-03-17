const { body, param } = require("express-validator");

exports.createCategoryValidator = [
  body("name").notEmpty().withMessage("Category name is required"),
  body("parent")
    .optional()
    .isMongoId()
    .withMessage("Invalid parent category id"),
  body("image").custom((_value, { req }) => {
    if (!req.file) {
      throw new Error("Category image is required");
    }
    return true;
  }),
];

exports.updateCategoryValidator = [
  param("id")
    .notEmpty()
    .withMessage("Category id is required")
    .isMongoId()
    .withMessage("Invalid category id"),
  body("name").optional(),
  body("image").optional(),
];

exports.categoryIdParamValidator = [
  param("id")
    .notEmpty()
    .withMessage("Category id is required")
    .isMongoId()
    .withMessage("Invalid category id"),
];
