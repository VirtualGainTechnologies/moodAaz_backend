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
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters")
    .matches(/^[A-Za-z\s]+$/)
    .withMessage("Full name must contain only letters and spaces"),
  body("mobileNumber")
    .trim()
    .notEmpty()
    .withMessage("Mobile number is required")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Enter a valid 10-digit Indian mobile number"),
  body("alternateContact")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Enter a valid alternate contact number"),
  body("locallity")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage("Locality cannot exceed 150 characters"),
  body("fullAddress")
    .trim()
    .notEmpty()
    .withMessage("Full address is required")
    .isLength({ min: 5, max: 300 })
    .withMessage("Address must be between 5 and 300 characters"),
  body("landmark")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage("Landmark cannot exceed 150 characters"),
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
  body("pinCode")
    .trim()
    .notEmpty()
    .withMessage("Pincode is required")
    .matches(/^\d{6}$/)
    .withMessage("Pincode must be exactly 6 digits"),
  body("addressType")
    .trim()
    .notEmpty()
    .withMessage("Address type is required")
    .isIn(["HOME", "WORK", "OTHER"])
    .withMessage("Address type must be one of: HOME, WORK, OTHER"),
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
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),
  body("mobileNumber")
    .optional()
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Enter a valid mobile number"),
  body("alternateContact")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Enter a valid alternate contact number"),
  body("locallity")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage("Locality cannot exceed 150 characters"),
  body("fullAddress")
    .optional()
    .trim()
    .isLength({ min: 5, max: 300 })
    .withMessage("Address must be between 5 and 300 characters"),
  body("landmark")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage("Landmark cannot exceed 150 characters"),
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
  body("pinCode")
    .optional()
    .trim()
    .matches(/^\d{6}$/)
    .withMessage("Invalid pincode"),
  body("addressType")
    .optional()
    .trim()
    .isIn(["HOME", "WORK", "OTHER"])
    .withMessage("Invalid address type"),
  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean")
    .toBoolean(),
  body("country")
    .optional()
    .trim()
    .isLength({ min: 2, max: 56 })
    .withMessage("Enter a valid country name"),
  body().custom((body) => {
    const allowed = [
      "fullName",
      "mobileNumber",
      "alternateContact",
      "locallity",
      "fullAddress",
      "landmark",
      "city",
      "state",
      "pinCode",
      "addressType",
      "isDefault"
    ];

    const hasAtLeastOne = allowed.some((key) => body[key] !== undefined);

    if (!hasAtLeastOne) {
      throw new Error("At least one field is required to update");
    }

    return true;
  }),
];
