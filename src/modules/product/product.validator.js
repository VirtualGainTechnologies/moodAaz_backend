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
    .isMongoId()
    .withMessage("Invalid category ID"),
  body("brand")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Brand cannot exceed 100 characters"),
  body("manufacturer")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Manufacturer cannot exceed 200 characters"),
  body("countryOfOrigin")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Country of origin cannot exceed 100 characters"),
  body("warranty")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Warranty cannot exceed 100 characters"),
  body("careInstructions")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Care instructions too long"),
  body("attributes")
    .optional()
    .custom((value) => {
      parsed("Attributes", value);
      return true;
    }),
  body("variants")
    .notEmpty()
    .withMessage("Variants are required")
    .custom((value) => {
      const variants = parsed("Variants", value);
      if (!Array.isArray(variants) || variants.length === 0) {
        throw new Error("At least one variant is required");
      }
      variants.forEach((variant, index) => {
        if (!variant.price) {
          throw new Error(`Variant price missing at index ${index}`);
        }
        if (variant.sale_price && variant.sale_price >= variant.price) {
          throw new Error(
            `Sale price must be less than price at variant index ${index}`,
          );
        }
        if (!variant.attributes || typeof variant.attributes !== "object") {
          throw new Error(`Variant attributes missing at index ${index}`);
        }
      });
      return true;
    }),
  body("imageAttribute")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Image attribute must be valid"),
  body("tags")
    .optional()
    .custom((value) => {
      const tags = parsed("Tags", value);
      if (!Array.isArray(tags)) {
        throw new Error("Tags must be an array");
      }
      return true;
    }),
  body("seo")
    .optional()
    .custom((value) => {
      parsed("Tags", value);
      return true;
    }),
  body("status")
    .optional()
    .isIn(["ACTIVE", "INACTIVE", "OUT_OF_STOCK", "DRAFT", "ARCHIVED"])
    .withMessage("Invalid status"),
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
    .isIn(["ACTIVE", "INACTIVE", "OUT_OF_STOCK", "DRAFT", "ARCHIVED"])
    .withMessage("Invalid status value"),
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
