const router = require("express").Router();
const { body, query } = require("express-validator");

const {
  validateAdmin,
  registerSuperAdmin,
  sendAdminLoginOtp,
  verifyAdminLoginOtp,
  upsertSubAdmin,
  getAllSubAdmins,
  getAdminProfile,
  logout,
} = require("../../controllers/admin/authController");
const {
  checkAdminLoginAttempts,
} = require("../../middlewares/admin/adminLoginAttempts");
const {
  getIpAndLocation,
} = require("../../middlewares/shared/ipLocationMiddleware");
const {
  verifyAdminToken,
} = require("../../middlewares/admin/verifyAdminToken");
const { catchAsync } = require("../../utils/catchAsync");

const validateAdminValidator = [
  body("email").optional({ nullable: true, checkFalsy: true }).toLowerCase(),
  body("phone")
    .optional({ nullable: true, checkFalsy: true })
    .custom(async (val, { req }) => {
      if (/^[6-9]{1}[0-9]{9}$/.test(val)) {
        return true;
      } else {
        throw new Error("Invalid phone number");
      }
    }),
];

const superAdminRegistrationBodyValidator = [
  body("userName")
    .notEmpty()
    .trim()
    .withMessage("The field userName is required")
    .isLength({ max: 15 })
    .withMessage("The field userName must be at most 15 characters"),
  body("phoneCode")
    .notEmpty()
    .trim()
    .withMessage("The field  phoneCode is required"),
  body("phone")
    .notEmpty()
    .trim()
    .withMessage("The field phone is required")
    .custom(async (val, { req }) => {
      const isIndian = /^[6-9]{1}[0-9]{9}$/.test(val);
      if (!isIndian) {
        throw new Error("Invalid phone number");
      }

      return true;
    }),
  body("email")
    .notEmpty()
    .trim()
    .withMessage("The field email is required")
    .isEmail()
    .withMessage("Invalid email id")
    .toLowerCase(),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("The field password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .custom((value) => {
      const regex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]\\|:;'<>,.?/])[a-zA-Z\d!@#$%^&*()_\-+={}[\]\\|:;'<>,.?/]{8,}$/;
      if (!regex.test(value)) {
        throw new Error(
          "Password must contain at least one uppercase letter, one lowercase letter, one special character and one number",
        );
      } else {
        return true;
      }
    }),
];

const adminLoginBodyValidator = [
  body("email")
    .notEmpty()
    .withMessage("The field email is required")
    .trim()
    .isEmail()
    .withMessage("Invalid email id")
    .toLowerCase(),
  body("password")
    .notEmpty()
    .trim()
    .withMessage("The field password is required"),
];

const verifyOtpAfterAdminLoginBodyValidator = [
  body("otpId").notEmpty().trim().withMessage("The field otpId is required"),
  body("otp")
    .notEmpty()
    .trim()
    .withMessage("The field otp is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be of 6 digit"),
  ...adminLoginBodyValidator,
];

const upsertSubAdminBodyValidator = [
  body("userName")
    .notEmpty()
    .trim()
    .withMessage("The field userName is required")
    .isLength({ max: 15 })
    .withMessage("The field userName must be at most 15 characters"),
  body("phoneCode")
    .notEmpty()
    .trim()
    .withMessage("The field  phoneCode is required"),
  body("phone")
    .notEmpty()
    .trim()
    .withMessage("The field phone is required")
    .custom(async (val, { req }) => {
      const isIndian = /^[6-9]{1}[0-9]{9}$/.test(val);
      if (!isIndian) {
        throw new Error("Invalid phone number");
      }

      return true;
    }),
  body("email")
    .notEmpty()
    .trim()
    .withMessage("The field email is required")
    .isEmail()
    .withMessage("Invalid email id")
    .toLowerCase(),
  body("password")
    .trim()
    .optional()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .custom((value) => {
      const regex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]\\|:;'<>,.?/])[a-zA-Z\d!@#$%^&*()_\-+={}[\]\\|:;'<>,.?/]{8,}$/;
      if (!regex.test(value)) {
        throw new Error(
          "Password must contain at least one uppercase letter, one lowercase letter, one special character and one number",
        );
      } else {
        return true;
      }
    }),
  body("role")
    .notEmpty()
    .trim()
    .withMessage("The field role is required")
    .isIn(["SUB-ADMIN-LEVEL-1", "SUB-ADMIN-LEVEL-2", "SUB-ADMIN-LEVEL-3"])
    .withMessage("Choose the valid role"),
  body("userId")
    .optional()
    .isMongoId()
    .withMessage("The filed userId must be a valid MongoDB ObjectId"),
];

const getAllSubAdminsQueryValidator = [
  query("role")
    .notEmpty()
    .withMessage("The field role is missing")
    .isIn([
      "SUB-ADMIN-LEVEL-1",
      "SUB-ADMIN-LEVEL-2",
      "SUB-ADMIN-LEVEL-3",
      "ALL",
    ])
    .withMessage("Invalid role value"),
  query("email").optional({ nullable: true, checkFalsy: true }).toLowerCase(),
];

// registration
router.post(
  "/admin-registration",
  superAdminRegistrationBodyValidator,
  catchAsync("getIpAndLocation middleware", getIpAndLocation),
  catchAsync("registerSuperAdmin", registerSuperAdmin),
);

// upsert sub-admin
router.post(
  "/upsert-sub-admin",
  upsertSubAdminBodyValidator,
  catchAsync("getIpAndLocation middleware", getIpAndLocation),
  catchAsync("verifyAdminToken middleware", verifyAdminToken),
  catchAsync("upsertSubAdmin api", upsertSubAdmin),
);

// login
router
  .post(
    "/send-login-otp",
    adminLoginBodyValidator,
    catchAsync("checkAdminLoginAttempts middleware", checkAdminLoginAttempts),
    catchAsync("sendAdminLoginOtp", sendAdminLoginOtp),
  )
  .post(
    "/login",
    verifyOtpAfterAdminLoginBodyValidator,
    catchAsync("getIpAndLocation middleware", getIpAndLocation),
    catchAsync("verifyAdminLoginOtp", verifyAdminLoginOtp),
  );

// logout
router.get("/logout", catchAsync("logout api", logout));

// profile
router.get(
  "/get-admin-profile",
  catchAsync("getAdminProfile api", getAdminProfile),
);

// get all subadmins
router.get(
  "/get-all-sub-admins",
  getAllSubAdminsQueryValidator,
  catchAsync("verifyAdminToken middleware", verifyAdminToken),
  catchAsync("getAllSubAdmins api", getAllSubAdmins),
);

// validate admin
router.post(
  "/validate-admin",
  validateAdminValidator,
  catchAsync("validateUser api", validateAdmin),
);

module.exports = router;
