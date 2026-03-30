const router = require("express").Router();

const {
  getCart,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
  mergeGuestCart,
  moveToWishlist,
  getGuestCart,
} = require("./cart.controller");
const {
  addItemValidator,
  updateQuantityValidator,
  removeItemValidator,
  guestCartValidator,
  moveToWishlistValidator,
} = require("./cart.validator");
const { authenticate, authorize } = require("../../middlewares");
const { catchAsync } = require("../../utils/catch-async");

router.post(
  "/guest",
  guestCartValidator,
  catchAsync("getGuestCart api", getGuestCart),
);

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
  guestCartValidator,
  catchAsync("mergeGuestCart api", mergeGuestCart),
);
router.post(
  "/items/:variantId/move-to-wishlist",
  moveToWishlistValidator,
  catchAsync("moveToWishlist api", moveToWishlist),
);

module.exports = router;
