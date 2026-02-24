const { body, query } = require("express-validator");

// AUTH
exports.registerSuperAdminValidator = [
  body("userName")
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ max: 15 })
    .withMessage("Username must not exceed 15 characters"),
  body("phoneCode").notEmpty().withMessage("Phone code is required"),
  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .custom((val) => {
      if (!/^[6-9]{1}[0-9]{9}$/.test(val)) {
        throw new Error("Invalid phone number");
      }
      return true;
    }),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .toLowerCase(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
];

exports.upsertSubAdminValidator = [
  body("userName").notEmpty().withMessage("Username is required"),
  body("phoneCode").notEmpty().withMessage("Phone code is required"),
  body("phone").notEmpty().withMessage("Phone number is required"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .toLowerCase(),
  body("password")
    .optional()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["SUB-ADMIN-LEVEL-1", "SUB-ADMIN-LEVEL-2", "SUB-ADMIN-LEVEL-3"])
    .withMessage("Invalid sub-admin role"),
  body("userId").optional().isMongoId().withMessage("Invalid user ID"),
];

exports.sendLoginOtpValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .toLowerCase(),
  body("password").notEmpty().withMessage("Password is required"),
];

exports.verifyLoginOtpValidator = [
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
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .toLowerCase(),
];

exports.getAllSubAdminsValidator = [
  query("role")
    .notEmpty()
    .isIn([
      "SUB-ADMIN-LEVEL-1",
      "SUB-ADMIN-LEVEL-2",
      "SUB-ADMIN-LEVEL-3",
      "ALL",
    ]),
  query("email").optional().toLowerCase(),
];


// Forgot Password - Send OTP
exports.forgotPasswordSendOtpValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .toLowerCase(),
];

// Verify Forgot Password OTP
exports.verifyForgotPasswordOtpValidator = [
  body("otpId")
    .notEmpty()
    .withMessage("OTP id is required")
    .isMongoId()
    .withMessage("Invalid OTP id"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .toLowerCase(),
  body("otp")
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be exactly 6 digits")
    .matches(/^\d+$/)
    .withMessage("OTP must contain only digits"),
];

// Reset Password
exports.resetPasswordValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .toLowerCase(),
  body("password")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[\W_]/)
    .withMessage("Password must contain at least one special character"),
];
