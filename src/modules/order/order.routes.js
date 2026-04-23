const router = require("express").Router();

const {
  placeOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getAdminOrders,
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
  catchAsync("getUserOrders api", getUserOrders),
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
router.get(
  "/admin/all",
  // authenticate,
  // authorize("SUPER-ADMIN"),
  catchAsync("getAdminOrders api", getAdminOrders),
);

router.patch(
  "/admin/:id/status",
  authenticate,
  authorize("SUPER-ADMIN"),
  catchAsyncWithSession("updateOrderStatus api", updateOrderStatus),
);

module.exports = router;
