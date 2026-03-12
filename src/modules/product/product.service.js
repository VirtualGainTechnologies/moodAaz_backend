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
    categoryId,
    careInstructions,
    warranty,
    countryOfOrigin,
    manufacturer,
    brand,
    attributes,
    variants,
    tags,
    productType,
    imageAttribute = "color",
    seo,
    status = "ACTIVE",
  } = payload;

  // slug
  const slug = slugify(name, { lower: true, strict: true });
  const productExists = await repo.findOne({ slug }, "_id", { lean: true });
  if (productExists) {
    throw new AppError(400, "Product already exists");
  }

  // article number
  const articleNumber = `MDZ-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

  // file parsing
  let thumbnail = null;
  const images = new Map();
  for (const file of files) {
    if (file.fieldname === "thumbnail") {
      thumbnail = file;
      continue;
    }
    const match = file.fieldname.match(/^variantImages\[(.+?):(.+?)\]$/);
    if (!match) {
      throw new AppError(400, `Invalid image field: ${file.fieldname}`);
    }
    const attribute = match[1].toLowerCase();
    const value = match[2].toLowerCase();
    const key = `${attribute}:${value}`;
    (images.get(key) ?? images.set(key, []).get(key)).push(file);
  }
  if (!thumbnail) {
    throw new AppError(400, "Thumbnail image is required");
  }

  // upload thumbnail
  const { url: thumbnailUrl } = await uploadPublicFile(
    thumbnail,
    "product-thumbnail",
    5,
  );

  // upload variants images
  const variantsImages = await Promise.all(
    Array.from(images.entries()).map(async ([key, files]) => {
      const [, value] = key.split(":");
      const uploaded = await uploadMultiplePublicFiles(
        files,
        "product-gallery",
        5,
      );
      return {
        value,
        images: uploaded.map((x) => x.url),
      };
    }),
  );

  // variants
  const parsedVariants = JSON.parse(variants || "[]");
  if (!parsedVariants.length) {
    throw new AppError(400, "At least one variant is required");
  }

  const finalVariants = parsedVariants.map((variant, index) => {
    if (!variant.attributes) {
      throw new AppError(400, `Variant attributes missing at index ${index}`);
    }
    const attributeValue = variant.attributes[imageAttribute];
    if (!attributeValue) {
      throw new AppError(
        400,
        `Variant must include "${imageAttribute}" attribute`,
      );
    }
    const attributeValues = Object.values(variant.attributes).map((v) =>
      String(v).replace(/\s+/g, "").toUpperCase(),
    );
    return {
      ...variant,
      sku: `${articleNumber}-${attributeValues.join("-")}`,
      attributes: new Map(Object.entries(variant.attributes)),
    };
  });

  // product data
  const productData = {
    name: name.trim(),
    slug,
    description,
    care_instructions: careInstructions,
    warranty,
    country_of_origin: countryOfOrigin,
    manufacturer,
    brand,
    article_number: articleNumber,
    category_id: new mongoose.Types.ObjectId(categoryId),
    thumbnail: thumbnailUrl,
    attributes: attributes ? JSON.parse(attributes) : {},
    product_type: productType,
    image_attribute: imageAttribute,
    variants_images: variantsImages,
    variants: finalVariants,
    tags: JSON.parse(tags || "[]")
      .map((t) => t.toLowerCase().trim())
      .filter(Boolean),
    seo: seo ? JSON.parse(seo) : {},
    status,
  };

  // create product
  const product = await repo.create(productData);
  if (!product) {
    throw new AppError(400, "Failed to create product");
  }
  return product;
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
