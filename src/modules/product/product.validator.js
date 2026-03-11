const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");

const parsed = (field, val) => {
  try {
    return JSON.parse(val);
  } catch {
    throw new Error(`${field} must be valid JSON`);
  }
};

exports.createProductValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ max: 300 })
    .withMessage("Product name cannot exceed 300 characters"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Product description is required")
    .isLength({ min: 20 })
    .withMessage("Description must be at least 20 characters"),
  body("categoryId")
    .notEmpty()
    .withMessage("Category ID is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid Category ID"),
  body("categoryPath")
    .notEmpty()
    .withMessage("Category path is required")
    .custom((value) => {
      const result = parsed("Category path", value);
      if (!Array.isArray(result) || result.length === 0) {
        throw new Error("Category path must contain at least one category");
      }
      result.forEach((id) => {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new Error("Invalid category id inside categoryPath");
        }
      });
      return true;
    }),
  body("attributes")
    .optional()
    .custom((value) => {
      return parsed("Attributes", value);
    }),
  body("variants")
    .notEmpty()
    .withMessage("Variants are required")
    .custom((value) => {
      const result = parsed("Variants", value);
      if (!Array.isArray(result) || result.length === 0) {
        throw new Error("At least one variant is required");
      }
      result.forEach((variant, index) => {
        if (!variant.price || Number(variant.price) < 0) {
          throw new Error(`Variant ${index + 1} must have valid price`);
        }
        if (!variant.stock || Number(variant.stock) < 0) {
          throw new Error(`Variant ${index + 1} must have valid stock`);
        }
      });
      return true;
    }),
  body("tags")
    .optional()
    .custom((value) => {
      const result = parsed("tags", value);
      if (!Array.isArray(result)) {
        throw new Error("Tags must be an array");
      }
      return true;
    }),
  body("weightInGrams")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Weight must be a positive number"),
  body("dimensions")
    .optional()
    .custom((value) => {
      const result = parsed("dimensions", value);
      if (result.length < 0 || result.width < 0 || result.height < 0) {
        throw new Error("Dimensions must be positive numbers");
      }
      return true;
    }),
  body("status")
    .optional()
    .isIn(["draft", "published", "archived"])
    .withMessage("Invalid product status"),
  body().custom((_, { req }) => {
    if (!req.files || req.files.length === 0) {
      throw new Error("Product images are required");
    }
    const thumbnail = req.files.find((file) => file.fieldname === "thumbnail");
    if (!thumbnail) {
      throw new Error("Product thumbnail is required");
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    req.files.forEach((file) => {
      if (!allowedTypes.includes(file.mimetype)) {
        throw new Error(
          `Invalid file type for ${file.fieldname}. Only jpg, png, webp allowed`,
        );
      }
      const match = file.fieldname.match(/^variant_images\[(\d+)\]$/);
      if (file.fieldname !== "thumbnail" && !match) {
        throw new Error(`Invalid image field name: ${file.fieldname}`);
      }
    });
    return true;
  }),
];

exports.getProductDetailsValidator = [
  param("id")
    .notEmpty()
    .withMessage("Product ID is required")
    .bail()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid product ID"),
];

exports.getAllProductsValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive number"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("sort").optional().isString().withMessage("Sort must be a string"),
  query("search")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search must be between 1 and 100 characters"),
  query("status")
    .optional()
    .isIn(["active", "inactive", "draft"])
    .withMessage("Invalid status value"),
  query("categoryPath")
    .optional()
    .isArray()
    .withMessage("categoryPath must be an array of category IDs"),
  query("categoryPath.*")
    .optional()
    .isMongoId()
    .withMessage("Invalid category ID"),
  query("tags").optional().isArray().withMessage("Tags must be an array"),
  query("tags.*")
    .optional()
    .isString()
    .trim()
    .withMessage("Each tag must be a string"),
  query("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be true or false"),
  query("isNewArrival")
    .optional()
    .isBoolean()
    .withMessage("isNewArrival must be true or false"),
  query("isSignature")
    .optional()
    .isBoolean()
    .withMessage("isSignature must be true or false"),
  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("minPrice must be a positive number"),
  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("maxPrice must be a positive number"),
  query("inStock")
    .optional()
    .isBoolean()
    .withMessage("inStock must be true or false"),
];

exports.updateProductValidator = [
  param("id")
    .notEmpty()
    .withMessage("Product ID is required")
    .bail()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid product ID"),
  body("name")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Product name cannot exceed 300 characters"),
];
