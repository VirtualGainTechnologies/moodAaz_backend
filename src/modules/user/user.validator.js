const { body } = require("express-validator");
const validator = require("validator");

// AUTH
const initiateAuthenticationValidator = [
  body("identifier")
    .notEmpty()
    .withMessage("Email or mobile number is required")
    .custom((value) => {
      if (
        !validator.isEmail(value) &&
        !validator.isMobilePhone(value, "any")
      ) {
        throw new Error("Identifier must be a valid email or mobile number");
      }
      return true;
    }),
];

exports.initiateAuthenticationValidator = initiateAuthenticationValidator;

exports.verifyAuthenticationValidator = [
  ...initiateAuthenticationValidator,

  body("otpId")
    .notEmpty()
    .withMessage("OTP id is required")
    .isMongoId()
    .withMessage("Invalid OTP id"),

  body("otp")
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("OTP must be exactly 6 digits"),

  body("authType")
    .notEmpty()
    .withMessage("Auth type is missing")
    .isIn(["REGISTER", "LOGIN"])
    .withMessage("Invalid auth type"),
];

// PROFILE DETAILS
exports.addBasicDetailsValidator = [
  body("first_name")
    .notEmpty()
    .withMessage("First name is required")
    .isString()
    .trim(),

  body("last_name")
    .notEmpty()
    .withMessage("Last name is required")
    .isString()
    .trim(),

  body("gender")
    .notEmpty()
    .withMessage("Gender is required")
    .isIn(["male", "female", "other"])
    .withMessage("Invalid gender"),
];

exports.updateBasicDetailsValidator = [
  body("firstName").optional().isString().trim(),
  body("lastName").optional().isString().trim(),
  body("gender")
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("Invalid gender"),
];

// CONTACT 
exports.contactOtpValidator = [
  body("type")
    .notEmpty()
    .withMessage("Type is required")
    .isIn(["email", "phone"])
    .withMessage("Type must be email or phone"),

  body("value")
    .notEmpty()
    .withMessage("Value is required")
    .trim()
];

exports.verifyContactOtpValidator = [
  body("type")
    .notEmpty()
    .withMessage("Type is required")
    .isIn(["email", "phone"])
    .withMessage("Type must be email or phone"),

  body("value")
    .notEmpty()
    .withMessage("Value is required")
    .trim(),

  body("otpId")
    .notEmpty()
    .withMessage("OTP id is required")
    .isMongoId()
    .withMessage("Invalid OTP id"),

  body("otp")
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("OTP must be exactly 6 digits"),
];
