const { body } = require("express-validator");
const validator = require("validator");

exports.initiateAuthenticationValidator = [
  body("identifier")
    .notEmpty()
    .withMessage("Email or mobile number is required")
    .custom((value) => {
      if (!validator.isEmail(value) && !validator.isMobilePhone(value, "any")) {
        throw new Error("Identifier must be a valid email or mobile number");
      }
      return true;
    }),
];

exports.verifyAuthenticationValidator = [
  ...this.initiateAuthenticationValidator,
  body("otpId")
    .notEmpty()
    .withMessage("OTP id is required")
    .isMongoId()
    .withMessage("Invalid OTP id"),
  body("otp")
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be exactly 6 digits"),
  body("authType")
    .notEmpty()
    .withMessage("Auth type is missing")
    .isIn(["REGISTER", "LOGIN"])
    .withMessage("Invalid auth type"),
];

exports.updateUserProfileValidator = [
  body("first_name")
    .optional()
    .isString()
    .trim()
    .withMessage("First name must be a string"),
  body("last_name")
    .optional()
    .isString()
    .trim()
    .withMessage("Last name must be a string"),
  body("gender")
    .optional()
    .isIn(["MALE", "FEMALE", "OTHER"])
    .withMessage("Invalid gender"),
];
