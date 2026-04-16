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
} = require("./user.controller");
const {
  initiateAuthenticationValidator,
  verifyAuthenticationValidator,
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
module.exports = router;
