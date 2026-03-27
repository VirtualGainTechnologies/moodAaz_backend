const router = require("express").Router();

const {
  getCart,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
  mergeGuestCart,
} = require("./cart.controller");
const { authenticate, authorize } = require("../../middlewares");
const { catchAsync } = require("../../utils/catch-async");

router.use(authenticate);
router.use(authorize("USER"));

router.get("/", catchAsync("getCart api", getCart));
router.post("/items", catchAsync("addItem api", addItem));
router.patch(
  "/items/:variantId",
  catchAsync("updateQuantity api", updateQuantity),
);
router.delete("/items/:variantId", catchAsync("removeItem api", removeItem));
router.delete("/", catchAsync("clearCart api", clearCart));
router.post("/merge", catchAsync("mergeGuestCart api", mergeGuestCart));

module.exports = router;
