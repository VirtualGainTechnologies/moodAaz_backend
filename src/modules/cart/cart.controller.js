const service = require("./cart.service");

exports.getCart = async (req, res) => {
  const cart = await service.getCart(req.user._id);
  if (!cart) {
    throw new AppError(404, "Failed to retrieve cart");
  }
  res.status(200).json({
    message: "Cart retrieved successfully",
    error: false,
    data: cart,
  });
};

exports.addItem = async (req, res) => {
  const cart = await service.addItem(req.user._id, req.body);
  if (!cart) {
    throw new AppError(400, "Failed to add item to cart");
  }
  res.status(200).json({
    message: "Item added to cart successfully",
    error: false,
    data: cart,
  });
};

exports.updateQuantity = async (req, res) => {
  const cart = await service.updateQuantity(req.user._id, {
    quantity: req.body.quantity,
    variantId: req.params.variantId,
  });
  if (!cart) {
    throw new AppError(400, "Failed to update item quantity");
  }

  res.status(200).json({
    message: "Item quantity updated successfully",
    error: false,
    data: cart,
  });
};

exports.removeItem = async (req, res) => {
  const { variantId } = req.params;
  const cart = await service.removeItem(req.user._id, variantId);
  if (!cart) {
    throw new AppError(400, "Failed to remove item from cart");
  }

  res.status(200).json({
    message: "Item removed from cart successfully",
    error: false,
    data: cart,
  });
};

exports.clearCart = async (req, res) => {
  await service.clearCart(req.user._id);
  res.status(200).json({
    message: "Cart cleared successfully",
    error: false,
    data: null,
  });
};

exports.mergeGuestCart = async (req, res) => {
  const { guestItems } = req.body;
  const cart = await service.mergeGuestCart(req.user._id, guestItems);
  if (!cart) {
    throw new AppError(400, "Failed to merge guest cart");
  }
  res.status(200).json({
    message: "Guest cart merged successfully",
    error: false,
    data: cart,
  });
};
