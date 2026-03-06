const { body } = require("express-validator");

// REGISTER SEND OTP
exports.registerOtpSendValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("phone")
    .optional()
    .isNumeric().withMessage("Phone number must contain only numbers")
    .isLength({ min: 10, max: 10 }).withMessage("Phone number must be exactly 10 digits"),
];

//REGISTER VERIFY OTP
exports.registerOtpVerifyValidator = [
  body("otpId")
    .notEmpty()
    .withMessage("OTP ID is required")
    .isMongoId()
    .withMessage("OTP ID must be a valid Mongo ID"),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("otp")
    .notEmpty()
    .withMessage("OTP is required"),

  body("first_name")
    .notEmpty()
    .withMessage("First name is required"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  // phone validation
  body("phone")
    .optional()
    .isNumeric().withMessage("Phone number must contain only numbers")
    .isLength({ min: 10, max: 10 }).withMessage("Phone number must be exactly 10 digits"),
];

// LOGIN SEND OTP
exports.loginOtpSendValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
];

// LOGIN VERIFY OTP
exports.loginOtpVerifyValidator = [
  body("otpId")
    .notEmpty()
    .withMessage("OTP ID is required")
    .isMongoId()
    .withMessage("OTP ID must be a valid Mongo ID"),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("otp")
    .notEmpty()
    .withMessage("OTP is required"),
];