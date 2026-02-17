const router = require("express").Router();
const { body } = require("express-validator");

const { catchAsync } = require("../../utils/catchAsync");
const { resendOtp } = require("../../controllers/shared/otpController");

const resendOtpValidator = [
  body("email")
    .notEmpty()
    .withMessage("Please provide email id")
    .trim()
    .isEmail()
    .withMessage("Invalid email id")
    .toLowerCase(),
  body("type")
    .notEmpty()
    .withMessage("The field type is missing")
];

router.post("/", resendOtpValidator, catchAsync("resendOtp api", resendOtp));

module.exports = router;
