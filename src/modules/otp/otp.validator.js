const { body } = require("express-validator");

exports.resendOtpValidator = [
  body("type")
    .notEmpty()
    .withMessage("Type is required")
    .isIn(["email", "phone"])
    .withMessage("Type must be email or phone"),

  body("email")
    .if(body("type").equals("email"))
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email"),

  body("emailOtpType")
    .if(body("type").equals("email"))
    .notEmpty()
    .withMessage("Email OTP type is required"),

  body("phone")
    .if(body("type").equals("phone"))
    .notEmpty()
    .withMessage("Phone is required")
    .isNumeric()
    .withMessage("Phone must be numeric"),

  body("phoneCode")
    .if(body("type").equals("phone"))
    .notEmpty()
    .withMessage("Phone code is required"),
];