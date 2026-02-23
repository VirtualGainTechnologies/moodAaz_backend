const router = require("express").Router();

const {
  authenticate,
  authorize,
  getIpAndLocation,
} = require("../../middlewares");
const { catchAsync } = require("../../utils/catchAsync");
const {
  registerSuperAdmin,
  upsertSubAdmin,
  sendLoginOtp,
  verifyLoginOtp,
  getAdminProfile,
  logout,
} = require("./admin.controller");
const {
  registerSuperAdminValidator,
  upsertSubAdminValidator,
  sendLoginOtpValidator,
  verifyLoginOtpValidator,
} = require("./admin.validator");

// AUTH
router.post(
  "/auth/register-super-admin",
  registerSuperAdminValidator,
  catchAsync("getIpAndLocation middleware", getIpAndLocation),
  catchAsync("registerSuperAdmin api", registerSuperAdmin),
);

router.post(
  "/auth/upsert-sub-admin",
  authenticate,
  authorize("SUPER-ADMIN"),
  upsertSubAdminValidator,
  catchAsync("getIpAndLocation middleware", getIpAndLocation),
  catchAsync("upsertSubAdmin api", upsertSubAdmin),
);

router.post(
  "/auth/login/send-otp",
  sendLoginOtpValidator,
  catchAsync("sendLoginOtp api", sendLoginOtp),
);

router.post(
  "/auth/login/verify-otp",
  verifyLoginOtpValidator,
  catchAsync("getIpAndLocation middleware", getIpAndLocation),
  catchAsync("verifyLoginOtp api", verifyLoginOtp),
);

router.get(
  "/auth/profile",
  authenticate,
  catchAsync("getAdminProfile api", getAdminProfile),
);

router.post("/auth/logout", authenticate, catchAsync("logout api", logout));

// PASSWORD
// router.post("/forgot-password/send-otp");
// router.post("/forgot-password/verify-otp");
// router.post("/forgot-password/reset");

module.exports = router;
