const router = require("express").Router();

const {
  getCart,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
  mergeGuestCart,
} = require("./cart.controller");
const {
  addItemValidator,
  updateQuantityValidator,
  removeItemValidator,
  mergeGuestCartValidator,
} = require("./cart.validator");
const { authenticate, authorize } = require("../../middlewares");
const { catchAsync } = require("../../utils/catch-async");

router.use(authenticate);
router.use(authorize("USER"));

router.get("/", catchAsync("getCart api", getCart));
router.post("/items", addItemValidator, catchAsync("addItem api", addItem));
router.patch(
  "/items/:variantId",
  updateQuantityValidator,
  catchAsync("updateQuantity api", updateQuantity),
);
router.delete(
  "/items/:variantId",
  removeItemValidator,
  catchAsync("removeItem api", removeItem),
);
router.delete("/", catchAsync("clearCart api", clearCart));
router.post(
  "/merge",
  mergeGuestCartValidator,
  catchAsync("mergeGuestCart api", mergeGuestCart),
);

module.exports = router;
