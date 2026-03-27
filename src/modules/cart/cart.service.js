const mongoose = require("mongoose");

const repo = require("./cart.repository");
const cache = require("./cart.cache");
const productRepo = require("../product/product.repository");
const AppError = require("../../utils/app-error");
const {
  S3_TEST_PUBLIC_BASE_URL,
  S3_PROD_PUBLIC_BASE_URL,
  NODE_ENV,
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
    "name slug variants variants_images image_attribute",
    { lean: true },
  );
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  return items.map((item) => {
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

    return {
      product_id: item.product_id,
      variant_id: item.variant_id,
      sku: item.sku,
      quantity: item.quantity,
      name: product.name,
      slug: product.slug,
      thumbnail,
      price: variant.price,
      sale_price: variant.sale_price ?? null,
      discount: variant.sale_price
        ? Math.round(
            ((variant.price - variant.sale_price) / variant.price) * 100,
          )
        : 0,
      stock: variant.stock,
      attributes: Object.fromEntries(variant.attributes ?? []),
    };
  });
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
  const populated = await populateCartItems(cart.items);
  const result = { ...cart.toObject(), items: populated };

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
            guestItems.map((i) => new mongoose.Types.ObjectId(i.product_id)),
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
    const productId = new mongoose.Types.ObjectId(item.product_id);
    const variantId = new mongoose.Types.ObjectId(item.variant_id);

    const product = productMap.get(item.product_id);
    if (!product) continue; // skip unavailable products

    const variant = product.variants.find(
      (v) => v._id.toString() === item.variant_id,
    );
    if (!variant) continue; // skip unavailable variants

    if (variant.stock === 0) continue; // skip out of stock

    // find existing item in cart
    const existingItem = cart?.items?.find(
      (i) => i.variant_id.toString() === item.variant_id,
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
