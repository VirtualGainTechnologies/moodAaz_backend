const router = require("express").Router();

const { authenticate, authorize } = require("../../middlewares");
const { catchAsync } = require("../../utils/catch-async");
const {
  getWishlist,
  addItem,
  removeItem,
  moveToCart,
  mergeGuestWishlist,
} = require("./wishlist.controller");

router.use(authenticate);
router.use(authorize("USER"));

router.get("/", catchAsync("getWishlist api", getWishlist));
router.post("/items", catchAsync("addItem api", addItem));
router.delete("/items/:variantId", catchAsync("removeItem api", removeItem));
router.post(
  "/items/:variantId/move-to-cart",
  catchAsync("moveToCart api", moveToCart),
);
router.post("/merge", catchAsync("mergeGuestWishlist api", mergeGuestWishlist));

module.exports = router;
