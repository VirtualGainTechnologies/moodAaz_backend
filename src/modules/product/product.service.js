const slugify = require("slugify");
const crypto = require("crypto");

const repo = require("./product.repository");
const AppError = require("../../utils/app-error");
const {
  uploadPublicFile,
  uploadMultiplePublicFiles,
} = require("../../services/file.service");
const mongoose = require("mongoose");

const buildMatchStage = (filters = {}) => {
  const {
    status,
    categoryPath,
    tags,
    isFeatured,
    isNewArrival,
    isSignature,
    minPrice,
    maxPrice,
    inStock,
    search,
  } = filters;

  const match = {
    ...(status && { status }),
    ...(categoryPath && {
      category_path: { $in: categoryPath },
    }),
    ...(Array.isArray(tags) &&
      tags.length > 0 && {
        tags: { $in: tags },
      }),
    ...(isFeatured && { is_featured: true }),
    ...(isNewArrival && { is_new_arrival: true }),
    ...(isSignature && { is_signature: true }),
    ...((minPrice || maxPrice) && {
      price: {
        ...(minPrice && { $gte: Number(minPrice) }),
        ...(maxPrice && { $lte: Number(maxPrice) }),
      },
    }),
    ...(search?.trim() && {
      $text: { $search: search.trim() },
    }),
  };

  if (inStock) {
    match.$or = [
      { has_variants: false, stock: { $gt: 0 } },
      { has_variants: true, "variants.stock": { $gt: 0 } },
    ];
  }

  return Object.keys(match).length ? match : null;
};

const buildSortStage = (sort, hasSearch) => {
  const sortStage = {};
  if (hasSearch) {
    sortStage.score = { $meta: "textScore" };
  }
  if (sort) {
    const order = sort.startsWith("-") ? -1 : 1;
    const field = sort.replace("-", "");
    sortStage[field] = order;
  }
  // default fallback
  if (Object.keys(sortStage).length === 0) {
    sortStage.createdAt = -1;
  }
  return sortStage;
};

exports.createProduct = async (payload, files) => {
  const {
    name,
    description,
    shortDescription,
    categoryId,
    categoryPath,
    attributes,
    variants = [],
    tags = [],
    isFeatured = false,
    isNewArrival = false,
    isBestSeller = false,
    isSignature = false,
    hasVariants = false,
    weightInGrams,
    dimensions,
    status = "draft",
  } = payload;

  // check slug is unique
  const slug = slugify(name, { lower: true, strict: true });
  const productExists = await repo.findOne({ slug }, "_id", { lean: true });
  if (productExists) {
    throw new AppError(400, "Product already exists");
  }

  // upload images - name:thumbnail && variant_images[1,2,3...]
  const map = new Map();
  let thumbnail = null;
  files.forEach(async (file) => {
    const match = file.fieldname.match(/^variant_images\[(\d+)\]$/);
    if (match) {
      const index = Number(match[1]);
      (map.get(index) ?? map.set(index, []).get(index)).push(file);
    } else if (file.fieldname == "thumbnail") {
      thumbnail = file;
    } else {
      throw new AppError(400, "Invalid image field");
    }
  });
  const { url } = await uploadPublicFile(thumbnail, "product-thumbnail", 5);
  const finalVariants = await Promise.all(
    JSON.parse(variants).map(async (variant, index) => {
      const files = map.get(index + 1) || [];
      const images = await uploadMultiplePublicFiles(
        files,
        "product-gallery",
        5,
      );
      return {
        ...variant,
        sku: `MOODAAZ-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
        images: images.map((x) => x.url),
      };
    }),
  );

  // product data
  productData = {
    name: name.trim(),
    slug: slugify(name, { lower: true, strict: true }),
    description,
    short_description: shortDescription?.trim() || undefined,
    category_id: new mongoose.Types.ObjectId(categoryId),
    category_path: JSON.parse(categoryPath),
    thumbnail: url,
    attributes: JSON.parse(attributes),
    has_variants: !!hasVariants,
    variants: finalVariants,
    tags: JSON.parse(tags)
      .map((t) => t.toLowerCase().trim())
      .filter(Boolean),
    is_featured: !!isFeatured,
    is_new_arrival: !!isNewArrival,
    is_best_seller: !!isBestSeller,
    is_signature: !!isSignature,
    weight_in_grams: weightInGrams ? Number(weightInGrams) : undefined,
    dimensions: JSON.parse(dimensions),
    status,
  };
  console.log("productData--", productData);
  const newProduct = await repo.create(productData);
  if (!newProduct) {
    throw new AppError(400, "Failed to create product");
  }
  return newProduct;
};

exports.getAllProducts = async (query) => {
  const {
    page = 1,
    limit = 10,
    sort, // e.g., "-updatedAt"
    search,
  } = query;

  const match = buildMatchStage(query);
  const sortStage = buildSortStage(sort, !!search);
  const pipeline = [
    { $match: match || {} },
    ...(search
      ? [
          {
            $match: { $text: { $search: search } },
          },
        ]
      : []),
    { $sort: sortStage },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $skip: (page - 1) * Number(limit) },
          { $limit: Number(limit) },
          {
            $addFields: {
              total_stock: {
                $cond: ["$has_variants", { $sum: "$variants.stock" }, "$stock"],
              },
            },
          },
          {
            $project: {
              name: 1,
              slug: 1,
              short_description: 1,
              has_variants: 1,
              "variants.sku": 1,
              "variants.price": 1,
              "variants.sale_price": 1,
              "variants.stock": 1,
              "variants.attributes": 1,
              ratings: 1,
              is_featured: 1,
              is_new_arrival: 1,
              is_signature: 1,
              tags: 1,
              date: 1,
              total_stock: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        totalRecords: {
          $ifNull: [{ $arrayElemAt: ["$metadata.total", 0] }, 0],
        },
        products: "$data",
      },
    },
  ];

  const [result] = await repo.aggregate(pipeline);
  if (!result) {
    throw new AppError(400, "Failed to fetch products");
  }
  return result;
};

exports.getProductDetails = async (productId) => {
  const objectId = new mongoose.Types.ObjectId(productId);
  const pipeline = [
    {
      $match: { _id: objectId },
    },
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "product_id",
        as: "reviews",
      },
    },
    {
      $addFields: {
        ratings_quantity: { $size: "$reviews" },
        ratings_average: {
          $cond: [
            { $gt: [{ $size: "$reviews" }, 0] },
            { $avg: "$reviews.rating" },
            0,
          ],
        },
        total_stock: { $sum: "$variants.stock" },
        in_stock: {
          $gt: [
            {
              $size: {
                $filter: {
                  input: "$variants",
                  as: "v",
                  cond: { $gt: ["$$v.stock", 0] },
                },
              },
            },
            0,
          ],
        },
        recent_reviews: {
          $slice: [{ $reverseArray: "$reviews" }, 10],
        },
      },
    },
    {
      $project: {
        name: 1,
        slug: 1,
        description: 1,
        short_description: 1,
        "attributes.brand": 1,
        thumbnail: 1,
        variants: 1,
        price: 1,
        sale_price: 1,
        has_variants: 1,
        tags: 1,
        is_featured: 1,
        is_new_arrival: 1,
        is_best_seller: 1,
        is_signature: 1,
        ratings: 1,
        total_stock: 1,
        in_stock: 1,
        weight_in_grams: 1,
        dimensions: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        recent_reviews: 1,
      },
    },
  ];

  const productArr = await repo.aggregate(pipeline);
  if (!productArr || productArr.length === 0) {
    throw new AppError(404, "Product not found or not published");
  }

  return productArr[0];
};

exports.updateProduct = async (productId, data) => {
  const { name, price } = data;

  const updated = await repo.updateById(
    productId,
    {
      ...(name && {
        name,
        slug: slugify(data.name, { lower: true, strict: true }),
      }),
      ...(price && { price }),
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );
  if (!updated) {
    throw new AppError(400, "Failed to update product");
  }
  return updated;
};
