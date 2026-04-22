const router = require("express").Router();

const {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
} = require("./order.controller");
const {
  catchAsync,
  catchAsyncWithSession,
} = require("../../utils/catch-async");
const { authenticate, authorize } = require("../../middlewares");

// user routes
router.post(
  "/",
  authenticate,
  authorize("USER"),
  catchAsyncWithSession("placeOrder api", placeOrder),
);
router.get(
  "/",
  authenticate,
  authorize("USER"),
  catchAsync("getMyOrders api", getMyOrders),
);
router.get(
  "/:id",
  authenticate,
  authorize("USER"),
  catchAsync("getOrderById api", getOrderById),
);
router.patch(
  "/:id/cancel",
  authenticate,
  authorize("USER"),
  catchAsyncWithSession("cancelOrder api", cancelOrder),
);

// admin routes
router.patch(
  "/:id/status",
  authenticate,
  authorize("SUPER-ADMIN"),
  catchAsyncWithSession("updateOrderStatus api", updateOrderStatus),
);

module.exports = router;
