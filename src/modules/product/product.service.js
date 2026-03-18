const slugify = require("slugify");
const crypto = require("crypto");
const mongoose = require("mongoose");

const repo = require("./product.repository");
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

const formatProductImages = (variantsImages) => {
  for (let i = 0; i < variantsImages.length; i++) {
    const variant = variantsImages[i];
    if (variant.images?.length) {
      for (let j = 0; j < variant.images.length; j++) {
        variant.images[j] = S3_BASE_URL + "/" + variant.images[j];
      }
    }
    if (variant.thumbnail) {
      variant.thumbnail = S3_BASE_URL + "/" + variant.thumbnail;
    }
  }
  return variantsImages;
};

const buildMatchStage = (filters = {}) => {
  const {
    status,
    tags,
    isFeatured,
    isNewArrival,
    isSignature,
    minPrice,
    maxPrice,
    inStock,
    search,
    categoryId,
  } = filters;

  const match = {
    ...(status && { status }),
    ...(Array.isArray(tags) &&
      tags.length > 0 && {
        tags: { $in: tags },
      }),
    ...(isFeatured && { is_featured: true }),
    ...(isNewArrival && { is_new_arrival: true }),
    ...(isSignature && { is_signature: true }),
    ...((minPrice || maxPrice) && {
      "variants.price": {
        ...(minPrice && { $gte: Number(minPrice) }),
        ...(maxPrice && { $lte: Number(maxPrice) }),
      },
    }),
    ...(search?.trim() && {
      $text: { $search: search.trim() },
    }),
    ...(categoryId && {
      category_path: new mongoose.Types.ObjectId(categoryId),
    }),
  };
  if (inStock) {
    match["total_stock"] = { $gt: 0 };
  }
  return Object.keys(match).length ? match : {};
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
  const uploadPrductImage = async (imagesMap, thumbnailMap) => {
    const varientimageArr = [];
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
      varientimageArr.push({
        value,
        images: uploadedImages.map((x) => x.key),
        thumbnail: uploadedThumbnail.key,
      });
    }
    return varientimageArr;
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

  product.variants_images = formatProductImages(product.variants_images);
  return product;
};

exports.getAllProducts = async (query) => {
  const { page = 1, limit = 10, sort, search } = query;
  const match = buildMatchStage(query);
  const sortStage = buildSortStage(sort, !!search);
  const pipeline = [
    { $match: match },
    { $sort: sortStage },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $skip: (page - 1) * Number(limit) },
          { $limit: Number(limit) },
          {
            $addFields: {
              min_price: { $min: "$variants.price" },
              min_sale_price: { $min: "$variants.sale_price" },
              variants_images: {
                $map: {
                  input: "$variants_images",
                  as: "variant",
                  in: {
                    value: "$$variant.value",
                    images: {
                      $map: {
                        input: "$$variant.images",
                        as: "image",
                        in: { $concat: [S3_BASE_URL, "/", "$$image"] },
                      },
                    },
                    thumbnail: {
                      $concat: [S3_BASE_URL, "/", "$$variant.thumbnail"],
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              name: 1,
              slug: 1,
              description: 1,
              thumbnail: 1,
              product_type: 1,
              variants: 1,
              variants_images: 1,
              attributes: 1,
              ratings: 1,
              is_featured: 1,
              is_new_arrival: 1,
              is_signature: 1,
              tags: 1,
              status: 1,
              total_stock: 1,
              min_price: 1,
              min_sale_price: 1,
              createdAt: 1,
              date: 1,
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
      $match: {
        _id: objectId,
        status: { $ne: "ARCHIVED" },
      },
    },
    {
      $lookup: {
        from: "reviews",
        let: { productId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$product_id", "$$productId"] },
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 10 },
        ],
        as: "recent_reviews",
      },
    },
    {
      $addFields: {
        min_price: { $min: "$variants.price" },
        min_sale_price: { $min: "$variants.sale_price" },
        variants_images: {
          $map: {
            input: "$variants_images",
            as: "variant",
            in: {
              value: "$$variant.value",
              images: {
                $map: {
                  input: "$$variant.images",
                  as: "image",
                  in: { $concat: [S3_BASE_URL, "/", "$$image"] },
                },
              },
              thumbnail: { $concat: [S3_BASE_URL, "/", "$$variant.thumbnail"] },
            },
          },
        },
      },
    },
    {
      $project: {
        name: 1,
        slug: 1,
        description: 1,
        thumbnail: 1,
        variants_images: 1,
        attributes: 1,
        variants: 1,
        has_variants: 1,
        product_type: 1,
        tags: 1,
        is_featured: 1,
        is_new_arrival: 1,
        is_best_seller: 1,
        is_signature: 1,
        ratings: 1,
        min_price: 1,
        min_sale_price: 1,
        total_stock: 1,
        seo: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        recent_reviews: 1,
      },
    },
  ];

  const [product] = await repo.aggregate(pipeline);
  if (!product) {
    throw new AppError(404, "Product not found");
  }
  return formatProductImages([product])[0];
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
