const router = require("express").Router();

const { getIpAndLocation } = require("../../middlewares");
const { catchAsync } = require("../../utils/catch-async");
const { authenticate, authorize } = require("../../middlewares");
const {
  initiateAuthentication,
  verifyAuthentication,
  updateUser,
} = require("./user.controller");
const {
  initiateAuthenticationValidator,
  verifyAuthenticationValidator,
  updateUserValidator,
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
router.put(
  "/update",
  authenticate,
  authorize("USER"),
  updateUserValidator,
  catchAsync("updateUser api", updateUser)
);

module.exports = router;