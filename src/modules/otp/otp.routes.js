const router = require("express").Router();

const { catchAsync } = require("../../utils/catchAsync");
const { resendOtp } = require("./otp.controller");
const { resendOtpValidator } = require("./otp.validator");

router.post(
  "/resend",
  resendOtpValidator,
  catchAsync("resendOtp api", resendOtp),
);

module.exports = router;
