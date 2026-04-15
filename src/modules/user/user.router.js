const router = require("express").Router();

const { getIpAndLocation, authenticate } = require("../../middlewares");
const { catchAsync } = require("../../utils/catch-async");
const {
  initiateAuthentication,
  verifyAuthentication,
  checkAuth,
  logout,
} = require("./user.controller");
const {
  initiateAuthenticationValidator,
  verifyAuthenticationValidator,
} = require("./user.validator");

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
module.exports = router;
