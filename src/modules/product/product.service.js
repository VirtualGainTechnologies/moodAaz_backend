const slugify = require("slugify");
const crypto = require("crypto");
const mongoose = require("mongoose");

const repo = require("./product.repository");
const reviewsRepo = require("../review/review.repository");
const categoryRepo = require("../category/category.repository");
const AppError = require("../../utils/app-error");
const {
  uploadPublicFile,
  uploadMultiplePublicFiles,
} = require("../../services/file.service");
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
  } = filters;
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
  };

  return Object.keys(match).length ? match : {};
};

const buildSortStage = (sort, hasSearch) => {
  const sortStage = {};

  // rank by text relevance when search query is present
  if (hasSearch) {
    sortStage.score = { $meta: "textScore" };
  }

  if (sort) {
    const order = sort.startsWith("-") ? -1 : 1;
    const field = sort.replace(/^-/, "");
    sortStage[field] = order;
  }

  // default sort only when no search and no sort param
  if (!hasSearch && !sort) {
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
  return product;
};

exports.getAllProducts = async (query) => {
  const {
    page = 1,
    limit = 10,
    sort,
    search,
    color,
    size,
    material,
    minPrice,
    maxPrice,
  } = query;

  const match = buildMatchStage(query);
  const sortStage = buildSortStage(sort, !!search);

  // variant filter conditions — must stay in sync with buildMatchStage variantElemMatch
  const variantCond = [];
  if (color) variantCond.push({ $eq: ["$$v.attributes.color", color] });
  if (size) variantCond.push({ $eq: ["$$v.attributes.size", size] });
  if (material)
    variantCond.push({ $eq: ["$$v.attributes.material", material] });
  if (minPrice) variantCond.push({ $gte: ["$$v.price", Number(minPrice)] });
  if (maxPrice) variantCond.push({ $lte: ["$$v.price", Number(maxPrice)] });
  const filterExpr = variantCond.length > 0 ? { $and: variantCond } : true;

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
  const pipeline = [
    // match by id and not deleted
    {
      $match: {
        _id: new mongoose.Types.ObjectId(productId),
      },
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
                  // discount percentage
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

                  // inject images from variants_images based on image_attribute
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

        // price range across all variants
        min_price: { $min: "$variants.price" },
        max_price: { $max: "$variants.price" },
        min_sale_price: { $min: "$variants.sale_price" },
      },
    },

    // return full product data
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
        createdAt: 1,
      },
    },
  ];

  const [product] = await repo.aggregate(pipeline);
  if (!product) {
    throw new AppError(404, "Product not found");
  }

  // fetch latest 5 approved reviews with user name populated
  const reviewsPipeline = [
    {
      $match: {
        product_id: new mongoose.Types.ObjectId(productId),
        status: "APPROVED",
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $limit: 5,
    },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        rating: 1,
        title: 1,
        comment: 1,
        images: {
          $map: {
            input: "$images",
            as: "img",
            in: { $concat: [S3_BASE_URL, "/", "$$img"] },
          },
        },
        votes: 1,
        is_verified_purchase: 1,
        user_name: {
          $trim: {
            input: { $concat: ["$user.first_name", " ", "$user.last_name"] },
          },
        },
        user_id: "$user._id",
      },
    },
  ];

  const reviews = await reviewsRepo.aggregate(reviewsPipeline);
  if (!reviews) {
    throw new AppError(400, "Failed to fetch reviews");
  }
  
  return {
    ...product,
    reviews,
  };
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
