const router = require("express").Router();

const {
  placeOrder,
  getUserOrders,
  getOrderById,
  sendCancelOrderOtp,
  verifyCancelOrderOtp,
  getAdminOrders,
  updateOrderStatus,
} = require("./order.controller");
const {
  catchAsync,
  catchAsyncWithSession,
} = require("../../utils/catch-async");
const { authenticate, authorize } = require("../../middlewares");
const {
  placeOrderValidator,
  getUserOrdersValidator,
  sendCancelOrderOtpValidator,
  verifyCancelOrderOtpValidator,
  getAdminOrdersValidator,
  updateOrderStatusValidator,
} = require("./order.validator");

// user routes
router.post(
  "/",
  authenticate,
  authorize("USER"),
  placeOrderValidator,
  catchAsyncWithSession("placeOrder api", placeOrder),
);
router.get(
  "/",
  authenticate,
  authorize("USER"),
  getUserOrdersValidator,
  catchAsync("getUserOrders api", getUserOrders),
);
router.get(
  "/:id",
  authenticate,
  authorize("USER"),
  catchAsync("getOrderById api", getOrderById),
);

router.post(
  "/:id/cancel/send-otp",
  authenticate,
  authorize("USER"),
  sendCancelOrderOtpValidator,
  catchAsync("sendCancelOrderOtp api", sendCancelOrderOtp),
);

router.patch(
  "/:id/cancel/verify-otp",
  authenticate,
  authorize("USER"),
  verifyCancelOrderOtpValidator,
  catchAsyncWithSession("verifyCancelOrderOtp api", verifyCancelOrderOtp),
);

// admin routes
router.get(
  "/admin/all",
  authenticate,
  authorize("SUPER-ADMIN"),
  getAdminOrdersValidator,
  catchAsync("getAdminOrders api", getAdminOrders),
);

router.patch(
  "/admin/:id/status",
  authenticate,
  authorize("SUPER-ADMIN"),
  updateOrderStatusValidator,
  catchAsyncWithSession("updateOrderStatus api", updateOrderStatus),
);

module.exports = router;
