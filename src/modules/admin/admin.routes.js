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
  logout,
} = require("./admin.controller");
const {
  registerSuperAdminValidator,
  upsertSubAdminValidator,
  sendLoginOtpValidator,
  verifyLoginOtpValidator,
} = require("./admin.validator");

// REGISTER
router.post(
  "/register-super-admin",
  registerSuperAdminValidator,
  catchAsync("getIpAndLocation middleware", getIpAndLocation),
  catchAsync("registerSuperAdmin api", registerSuperAdmin),
);

// UPSERT SUB ADMIN
router.post(
  "/upsert-sub-admin",
  authenticate,
  authorize("SUPER-ADMIN"),
  upsertSubAdminValidator,
  catchAsync("getIpAndLocation middleware", getIpAndLocation),
  catchAsync("upsertSubAdmin api", upsertSubAdmin),
);

// LOGIN
router
  .post(
    "/login/send-otp",
    sendLoginOtpValidator,
    catchAsync("sendLoginOtp api", sendLoginOtp),
  )
  .post(
    "/login/verify-otp",
    verifyLoginOtpValidator,
    catchAsync("getIpAndLocation middleware", getIpAndLocation),
    catchAsync("verifyLoginOtp api", verifyLoginOtp),
  );

// LOGOUT
router.post("/logout", authenticate, catchAsync("logout api", logout));

module.exports = router;
