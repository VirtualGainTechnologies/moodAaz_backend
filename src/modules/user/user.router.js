const router = require("express").Router();

const { getIpAndLocation } = require("../../middlewares");
const { catchAsync } = require("../../utils/catch-async");
const {
  initiateAuthentication,
  verifyAuthentication,
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

module.exports = router;
