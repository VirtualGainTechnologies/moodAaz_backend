const { body } = require("express-validator");


// Register Validator

exports.registerValidator = [
  body("first_name")
    .notEmpty()
    .withMessage("First name is required")
    .trim(),
  
  body("last_name")
    .optional()
    .trim(),
  
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .notEmpty()
    .withMessage("Email is required"),
  
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .trim()
    .notEmpty()
    .withMessage("Password is required"),
  
  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Please provide a valid phone number")
    .trim(),
  
  body("address.street").optional().trim(),
  body("address.city").optional().trim(),
  body("address.state").optional().trim(),
  body("address.zip").optional().trim(),
  body("address.country").optional().trim(),
];


// Login Validator

exports.loginValidator = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .notEmpty()
    .withMessage("Email is required"),
  
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .trim(),
];
