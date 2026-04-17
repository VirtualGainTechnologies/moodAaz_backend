const router = require("express").Router();

const { authenticate, getIpAndLocation } = require("../../middlewares");
const { catchAsync } = require("../../utils/catch-async");

const {
  initiateAuthentication,
  verifyAuthentication,
  checkAuth,
  logout,
  updateEmail,
  verifyEmail,
  updatePhone,
  verifyPhone,
  addAddress,
  updateAddress,
  updateProfile, 
} = require("./user.controller");

const {
  initiateAuthenticationValidator,
  verifyAuthenticationValidator,
  updateEmailValidator,
  verifyEmailValidator,
  updatePhoneValidator,
  verifyPhoneValidator,
  addAddressValidator,
  updateAddressValidator,
  updateBasicDetailsValidator, 
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

// profile update
router.post(
  "/profile/update",
  authenticate,
  updateBasicDetailsValidator,
  catchAsync("update profile", updateProfile)
);

// EMAIL
router.post(
  "/contact/email/update",
  authenticate,
  updateEmailValidator,
  catchAsync("update email", updateEmail)
);

router.post(
  "/contact/email/verify",
  authenticate,
  verifyEmailValidator,
  catchAsync("verify email", verifyEmail)
);

// PHONE
router.post(
  "/contact/phone/update",
  authenticate,
  updatePhoneValidator,
  catchAsync("update phone", updatePhone)
);

router.post(
  "/contact/phone/verify",
  authenticate,
  verifyPhoneValidator,
  catchAsync("verify phone", verifyPhone)
);

// ADDRESS
router.post(
  "/profile/address/add",
  authenticate,
  addAddressValidator,
  catchAsync("add address", addAddress)
);

router.post(
  "/profile/address/update",
  authenticate,
  updateAddressValidator,
  catchAsync("update address", updateAddress)
);

router.get(
  "/auth/check", 
  catchAsync("check auth", checkAuth));

router.post(
  "/auth/logout",
  authenticate,
  catchAsync("logout", logout)
);

module.exports = router;