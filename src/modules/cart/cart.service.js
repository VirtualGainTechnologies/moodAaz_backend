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

const validateVariant = async (productId, variantId) => {
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
    },
    { lean: true },
  );
  if (!product) throw new AppError(404, "Product or variant not found");

  const variant = product.variants[0];
  if (variant.stock === 0) {
    throw new AppError(400, "Variant is out of stock");
  }
  return { product, variant };
};

const populateCartItems = async (items) => {
  if (items.length === 0) return [];

  const products = await productRepo.find(
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

  const cart = await repo.findOne({ user_id: userId }, "user_id items _id", {
    lean: true,
  });

  // populate product details for each cart item
  const populated = await populateCartItems(cart.items);
  const result = { ...cart.toObject(), items: populated };

  await cartCache("CART").set(userId, result);
  return result;
};

exports.addItem = async (userId, paylod) => {
  const { productId, variantId, quantity } = paylod;
  const { variant } = await validateVariant(productId, variantId);
  const cart = await repo.updateOne(
    { user_id: userId },
    { $setOnInsert: { user_id: userId, items: [] } },
    { upsert: true, new: true },
  );

  const existingIndex = cart.items.findIndex(
    (item) =>
      item.product_id.toString() === productId &&
      item.variant_id.toString() === variantId,
  );

  if (existingIndex > -1) {
    cart.items[existingIndex].quantity =
      cart.items[existingIndex].quantity + quantity;
  } else {
    // new item — push
    cart.items.push({
      product_id: productId,
      variant_id: variantId,
      sku: variant.sku,
      quantity,
    });
  }

  await repo.save(cart);
  await cache("CART").invalidate(userId);

  return exports.getCart(userId);
};

exports.updateQuantity = async (userId, payload) => {
  const { variantId, quantity } = payload;
  const cart = await repo.findOne({ user_id: userId }, "items", { lean: true });
  if (!cart) {
    throw new AppError(404, "Cart not found");
  }

  const item = cart.items.find((i) => i.variant_id.toString() === variantId);
  if (!item) {
    throw new AppError(404, "Item not found in cart");
  }
  item.quantity = quantity;
  await repo.save(cart);
  await cache("CART").invalidate(userId);

  return exports.getCart(userId);
};

exports.removeItem = async (userId, variantId) => {
  const cart = await repo.findOne({ user_id: userId }, "items", { lean: true });
  if (!cart) {
    throw new AppError(404, "Cart not found");
  }

  cart.items = cart.items.filter(
    (item) => item.variant_id.toString() !== variantId,
  );

  await repo.save(cart);
  await cache("CART").invalidate(userId);

  return exports.getCart(userId);
};

exports.clearCart = async (userId) => {
  const cart = await repo.updateOne(
    { user_id: userId },
    { $set: { items: [] } },
    { new: true },
  );
  if (!cart) {
    throw new AppError(404, "Cart not found");
  }
  await cache("CART").invalidate(userId);
};

// MERGE GUEST CART — called after login/register
exports.mergeGuestCart = async (userId, guestItems = []) => {
  if (guestItems.length === 0) return;
  const cart = await repo.updateOne(
    { user_id: userId },
    { $setOnInsert: { user_id: userId, items: [] } },
    { upsert: true, new: true },
  );

  for (const guestItem of guestItems) {
    const existingIndex = cart.items.findIndex(
      (item) =>
        item.product_id.toString() === guestItem.product_id &&
        item.variant_id.toString() === guestItem.variant_id,
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity = Math.max(
        cart.items[existingIndex].quantity,
        guestItem.quantity,
      );
    } else {
      cart.items.push(guestItem);
    }
  }

  await repo.save(cart);
  await cache("CART").invalidate(userId);
};
