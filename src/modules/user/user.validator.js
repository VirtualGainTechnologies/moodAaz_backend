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

// Email

exports.updateEmailValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .trim(),
];

exports.verifyEmailValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
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

// Phone

exports.updatePhoneValidator = [
  body("identifier")
    .notEmpty()
    .withMessage("Phone number is required")
    .trim()
    .custom((value) => {
      if (!validator.isMobilePhone(value, "any")) {
        throw new Error("Invalid phone number");
      }
      return true;
    }),
];

exports.verifyPhoneValidator = [
  body("identifier")
    .notEmpty()
    .withMessage("Phone number is required")
    .trim()
    .custom((value) => {
      if (!validator.isMobilePhone(value, "any")) {
        throw new Error("Invalid phone number");
      }
      return true;
    }),

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

// ADDRESS

exports.addAddressValidator = [
  body("street")
    .notEmpty()
    .withMessage("Street is required")
    .trim(),

  body("city")
    .notEmpty()
    .withMessage("City is required")
    .trim(),

  body("state")
    .notEmpty()
    .withMessage("State is required")
    .trim(),

  body("country")
    .notEmpty()
    .withMessage("Country is required")
    .trim(),

  body("zipCode")
    .notEmpty()
    .withMessage("Zip code is required")
    .trim(),
];

exports.updateAddressValidator = [
  body("street").optional().isString().trim(),
  body("city").optional().isString().trim(),
  body("state").optional().isString().trim(),
  body("country").optional().isString().trim(),
  body("zipCode").optional().isString().trim(),
];