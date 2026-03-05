const router = require("express").Router();
const { catchAsync } = require("../../utils/catchAsync");

const {
  registerSendOtp,
  registerVerifyOtp,
  loginSendOtp,
  loginVerifyOtp,
} = require("./user.controller");

const {
  registerOtpSendValidator,
  registerOtpVerifyValidator,
  loginOtpSendValidator,
  loginOtpVerifyValidator,
} = require("./user.validator");

// OTP-Based Routes
router.post(
  "/register/send-otp",
  registerOtpSendValidator,
  catchAsync("register send otp", registerSendOtp)
);

router.post(
  "/register/verify-otp",
  registerOtpVerifyValidator,
  catchAsync("register verify otp", registerVerifyOtp)
);

router.post(
  "/login/send-otp",
  loginOtpSendValidator,
  catchAsync("login send otp", loginSendOtp)
);

router.post(
  "/login/verify-otp",
  loginOtpVerifyValidator,
  catchAsync("login verify otp", loginVerifyOtp)
);

module.exports = router;