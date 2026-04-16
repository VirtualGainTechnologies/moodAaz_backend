const slugify = require("slugify");
const crypto = require("crypto");
const mongoose = require("mongoose");

const repo = require("./product.repository");
const cache = require("./product.cache");
const categoryRepo = require("../category/category.repository");
const AppError = require("../../utils/app-error");
const {
  uploadPublicFile,
  uploadMultiplePublicFiles,
  deleteMultipleFiles,
} = require("../../services");
const {
  S3_TEST_PUBLIC_BASE_URL,
  S3_PROD_PUBLIC_BASE_URL,
  NODE_ENV,
} = require("../../config/env");

const S3_BASE_URL =
  NODE_ENV === "production" ? S3_PROD_PUBLIC_BASE_URL : S3_TEST_PUBLIC_BASE_URL;

const buildMatchStage = (filters = {}) => {
  const {
    status,
    tags,
    isFeatured,
    isNewArrival,
    isSignature,
    isBestSeller,
    minPrice,
    maxPrice,
    inStock,
    search,
    categories,
    color,
    size,
    material,
    minDiscount,
    patterns,
    occasions,
  } = filters;

  // attributes filters
  const patternList = patterns ? patterns.split(",").map((p) => p.trim()) : [];
  const occasionList = occasions
    ? occasions.split(",").map((o) => o.trim())
    : [];

  // all variant-level filters in one object so they hit $elemMatch together
  const variantElemMatch = {
    ...(color && { "attributes.color": color }),
    ...(size && { "attributes.size": size }),
    ...(material && { "attributes.material": material }),
    ...(minPrice && { price: { $gte: Number(minPrice) } }),
    ...(maxPrice && { price: { $lte: Number(maxPrice) } }),
  };

  const match = {
    ...(status && { status }),
    ...(isFeatured && { is_featured: true }),
    ...(isNewArrival && { is_new_arrival: true }),
    ...(isSignature && { is_signature: true }),
    ...(isBestSeller && { is_best_seller: true }),
    ...(inStock && { total_stock: { $gt: 0 } }),
    ...(tags && { tags: { $in: tags.split(",").map((tag) => tag.trim()) } }),
    ...(search?.trim() && { $text: { $search: search.trim() } }),
    ...(categories && {
      category_path: {
        $in: categories
          .split(",")
          .map((id) => new mongoose.Types.ObjectId(id.trim())),
      },
    }),
    ...(Object.keys(variantElemMatch).length > 0 && {
      variants: { $elemMatch: variantElemMatch },
    }),
    ...(patternList.length > 0 && {
      "attributes.pattern": { $in: patternList },
    }),
    ...(occasionList.length > 0 && {
      "attributes.occasion": { $in: occasionList },
    }),
    ...(minDiscount && {
      $expr: {
        $anyElementTrue: {
          $map: {
            input: "$variants",
            as: "v",
            in: {
              $and: [
                { $ifNull: ["$$v.sale_price", false] },
                { $gt: ["$$v.price", 0] },
                {
                  $gte: [
                    {
                      $multiply: [
                        {
                          $divide: [
                            { $subtract: ["$$v.price", "$$v.sale_price"] },
                            "$$v.price",
                          ],
                        },
                        100,
                      ],
                    },
                    Number(minDiscount),
                  ],
                },
              ],
            },
          },
        },
      },
    }),
  };

  return Object.keys(match).length ? match : {};
};

const buildSortStage = (sort, hasSearch) => {
  const sortStage = {};

  // always sort by relevance first when search is present
  if (hasSearch) {
    sortStage.score = { $meta: "textScore" };
  }

  switch (sort) {
    case "relevance":
      if (!hasSearch) {
        sortStage.createdAt = -1;
      }
      break;

    case "popularity":
      sortStage["ratings.quantity"] = -1;
      break;

    case "newest":
      sortStage.createdAt = -1;
      break;

    case "price_asc":
      sortStage.min_price = 1;
      break;

    case "price_desc":
      sortStage.min_price = -1;
      break;

    default:
      //  default to newest unless search is active
      if (!hasSearch) {
        sortStage.createdAt = -1;
      }
      break;
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
  const images = new Map();
  const thumbnails = new Map();
  for (const file of files) {
    const matchImages = file.fieldname.match(/^variantImages\[(.+?):(.+?)\]$/);
    const matchThumbnail = file.fieldname.match(
      /^variantThumbnail\[(.+?):(.+?)\]$/,
    );
    if (matchImages) {
      const attribute = matchImages[1].toLowerCase();
      const value = matchImages[2].toLowerCase();
      const key = `${attribute}:${value}`;
      (images.get(key) ?? images.set(key, []).get(key)).push(file);
    } else if (matchThumbnail) {
      const attribute = matchThumbnail[1].toLowerCase();
      const value = matchThumbnail[2].toLowerCase();
      const key = `${attribute}:${value}`;
      thumbnails.set(key, file);
    } else {
      throw new AppError(400, `Invalid image field: ${file.fieldname}`);
    }
  }

  // upload product images and thumbnails
  const variantImages = [];
  const uploadPrductImage = async (imagesMap, thumbnailMap) => {
    const variants = [];
    if (!imagesMap.size) {
      throw new AppError(400, "At least one variant image is required");
    }
    for (const [key, files] of imagesMap.entries()) {
      const [attribute, value] = key.split(":");
      const uploadedImages = await uploadMultiplePublicFiles(
        files,
        "product-gallery",
        5,
      );
      const thumbnailFile = thumbnailMap.get(key);
      let uploadedThumbnail;
      if (thumbnailFile) {
        uploadedThumbnail = await uploadPublicFile(
          thumbnailFile,
          "product-thumbnail",
          5,
        );
      } else {
        throw new AppError(
          400,
          `Thumbnail is required for variant with ${attribute}=${value}`,
        );
      }
      variants.push({
        value,
        images: uploadedImages.map((x) => x.key),
        thumbnail: uploadedThumbnail.key,
      });
      variantImages.push({
        value,
        images: uploadedImages.map((x) => x.url),
        thumbnail: uploadedThumbnail.url,
      });
    }
    return variants;
  };

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

  // build category path
  const categoryPath = [];
  let category = await categoryRepo.findById(categoryId, "_id parent", {
    lean: true,
  });
  if (!category) {
    throw new AppError(400, "Category not found");
  }
  while (category) {
    categoryPath.unshift(category._id); //  root → child order
    if (!category.parent) break;
    category = await categoryRepo.findById(category.parent, "_id parent", {
      lean: true,
    });
  }

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
    category_path: categoryPath,
    category_id: new mongoose.Types.ObjectId(categoryId),
    attributes: attributes ? JSON.parse(attributes) : {},
    image_attribute: imageAttribute,
    variants_images: await uploadPrductImage(images, thumbnails),
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
  product.variants_images = variantImages;

  // remove list cache
  await cache("LIST").invalidate();
  return product;
};

exports.getAllProducts = async (query) => {
  const {
    page = 1,
    limit = 16,
    sort,
    search,
    color,
    size,
    material,
    minPrice,
    maxPrice,
    minDiscount,
  } = query;

  // skip cache for search — too many unique combinations
  const shouldCache = !search;
  if (shouldCache) {
    const cached = await cache("LIST").get(query);
    if (cached) return cached;
  }

  const match = buildMatchStage(query);
  const sortStage = buildSortStage(sort, !!search);

  // variant filter conditions to fetch single variant — must stay in sync with buildMatchStage variantElemMatch
  const variantCond = [];
  if (color) variantCond.push({ $eq: ["$$v.attributes.color", color] });
  if (size) variantCond.push({ $eq: ["$$v.attributes.size", size] });
  if (material)
    variantCond.push({ $eq: ["$$v.attributes.material", material] });
  if (minPrice) variantCond.push({ $gte: ["$$v.price", Number(minPrice)] });
  if (maxPrice) variantCond.push({ $lte: ["$$v.price", Number(maxPrice)] });
  if (minDiscount) {
    variantCond.push({ $ifNull: ["$$v.sale_price", false] });
    variantCond.push({ $gt: ["$$v.price", 0] });
    variantCond.push({
      $gte: [
        {
          $multiply: [
            {
              $divide: [
                { $subtract: ["$$v.price", "$$v.sale_price"] },
                "$$v.price",
              ],
            },
            100,
          ],
        },
        Number(minDiscount),
      ],
    });
  }
  const filterExpr = variantCond.length > 0 ? { $and: variantCond } : true;

  // aggregation pipeline
  const pipeline = [
    { $match: match },
    { $sort: sortStage },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $skip: (page - 1) * Number(limit) },
          { $limit: Number(limit) },

          // Step 1 — compute price range + pick single best matching variant
          {
            $addFields: {
              min_price: { $min: "$variants.price" },
              min_sale_price: { $min: "$variants.sale_price" },
              ...(search && { score: { $meta: "textScore" } }),
              variant: {
                $arrayElemAt: [
                  {
                    $cond: {
                      if: {
                        $gt: [
                          {
                            $size: {
                              $filter: {
                                input: "$variants",
                                as: "v",
                                cond: filterExpr,
                              },
                            },
                          },
                          0,
                        ],
                      },
                      then: {
                        $filter: {
                          input: "$variants",
                          as: "v",
                          cond: filterExpr,
                        },
                      },
                      else: "$variants",
                    },
                  },
                  0,
                ],
              },
            },
          },

          // Step 2 — inject thumbnail into variant using image_attribute
          {
            $addFields: {
              "variant.thumbnail": {
                $let: {
                  vars: {
                    // extract the image_attribute value from this variant's attributes
                    // e.g. image_attribute="color" on product, variant has color="red" → "red"
                    attrValue: {
                      $toLower: {
                        $reduce: {
                          input: { $objectToArray: "$variant.attributes" },
                          initialValue: null,
                          in: {
                            $cond: {
                              if: { $eq: ["$$this.k", "$image_attribute"] },
                              then: "$$this.v",
                              else: "$$value",
                            },
                          },
                        },
                      },
                    },
                  },
                  in: {
                    $let: {
                      vars: {
                        // find matching entry in variants_images by value
                        matched: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$variants_images",
                                as: "vi",
                                cond: { $eq: ["$$vi.value", "$$attrValue"] },
                              },
                            },
                            0,
                          ],
                        },
                      },
                      in: {
                        $cond: {
                          if: { $ifNull: ["$$matched.thumbnail", false] },
                          then: {
                            $concat: [S3_BASE_URL, "/", "$$matched.thumbnail"],
                          },
                          else: null,
                        },
                      },
                    },
                  },
                },
              },
              "variant.discount": {
                $cond: {
                  if: {
                    $and: [
                      { $ifNull: ["$variant.sale_price", false] },
                      { $gt: ["$variant.price", 0] },
                    ],
                  },
                  then: {
                    $round: [
                      {
                        $multiply: [
                          {
                            $divide: [
                              {
                                $subtract: [
                                  "$variant.price",
                                  "$variant.sale_price",
                                ],
                              },
                              "$variant.price",
                            ],
                          },
                          100,
                        ],
                      },
                      0,
                    ],
                  },
                  else: 0,
                },
              },
            },
          },

          // Step 3 — return only what the product card needs
          {
            $project: {
              name: 1,
              slug: 1,
              is_featured: 1,
              ratings: 1,
              total_stock: 1,
              min_price: 1,
              min_sale_price: 1,
              createdAt: 1,
              ...(search && { score: 1 }),
              "variant.sku": 1,
              "variant.price": 1,
              "variant.sale_price": 1,
              "variant.stock": 1,
              "variant.thumbnail": 1,
              "variant.discount": 1,
              "variant.attributes": 1,
              "variant._id": 1,
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

  if (shouldCache) await cache("LIST").set(query, result);
  return result;
};

exports.getProductDetails = async (productId) => {
  const cached = await cache("DETAILS").get(productId);
  if (cached) return cached;

  const pipeline = [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(productId),
      },
    },

    // populate category_path names
    {
      $lookup: {
        from: "categories",
        localField: "category_path",
        foreignField: "_id",
        as: "category_path_data",
        pipeline: [
          {
            $project: {
              _id: 1,
              name: 1,
              slug: 1,
            },
          },
        ],
      },
    },

    // category_path has ids in parent -> child order
    {
      $addFields: {
        category_path: {
          $map: {
            input: "$category_path",
            as: "catId",
            in: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$category_path_data",
                    as: "cat",
                    cond: { $eq: ["$$cat._id", "$$catId"] },
                  },
                },
                0,
              ],
            },
          },
        },
      },
    },

    // remove the unordered lookup result
    {
      $unset: "category_path_data",
    },

    // inject S3 URLs into all variant images
    {
      $addFields: {
        variants_images: {
          $map: {
            input: "$variants_images",
            as: "vi",
            in: {
              value: "$$vi.value",
              thumbnail: { $concat: [S3_BASE_URL, "/", "$$vi.thumbnail"] },
              images: {
                $map: {
                  input: "$$vi.images",
                  as: "img",
                  in: { $concat: [S3_BASE_URL, "/", "$$img"] },
                },
              },
            },
          },
        },

        // inject images + discount into every variant
        variants: {
          $map: {
            input: "$variants",
            as: "variant",
            in: {
              $mergeObjects: [
                "$$variant",
                {
                  discount: {
                    $cond: {
                      if: {
                        $and: [
                          { $ifNull: ["$$variant.sale_price", false] },
                          { $gt: ["$$variant.price", 0] },
                        ],
                      },
                      then: {
                        $round: [
                          {
                            $multiply: [
                              {
                                $divide: [
                                  {
                                    $subtract: [
                                      "$$variant.price",
                                      "$$variant.sale_price",
                                    ],
                                  },
                                  "$$variant.price",
                                ],
                              },
                              100,
                            ],
                          },
                          0,
                        ],
                      },
                      else: 0,
                    },
                  },
                  images: {
                    $let: {
                      vars: {
                        attrValue: {
                          $toLower: {
                            $reduce: {
                              input: { $objectToArray: "$$variant.attributes" },
                              initialValue: null,
                              in: {
                                $cond: {
                                  if: { $eq: ["$$this.k", "$image_attribute"] },
                                  then: "$$this.v",
                                  else: "$$value",
                                },
                              },
                            },
                          },
                        },
                      },
                      in: {
                        $let: {
                          vars: {
                            matched: {
                              $arrayElemAt: [
                                {
                                  $filter: {
                                    input: "$variants_images",
                                    as: "vi",
                                    cond: {
                                      $eq: ["$$vi.value", "$$attrValue"],
                                    },
                                  },
                                },
                                0,
                              ],
                            },
                          },
                          in: {
                            thumbnail: {
                              $cond: {
                                if: { $ifNull: ["$$matched.thumbnail", false] },
                                then: {
                                  $concat: [
                                    S3_BASE_URL,
                                    "/",
                                    "$$matched.thumbnail",
                                  ],
                                },
                                else: null,
                              },
                            },
                            images: {
                              $cond: {
                                if: { $ifNull: ["$$matched.images", false] },
                                then: {
                                  $map: {
                                    input: "$$matched.images",
                                    as: "img",
                                    in: {
                                      $concat: [S3_BASE_URL, "/", "$$img"],
                                    },
                                  },
                                },
                                else: [],
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              ],
            },
          },
        },

        min_price: { $min: "$variants.price" },
        max_price: { $max: "$variants.price" },
        min_sale_price: { $min: "$variants.sale_price" },
      },
    },

    {
      $project: {
        name: 1,
        slug: 1,
        description: 1,
        article_number: 1,
        brand: 1,
        country_of_origin: 1,
        manufacturer: 1,
        warranty: 1,
        care_instructions: 1,
        attributes: 1,
        variants: 1,
        total_stock: 1,
        min_price: 1,
        max_price: 1,
        min_sale_price: 1,
        tags: 1,
        is_featured: 1,
        is_new_arrival: 1,
        is_best_seller: 1,
        is_signature: 1,
        ratings: 1,
        seo: 1,
        status: 1,
        category_id: 1,
        category_path: 1,
        createdAt: 1,
      },
    },
  ];

  const [product] = await repo.aggregate(pipeline);
  if (!product) throw new AppError(404, "Product not found");

  await cache("DETAILS").set(productId, product);
  return product;
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

  // remove cache
  await cache("DETAILS").invalidate(productId);
  await cache("LIST").invalidate();
  return updated;
};

exports.getAdminProductList = async (query) => {
  let {
    page = 1,
    limit = 10,
    search,
    categoryId,
    minPrice,
    maxPrice,
    is_featured,
    sort,
  } = query;

  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;

  const match = {
    status: "ACTIVE",
    ...(search && { name: { $regex: search, $options: "i" } }),
    ...(categoryId && { category_id: new mongoose.Types.ObjectId(categoryId) }),
    ...(is_featured !== undefined && { is_featured: is_featured === "true" }),
    ...(minPrice || maxPrice
      ? {
          "variants.price": {
            ...(minPrice ? { $gte: Number(minPrice) } : {}),
            ...(maxPrice ? { $lte: Number(maxPrice) } : {}),
          },
        }
      : {}),
  };

  let sortOption = { createdAt: -1 };
  if (sort === "price_asc") sortOption = { min_price: 1 };
  if (sort === "price_desc") sortOption = { min_price: -1 };
  if (sort === "newest") sortOption = { createdAt: -1 };

  const pipeline = [
    { $match: match },
    {
      $addFields: {
        min_price: { $min: "$variants.price" },
        total_stock: { $sum: "$variants.stock" },
        thumbnail_image: {
          $cond: {
            if: { $gt: [{ $size: "$variants_images" }, 0] },
            then: {
              $concat: [
                S3_BASE_URL,
                "/",
                {
                  $ifNull: [
                    { $arrayElemAt: ["$variants_images.thumbnail", 0] },
                    "",
                  ],
                },
              ],
            },
            else: null,
          },
        },
      },
    },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $sort: sortOption },
          { $skip: skip },
          { $limit: limit },

          {
            $lookup: {
              from: "categories",
              localField: "category_id",
              foreignField: "_id",
              as: "category",
            },
          },
          {
            $unwind: {
              path: "$category",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              name: 1,
              slug: 1,
              brand: 1,
              min_price: 1,
              total_stock: 1,
              "ratings.average": 1,
              thumbnail_image: 1,
              variants: 1,
              is_new_arrival: 1,
              category: {
                _id: 1,
                name: 1,
              },
              createdAt: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        total: { $arrayElemAt: ["$metadata.total", 0] },
      },
    },
  ];

  const result = await repo.aggregate(pipeline);
  const total = result[0]?.total || 0;
  const products = result[0]?.data || [];

  return { products, total };
};

exports.deleteProduct = async (productId) => {
  const product = await repo.findById(productId, "_id variants_images", {
    lean: true,
  });
  if (!product) {
    throw new AppError(400,"Product not found");
  }

  const keys = new Set();
  if (Array.isArray(product.variants_images)) {
    product.variants_images.forEach((variant) => {
      if (variant?.thumbnail) {
        keys.add(variant.thumbnail);
      }
      if (Array.isArray(variant?.images)) {
        variant.images.forEach((img) => {
          if (img) keys.add(img);
        });
      }
    });
  }

  if (keys.size > 0) {
    await deleteMultipleFiles([...keys]);
  }

  await repo.deleteById(productId);
  return true;
};
