const router = require("express").Router();

const { authenticate, getIpAndLocation } = require("../../middlewares");
const { catchAsync } = require("../../utils/catch-async");

const {
  initiateAuthentication,
  verifyAuthentication,
  checkAuth,
  logout,
  updateProfile,
  sendContactUpdateOtp,
  verifyContactUpdateOtp,
} = require("./user.controller");

const {
  initiateAuthenticationValidator,
  verifyAuthenticationValidator,
  updateBasicDetailsValidator,
  contactOtpValidator,
  verifyContactOtpValidator,
} = require("./user.validator");

// AUTH
router.post(
  "/auth/initiate",
  initiateAuthenticationValidator,
  catchAsync("init auth", getIpAndLocation),
  catchAsync("init auth", initiateAuthentication)
);

router.post(
  "/auth/verify",
  verifyAuthenticationValidator,
  catchAsync("verify auth", getIpAndLocation),
  catchAsync("verify auth", verifyAuthentication)
);

// PROFILE
router.post(
  "/profile/update",
  authenticate,
  updateBasicDetailsValidator,
  catchAsync("update profile", updateProfile)
);

// CONTACT
router.post(
  "/contact/send-otp",
  authenticate,
  contactOtpValidator,
  catchAsync("send contact otp", sendContactUpdateOtp)
);

router.post(
  "/contact/verify-otp",
  authenticate,
  verifyContactOtpValidator,
  catchAsync("verify contact otp", verifyContactUpdateOtp)
);

// AUTH CHECK
router.get(
  "/auth/check", 
  catchAsync("check auth", checkAuth));

router.post(
  "/auth/logout",
  authenticate,
  catchAsync("logout", logout)
);

module.exports = router;