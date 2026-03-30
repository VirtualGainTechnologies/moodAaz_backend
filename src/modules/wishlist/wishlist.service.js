const mongoose = require("mongoose");

const cache = require("./wishlist.cache");
const repo = require("./wishlist.repository");
const productRepo = require("../product/product.repository");
const {
  S3_TEST_PUBLIC_BASE_URL,
  S3_PROD_PUBLIC_BASE_URL,
  NODE_ENV,
} = require("../../config/env");
const AppError = require("../../utils/app-error");

const S3_BASE_URL =
  NODE_ENV === "production" ? S3_PROD_PUBLIC_BASE_URL : S3_TEST_PUBLIC_BASE_URL;

const populateWishlistItems = async (items) => {
  if (items.length === 0) return [];
  const products = await productRepo.findMany(
    { _id: { $in: [...new Set(items.map((i) => i.product_id))] } },
    "name slug status variants variants_images image_attribute ratings",
    {
      lean: true,
    },
  );
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  return items.map((item) => {
    const product = productMap.get(item.product_id.toString());
    if (!product)
      return {
        ...item,
        unavailable: true,
      };

    const variant = product.variants.find(
      (v) => v._id.toString() === item.variant_id.toString(),
    );
    if (!variant)
      return {
        ...item,
        unavailable: true,
      };

    // get thumbnail based on image_attribute
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
      addedAt: item.addedAt,
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
      ratings: product.ratings,
      unavailable: product.status !== "ACTIVE" || variant.stock === 0,
    };
  });
};

exports.getWishlist = async (userId) => {
  const cached = await cache("WISHLIST").get(userId);
  if (cached) return cached;

  const wishlist = await repo.updateOne(
    { user_id: userId },
    { $setOnInsert: { user_id: userId, items: [] } },
    { upsert: true, returnDocument: "after" },
  );
  if (!wishlist) {
    throw new AppError(404, "Failed to create or find wishlist");
  }

  const populated = await populateWishlistItems(wishlist.items);
  const result = { ...wishlist.toObject(), items: populated };

  await cache("WISHLIST").set(userId, result);
  return result;
};

exports.addItem = async (userId, payload) => {
  const { productId, variantId } = payload;
  // validate product + variant
  const product = await productRepo.findOne(
    {
      _id: productId,
      status: "ACTIVE",
      "variants._id": variantId,
    },
    "_id",
    { lean: true },
  );

  if (!product) {
    throw new AppError(404, "Product or variant not found");
  }

  const productObjectId = new mongoose.Types.ObjectId(productId);
  const variantObjectId = new mongoose.Types.ObjectId(variantId);

  // ensure wishlist exists
  await repo.updateOne(
    { user_id: userId },
    { $setOnInsert: { user_id: userId, items: [] } },
    { upsert: true, returnDocument: "after" },
  );

  // atomic conditional push
  const result = await repo.updateOne(
    {
      user_id: userId,
      items: {
        $not: {
          $elemMatch: {
            product_id: productObjectId,
            variant_id: variantObjectId,
          },
        },
      },
    },
    {
      $push: {
        items: {
          product_id: productObjectId,
          variant_id: variantObjectId,
        },
      },
    },
    { returnDocument: "after" },
  );

  if (!result) {
    throw new AppError(400, "Item already in wishlist");
  }

  await cache("WISHLIST").invalidate(userId);
  return exports.getWishlist(userId);
};

exports.removeItem = async (userId, variantId) => {
  const updated = await repo.updateOne(
    { user_id: userId },
    {
      $pull: {
        items: {
          variant_id: new mongoose.Types.ObjectId(variantId),
        },
      },
    },
    { returnDocument: "after" },
  );
  if (!updated) {
    throw new AppError(404, "Wishlist not found");
  }

  await cache("WISHLIST").invalidate(userId);

  return exports.getWishlist(userId);
};

exports.moveToCart = async (userId, variantId, cartService) => {
  const variantObjectId = new mongoose.Types.ObjectId(variantId);

  // get only the required item (not full wishlist)
  const wishlist = await repo.findOne(
    { user_id: userId, "items.variant_id": variantObjectId },
    { "items.$": 1 }, // projection → only matched item
    { lean: true },
  );

  if (!wishlist || !wishlist.items.length) {
    throw new AppError(404, "Item not found in wishlist");
  }

  const item = wishlist.items[0];

  // add to cart (safe first step)
  const cart = await cartService.addItem(userId, {
    productId: item.product_id.toString(),
    variantId: item.variant_id.toString(),
    quantity: 1,
  });
  if (!cart) {
    throw new AppError(400, "Failed to move item to cart");
  }

  // remove from wishlist (atomic)
  await repo.updateOne(
    { user_id: userId },
    {
      $pull: { items: { variant_id: variantObjectId } },
    },
    { returnDocument: "after" },
  );

  await cache("WISHLIST").invalidate(userId);
  return await exports.getWishlist(userId);
};

exports.mergeGuestWishlist = async (userId, guestItems = []) => {
  if (!guestItems.length) return;

  const wishlist = await repo.updateOne(
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
    "_id variants._id",
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

    // find existing item in cart
    const existingItem = wishlist?.items?.find(
      (i) => i.variant_id.toString() === item.variantId,
    );
    if (existingItem) continue; // skip if already in wishlist

    const updated = await repo.updateOne(
      { user_id: userId },
      {
        $push: {
          items: {
            product_id: productId,
            variant_id: variantId,
          },
        },
      },
      { returnDocument: "after" },
    );
    if (!updated) {
      throw new AppError(400, "Failed to update cart");
    }
  }

  await cache("WISHLIST").invalidate(userId);
  return exports.getWishlist(userId);
};

exports.getGuestWishlist = async (guestItems = []) => {
  if (!guestItems.length) return { items: [] };

  const productIds = [...new Set(guestItems.map((i) => i.productId))];

  const products = await productRepo.findMany(
    {
      _id: { $in: productIds.map((id) => new mongoose.Types.ObjectId(id)) },
      status: "ACTIVE",
    },
    {
      name: 1,
      slug: 1,
      status: 1,
      variants: 1,
      variants_images: 1,
      image_attribute: 1,
      ratings: 1,
    },
    { lean: true },
  );

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

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

    return {
      product_id: guestItem.productId,
      variant_id: guestItem.variantId,
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
      ratings: product.ratings,
      unavailable: product.status !== "ACTIVE" || variant.stock === 0,
    };
  });

  return { items };
};
