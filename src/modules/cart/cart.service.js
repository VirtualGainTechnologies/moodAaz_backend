const mongoose = require("mongoose");

const repo = require("./cart.repository");
const cache = require("./cart.cache");
const productRepo = require("../product/product.repository");
const AppError = require("../../utils/app-error");
const {
  S3_TEST_PUBLIC_BASE_URL,
  S3_PROD_PUBLIC_BASE_URL,
  NODE_ENV,
  SHIPPING_CHARGE,
  FREE_SHIPPING_THRESHOLD,
} = require("../../config/env");

const S3_BASE_URL =
  NODE_ENV === "production" ? S3_PROD_PUBLIC_BASE_URL : S3_TEST_PUBLIC_BASE_URL;

const validateVariant = async (productId, variantId, quantity) => {
  const product = await productRepo.findOne(
    {
      _id: productId,
      status: "ACTIVE",
      "variants._id": variantId,
    },
    {
      "variants.$": 1,
      variants_images: 1,
      image_attribute: 1,
      name: 1,
      slug: 1,
      stock: 1,
    },
    { lean: true },
  );
  if (!product) throw new AppError(404, "Product or variant not found");

  const variant = product.variants[0];
  if (variant.stock === 0) {
    throw new AppError(400, "Variant is out of stock");
  }
  if (variant.stock < quantity) {
    throw new AppError(400, `Only ${variant.stock} items available`);
  }
  return { product, variant };
};

const populateCartItems = async (items) => {
  if (items.length === 0) return [];

  const products = await productRepo.findMany(
    { _id: { $in: [...new Set(items.map((i) => i.product_id))] } },
    "name slug variants variants_images image_attribute status date ratings total_stock min_price",
    { lean: true },
  );
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  let totalPrice = 0;
  let totalSalePrice = 0;
  const cartItems = items.map((item) => {
    const product = productMap.get(item.product_id.toString());
    if (!product) return item;

    const variant = product.variants.find(
      (v) => v._id.toString() === item.variant_id.toString(),
    );
    if (!variant) return item;

    // get thumbnail from variants_images based on image_attribute
    const imageAttrValue = variant.attributes
      ?.get?.(product.image_attribute)
      ?.toLowerCase();
    const images = product.variants_images?.find(
      (vi) => vi.value === imageAttrValue,
    );
    const thumbnail = images?.thumbnail
      ? `${S3_BASE_URL}/${images.thumbnail}`
      : null;

    totalPrice += variant.price ? variant.price * item.quantity : 0;
    totalSalePrice += variant.sale_price
      ? variant.sale_price * item.quantity
      : 0;
    return {
      _id: item.product_id,
      name: product.name,
      slug: product.slug,
      is_featured: product.is_featured,
      ratings: product.ratings,
      total_stock: product.total_stock,
      min_price: product.min_price,
      date: product.date,
      quantity: items.quantity,
      variant: {
        sku: variant.sku,
        price: variant.price,
        sale_price: variant.sale_price,
        stock: variant.stock,
        thumbnail: thumbnail,
        discount: variant.sale_price
          ? Math.round(
              ((variant.price - variant.sale_price) / variant.price) * 100,
            )
          : 0,
        attributes: variant.attributes,
        _id: variant._id,
      },
    };
  });

  return {
    items: cartItems,
    totalPrice,
    totalSalePrice,
    shippingCharge: totalPrice > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE,
  };
};

exports.getCart = async (userId) => {
  const cached = await cache("CART").get(userId);
  if (cached) return cached;

  const cart = await repo.updateOne(
    { user_id: userId },
    { $setOnInsert: { user_id: userId, items: [] } },
    { upsert: true, returnDocument: "after" },
  );
  if (!cart) {
    throw new AppError(404, "Failed to create or find cart");
  }

  // populate product details for each cart item
  const { items, totalPrice, totalSalePrice, shippingCharge } =
    await populateCartItems(cart.items);
  const result = {
    ...cart.toObject(),
    items: items && items.length ? items : [],
    totalPrice: totalPrice ?? 0,
    totalSalePrice: totalSalePrice ?? 0,
    totalDiscount:
      totalPrice && totalSalePrice ? totalPrice - totalSalePrice : 0,
    shippingCharge: shippingCharge ?? 0,
  };

  await cache("CART").set(userId, result);
  return result;
};

exports.addItem = async (userId, payload) => {
  const { productId, variantId, quantity } = payload;

  const existingItem = await repo.findOne(
    {
      user_id: userId,
      "items.variant_id": new mongoose.Types.ObjectId(variantId),
    },
    { "items.$": 1 },
    { lean: true },
  );
  if (existingItem) {
    const existingQty = existingItem?.items?.[0]?.quantity || 0;
    const totalQty = existingQty + quantity;
    await validateVariant(productId, variantId, totalQty);
    const updated = await repo.updateOne(
      {
        user_id: userId,
        "items.variant_id": new mongoose.Types.ObjectId(variantId),
      },
      {
        $inc: { "items.$.quantity": quantity },
      },
      { returnDocument: "after" },
    );
    if (!updated) {
      throw new AppError(400, "Failed to update quantity");
    }

    await cache("CART").invalidate(userId);
    return exports.getCart(userId);
  }

  // if item not found → push new item (also creates cart if not exists)
  const { variant } = await validateVariant(productId, variantId, quantity);
  const newCart = await repo.updateOne(
    { user_id: userId },
    {
      $setOnInsert: { user_id: userId },
      $push: {
        items: {
          product_id: productId,
          variant_id: variantId,
          sku: variant.sku,
          quantity,
        },
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  if (!newCart) {
    throw new AppError(400, "Failed to add item to cart");
  }

  await cache("CART").invalidate(userId);
  return exports.getCart(userId);
};

exports.updateQuantity = async (userId, payload) => {
  const { variantId, quantity } = payload;

  const product = await productRepo.findOne(
    { "variants._id": new mongoose.Types.ObjectId(variantId) },
    { "variants.$": 1 },
    { lean: true },
  );

  if (!product) {
    throw new AppError(404, "Product or variant not found");
  }

  const variant = product.variants[0];
  if (variant.stock === 0) {
    throw new AppError(400, "Variant is out of stock");
  }
  if (variant.stock < quantity) {
    throw new AppError(400, `Only ${variant.stock} items available`);
  }

  const updated = await repo.updateOne(
    {
      user_id: userId,
      "items.variant_id": variantId,
    },
    {
      $set: { "items.$.quantity": quantity },
    },
    { returnDocument: "after" },
  );
  if (!updated) {
    throw new AppError(404, "Item not found in cart");
  }

  await cache("CART").invalidate(userId);
  return exports.getCart(userId);
};

exports.removeItem = async (userId, variantId) => {
  const updated = await repo.updateOne(
    { user_id: userId },
    { $pull: { items: { variant_id: variantId } } },
    { returnDocument: "after" },
  );
  if (!updated) {
    throw new AppError(404, "Cart not found");
  }
  await cache("CART").invalidate(userId);
  return exports.getCart(userId);
};

exports.clearCart = async (userId) => {
  const cart = await repo.updateOne(
    { user_id: userId },
    { $set: { items: [] } },
    { returnDocument: "after" },
  );
  if (!cart) {
    throw new AppError(404, "Cart not found");
  }
  await cache("CART").invalidate(userId);
};

exports.mergeGuestCart = async (userId, guestItems = []) => {
  if (!guestItems.length) return;

  const cart = await repo.updateOne(
    { user_id: userId },
    { $setOnInsert: { user_id: userId, items: [] } },
    { upsert: true },
  );

  const products = await productRepo.findMany(
    {
      _id: {
        $in: [
          ...new Set(
            guestItems.map((i) => new mongoose.Types.ObjectId(i.productId)),
          ),
        ],
      },
      status: "ACTIVE",
    },
    { variants: 1 },
    { lean: true },
  );

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  for (const item of guestItems) {
    const productId = new mongoose.Types.ObjectId(item.productId);
    const variantId = new mongoose.Types.ObjectId(item.variantId);

    const product = productMap.get(item.productId);
    if (!product) continue; // skip unavailable products

    const variant = product.variants.find(
      (v) => v._id.toString() === item.variantId,
    );
    if (!variant) continue; // skip unavailable variants

    if (variant.stock === 0) continue; // skip out of stock

    // find existing item in cart
    const existingItem = cart?.items?.find(
      (i) => i.variant_id.toString() === item.variantId,
    );

    if (existingItem) {
      const totalQty = Math.min(
        existingItem.quantity + item.quantity,
        variant.stock,
      );
      const updated = await repo.updateOne(
        {
          user_id: userId,
          "items.variant_id": variantId,
        },
        { $set: { "items.$.quantity": totalQty } },
        { returnDocument: "after" },
      );
      if (!updated) {
        throw new AppError(400, "Failed to update cart");
      }
    } else {
      const totalQty = Math.min(item.quantity, variant.stock);
      const updated = await repo.updateOne(
        { user_id: userId },
        {
          $push: {
            items: {
              product_id: productId,
              variant_id: variantId,
              sku: variant.sku,
              quantity: totalQty,
            },
          },
        },
        { returnDocument: "after" },
      );
      if (!updated) {
        throw new AppError(400, "Failed to update cart");
      }
    }
  }

  await cache("CART").invalidate(userId);
  return exports.getCart(userId);
};

exports.moveToWishlist = async (userId, variantId, wishlistService) => {
  const cart = await repo.findOne(
    {
      user_id: userId,
      "items.variant_id": new mongoose.Types.ObjectId(variantId),
    },
    { "items.$": 1 },
    { lean: true },
  );
  if (!cart?.items?.length) {
    throw new AppError(404, "Item not found in cart");
  }
  const cartItem = cart.items[0];

  const wishlist = await wishlistService.addItem(userId, {
    productId: cartItem.product_id.toString(),
    variantId: cartItem.variant_id.toString(),
  });
  if (!wishlist) {
    throw new AppError(400, "Failed to move item to wishlist");
  }

  const updated = await repo.updateOne(
    { user_id: userId },
    {
      $pull: {
        items: { variant_id: new mongoose.Types.ObjectId(variantId) },
      },
    },
    { returnDocument: "after" },
  );
  if (!updated) {
    throw new AppError(400, "Failed to move item from cart");
  }

  await cache("CART").invalidate(userId);
  return exports.getCart(userId);
};

exports.getGuestCart = async (guestItems = []) => {
  if (!guestItems.length) return { items: [] };

  const products = await productRepo.findMany(
    {
      _id: {
        $in: [
          ...new Set(
            guestItems.map((i) => new mongoose.Types.ObjectId(i.productId)),
          ),
        ],
      },
      status: "ACTIVE",
    },
    {
      name: 1,
      slug: 1,
      variants: 1,
      variants_images: 1,
      image_attribute: 1,
      status: 1,
      date: 1,
      ratings: 1,
      total_stock: 1,
      min_price: 1,
    },
    { lean: true },
  );

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  let totalPrice = 0;
  const items = guestItems.map((guestItem) => {
    const product = productMap.get(guestItem.productId);
    if (!product) return { ...guestItem, unavailable: true };

    const variant = product.variants.find(
      (v) => v._id.toString() === guestItem.variantId,
    );
    if (!variant) return { ...guestItem, unavailable: true };

    const attrValue = variant.attributes
      ?.get?.(product.image_attribute)
      ?.toLowerCase();
    const imageEntry = product.variants_images?.find(
      (vi) => vi.value === attrValue,
    );
    const thumbnail = imageEntry?.thumbnail
      ? `${S3_BASE_URL}/${imageEntry.thumbnail}`
      : null;

    // cap quantity at available stock
    const quantity = Math.min(guestItem.quantity, variant.stock);
    totalPrice += variant.sale_price
      ? variant.sale_price * quantity
      : variant.price * quantity;
    return {
      _id: guestItem.productId,
      name: product.name,
      slug: product.slug,
      is_featured: product.is_featured,
      ratings: product.ratings,
      total_stock: product.total_stock,
      min_price: product.min_price,
      date: product.date,
      quantity,
      variant: {
        sku: variant.sku,
        price: variant.price,
        sale_price: variant.sale_price,
        stock: variant.stock,
        thumbnail: thumbnail,
        discount: variant.sale_price
          ? Math.round(
              ((variant.price - variant.sale_price) / variant.price) * 100,
            )
          : 0,
        attributes: variant.attributes,
        _id: variant._id,
      },
    };
  });

  return {
    items,
    totalPrice,
    shippingCharge: totalPrice > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE,
  };
};
