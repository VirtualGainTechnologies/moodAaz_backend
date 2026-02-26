const router = require("express").Router();
const { register, login } = require("./user.controller");
const { body } = require("express-validator");
const { catchAsync } = require("../../utils/catchAsync");

// Validators

// Register validator
const registerValidator = [
  body("first_name")
    .notEmpty()
    .withMessage("First name required"),
  body("email")
    .isEmail()
    .withMessage("Invalid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

// Login validator
const loginValidator = [
  body("email")
    .isEmail()
    .withMessage("Invalid email"),
  body("password")
    .notEmpty()
    .withMessage("Password required"),
];

// Routes

// Register route
router.post(
  "/register",
  registerValidator,
  catchAsync("register api", register)
);

// Login route
router.post(
  "/login",
  loginValidator,
  catchAsync("login api", login)
);

module.exports = router;
