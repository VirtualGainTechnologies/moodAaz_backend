const router = require("express").Router();
const { getIpAndLocation, authenticate, authorize } = require("../../middlewares");
const { catchAsync } = require("../../utils/catch-async");
const {
  initiateAuthentication,
  verifyAuthentication,
  updateUser,
  initiateContactUpdate,
  verifyContactUpdate,
  checkLogin,
  logout,
} = require("./user.controller");
const {
  initiateAuthenticationValidator,
  verifyAuthenticationValidator,
  updateUserValidator,
  initiateContactUpdateValidator,
  verifyContactUpdateValidator,
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
router.post(
  "/update/contact/initiate",
  authenticate,
  authorize("USER"),
  initiateContactUpdateValidator,
  catchAsync("initiateContactUpdate api", initiateContactUpdate)
);
router.post(
  "/update/contact/verify",
  authenticate,
  authorize("USER"),
  verifyContactUpdateValidator,
  catchAsync("verifyContactUpdate api", verifyContactUpdate)
);

router.get(
  "/check",
  catchAsync("checkLogin api", checkLogin)
);

router.post(
  "/auth/logout",
  catchAsync("logout api", logout)
);
module.exports = router;