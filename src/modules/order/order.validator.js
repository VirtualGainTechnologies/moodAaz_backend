const { param, body, query } = require("express-validator");

const ORDER_STATUS = [
  "PENDING",
  "CONFIRMED",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
];
const PAYMENT_METHODS = ["COD"];

exports.placeOrderValidator = [
  body("addressId")
    .notEmpty()
    .withMessage("Address ID is required")
    .isMongoId()
    .withMessage("Invalid Address ID"),
  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method is required")
    .isIn(PAYMENT_METHODS)
    .withMessage("Invalid payment method"),
];

exports.getUserOrdersValidator = [
  query("status")
    .optional()
    .custom((value) => {
      const statuses = value.split(",");
      const isValid = statuses.every((s) => ORDER_STATUS.includes(s));
      if (!isValid) throw new Error("Invalid order status");
      return true;
    }),
  query("page")
    .optional()
    .toInt()
    .isInt({ min: 1 })
    .withMessage("Page must be a number greater than 0"),
  query("limit")
    .optional()
    .toInt()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
];

exports.sendCancelOrderOtpValidator = [
  param("id")
    .notEmpty()
    .withMessage("Order ID is required")
    .isMongoId()
    .withMessage("Invalid Order ID"),
  body("reason")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Reason must be between 3 and 200 characters"),
];

exports.verifyCancelOrderOtpValidator = [
  param("id")
    .notEmpty()
    .withMessage("Order ID is required")
    .isMongoId()
    .withMessage("Invalid Order ID"),
  body("otpId")
    .notEmpty()
    .withMessage("OTP ID is required")
    .isMongoId()
    .withMessage("Invalid OTP ID"),
  body("otp")
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits")
    .isNumeric()
    .withMessage("OTP must be numeric"),
  body("reason")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Reason must be between 3 and 200 characters"),
];

exports.updateOrderStatusValidator = [
  param("id")
    .notEmpty()
    .withMessage("Order ID is required")
    .isMongoId()
    .withMessage("Invalid Order ID"),
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(ORDER_STATUS)
    .withMessage("Invalid order status"),

  body("note")
    .optional()
    .trim()
    .isLength({ min: 3, max: 300 })
    .withMessage("Note must be between 3 and 300 characters"),
];

exports.getAdminOrdersValidator = [
  query("status")
    .optional()
    .trim()
    .isIn(ORDER_STATUS)
    .withMessage("Invalid order status"),
  query("from")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("from must be in YYYY-MM-DD format"),
  query("to")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("to must be in YYYY-MM-DD format"),
  query("payment_method")
    .optional()
    .isIn(PAYMENT_METHODS)
    .withMessage("Invalid payment method"),
  query("search")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Search must be between 2 and 100 characters"),
  query("page")
    .optional()
    .toInt()
    .isInt({ min: 1 })
    .withMessage("Page must be greater than 0"),
  query("limit")
    .optional()
    .toInt()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query().custom((_, { req }) => {
    if (req.query.from && req.query.to) {
      if (new Date(req.query.from) > new Date(req.query.to)) {
        throw new Error("'from' date cannot be greater than 'to' date");
      }
    }
    return true;
  }),
];
