const router = require("express").Router();

const {
  getIpAndLocation,
  authenticate,
  authorize,
} = require("../../middlewares");
const { catchAsync } = require("../../utils/catch-async");
const {
  initiateAuthentication,
  verifyAuthentication,
  checkAuth,
  logout,
  getUserProfile,
  updateUserProfile,
  sendContactUpdateOtp,
  verifyContactUpdateOtp,
} = require("./user.controller");
const {
  initiateAuthenticationValidator,
  verifyAuthenticationValidator,
  updateUserProfileValidator,
  sendContactUpdateOtpValidator,
  verifyContactUpdateOtpValidator,
} = require("./user.validator");

// AUTH
router.post(
  "/auth/initiate",
  initiateAuthenticationValidator,
  catchAsync("getIpAndLocation middleware", getIpAndLocation),
  catchAsync("initiateAuthentication api", initiateAuthentication),
);
router.post(
  "/auth/verify",
  verifyAuthenticationValidator,
  catchAsync("getIpAndLocation middleware", getIpAndLocation),
  catchAsync("verifyAuthentication api", verifyAuthentication),
);
router.get("/auth/check", catchAsync("checkAuth api", checkAuth));
router.post("/auth/logout", authenticate, catchAsync("logout api", logout));

// PROFILE
router.get(
  "/profile",
  authenticate,
  authorize("USER"),
  catchAsync("getUserProfile api", getUserProfile),
);
router.put(
  "/profile/update",
  authenticate,
  authorize("USER"),
  updateUserProfileValidator,
  catchAsync("updateUserProfile api", updateUserProfile),
);

router.post(
  "/contact/send-otp",
  authenticate,
  authorize("USER"),
  sendContactUpdateOtpValidator,
  catchAsync("getIpAndLocation middleware", getIpAndLocation),
  catchAsync("sendContactUpdateOtp api", sendContactUpdateOtp),
);

router.post(
  "/contact/verify-otp",
  authenticate,
  authorize("USER"),
  verifyContactUpdateOtpValidator,
  catchAsync("getIpAndLocation middleware", getIpAndLocation),
  catchAsync("verifyContactUpdateOtp api", verifyContactUpdateOtp),
);

module.exports = router;
