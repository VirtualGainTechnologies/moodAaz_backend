const router = require("express").Router();

const { authenticate, authorize } = require("../../middlewares");
const { catchAsync } = require("../../utils/catch-async");
const {
  getWishlist,
  addItem,
  removeItem,
  moveToCart,
  mergeGuestWishlist,
  getGuestWishlist,
} = require("./wishlist.controller");
const {
  addItemValidator,
  removeItemValidator,
  moveToCartValidator,
  guestWishlistValidator,
} = require("./wishlist.validator");

router.post(
  "/guest",
  guestWishlistValidator,
  catchAsync("getGuestWishlist api", getGuestWishlist),
);

router.use(authenticate);
router.use(authorize("USER"));

router.get("/", catchAsync("getWishlist api", getWishlist));
router.post("/items", addItemValidator, catchAsync("addItem api", addItem));
router.delete(
  "/items/:variantId",
  removeItemValidator,
  catchAsync("removeItem api", removeItem),
);
router.post(
  "/items/:variantId/move-to-cart",
  moveToCartValidator,
  catchAsync("moveToCart api", moveToCart),
);
router.post(
  "/merge",
  guestWishlistValidator,
  catchAsync("mergeGuestWishlist api", mergeGuestWishlist),
);

module.exports = router;
