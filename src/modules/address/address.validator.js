const { body, param } = require("express-validator");

exports.addressIdValidator = [
  param("id")
    .notEmpty()
    .withMessage("Address ID is required")
    .isMongoId()
    .withMessage("Invalid address ID"),
];

exports.addAddressValidator = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Full name must be between 2 and 50 characters")
    .isAlpha("en-US", { ignore: " " })
    .withMessage("Full name must contain only letters"),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Enter a valid 10-digit Indian mobile number"),
  body("line1")
    .trim()
    .notEmpty()
    .withMessage("Address line 1 is required")
    .isLength({ min: 5, max: 100 })
    .withMessage("Address line 1 must be between 5 and 100 characters"),
  body("line2")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Address line 2 must be at most 100 characters"),
  body("city")
    .trim()
    .notEmpty()
    .withMessage("City is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("City must be between 2 and 50 characters"),
  body("state")
    .trim()
    .notEmpty()
    .withMessage("State is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("State must be between 2 and 50 characters"),
  body("pincode")
    .trim()
    .notEmpty()
    .withMessage("Pincode is required")
    .matches(/^\d{6}$/)
    .withMessage("Pincode must be exactly 6 digits"),
  body("country")
    .optional()
    .trim()
    .isLength({ min: 2, max: 56 })
    .withMessage("Enter a valid country name"),
  body("label")
    .optional()
    .trim()
    .isIn(["HOME", "WORK", "OTHER"])
    .withMessage("Label must be one of: HOME, WORK, OTHER"),
  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean")
    .toBoolean(),
];

exports.updateAddressValidator = [
  param("id")
    .notEmpty()
    .withMessage("Address ID is required")
    .isMongoId()
    .withMessage("Invalid address ID"),
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Full name must be between 2 and 50 characters"),
  body("phone")
    .optional()
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Enter a valid 10-digit Indian mobile number"),
  body("line1")
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage("Address line 1 must be between 5 and 100 characters"),
  body("line2")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Address line 2 must be at most 100 characters"),
  body("city")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("City must be between 2 and 50 characters"),
  body("state")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("State must be between 2 and 50 characters"),
  body("pincode")
    .optional()
    .trim()
    .matches(/^\d{6}$/)
    .withMessage("Pincode must be exactly 6 digits"),
  body("country")
    .optional()
    .trim()
    .isLength({ min: 2, max: 56 })
    .withMessage("Enter a valid country name"),
  body("label")
    .optional()
    .trim()
    .isIn(["HOME", "WORK", "OTHER"])
    .withMessage("Label must be one of: HOME, WORK, OTHER"),
  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean")
    .toBoolean(),
  body().custom((body) => {
    const allowed = [
      "fullName",
      "phone",
      "line1",
      "line2",
      "city",
      "state",
      "pincode",
      "country",
      "label",
      "isDefault",
    ];
    const hasAtLeastOne = allowed.some((key) => body[key] !== undefined);
    if (!hasAtLeastOne)
      throw new Error("At least one field is required to update");
    return true;
  }),
];
