const router = require("express").Router();

const { getPaymentByOrder, refundPayment } = require("./payment.controller");
const { authenticate, authorize } = require("../../middlewares");
const { catchAsync } = require("../../utils/catch-async");

router.get(
  "/order/:order_id",
  authenticate,
  authorize("USER"),
  catchAsync("getPaymentByOrder api", getPaymentByOrder),
);
router.post(
  "/:payment_id/refund",
  authenticate,
  authorize("SUPER-ADMIN"),
  catchAsync("refundPayment api", refundPayment),
);

module.exports = router;
