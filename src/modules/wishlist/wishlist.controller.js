const service = require("./wishlist.service");
const cartService = require("../cart/cart.service");
const AppError = require("../../utils/app-error");

exports.getWishlist = async (req, res) => {
  const wishlist = await service.getWishlist(req.user._id);
  if (!wishlist) {
    throw new AppError(404, "Failed to retrieve wishlist");
  }

  res.status(200).json({
    message: "Wishlist retrieved successfully",
    error: false,
    data: wishlist,
  });
};

exports.addItem = async (req, res) => {
  const { productId, variantId } = req.body;
  const wishlist = await service.addItem(req.user._id, {
    productId,
    variantId,
  });
  if (!wishlist) {
    throw new AppError(400, "Failed to add item to wishlist");
  }

  res.status(200).json({
    message: "Item added to wishlist successfully",
    error: false,
    data: wishlist,
  });
};

exports.removeItem = async (req, res) => {
  const { variantId } = req.params;
  const wishlist = await service.removeItem(req.user._id, variantId);
  if (!wishlist) {
    throw new AppError(400, "Failed to remove item from wishlist");
  }

  res.status(200).json({
    message: "Item removed from wishlist successfully",
    error: false,
    data: wishlist,
  });
};

exports.moveToCart = async (req, res) => {
  const { variantId } = req.params;
  const wishlist = await service.moveToCart(
    req.user._id,
    variantId,
    cartService,
  );
  if (!wishlist) {
    throw new AppError(400, "Failed to move item to cart");
  }

  res.status(200).json({
    message: "Item moved to cart successfully",
    error: false,
    data: wishlist,
  });
};

exports.mergeGuestWishlist = async (req, res) => {
  const { guestItems } = req.body;
  const wishlist = await service.mergeGuestWishlist(req.user._id, guestItems);
  if (!wishlist) {
    throw new AppError(400, "Failed to merge guest wishlist");
  }

  res.status(200).json({
    message: "Guest wishlist merged successfully",
    error: false,
    data: wishlist,
  });
};

exports.getGuestWishlist = async (req, res) => {
  const { guestItems } = req.body;
  const wishlist = await service.getGuestWishlist(guestItems);
  if (!wishlist) {
    throw new AppError(400, "Failed to retrieve guest wishlist");
  }
  res.status(200).json({
    message: "Guest wishlist retrieved successfully",
    error: false,
    data: {
      items: wishlist,
    },
  });
};
