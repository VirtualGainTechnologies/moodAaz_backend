const mongoose = require("mongoose");

const repo = require("./review.repository");
const productRepo = require("../product/product.repository");
const AppError = require("../../utils/app-error");
const { uploadMultiplePublicFiles } = require("../../services/file.service");
const {
  S3_TEST_PUBLIC_BASE_URL,
  S3_PROD_PUBLIC_BASE_URL,
  NODE_ENV,
} = require("../../config/env");

const S3_BASE_URL =
  NODE_ENV === "production" ? S3_PROD_PUBLIC_BASE_URL : S3_TEST_PUBLIC_BASE_URL;

const updateProductRating = async (productId, session) => {
  const pipeline = [
    {
      $match: {
        product_id: new mongoose.Types.ObjectId(productId),
      },
    },
    {
      $group: {
        _id: "$product_id",
        avgRating: { $avg: "$rating" },
        total: { $sum: 1 },
      },
    },
  ];

  const [stats] = await repo.aggregate(pipeline, { session });
  const ratings_average = stats ? Number(stats.avgRating.toFixed(1)) : 0;
  const ratings_quantity = stats ? stats.total : 0;

  const updated = await productRepo.updateById(
    productId,
    {
      "ratings.average": ratings_average,
      "ratings.quantity": ratings_quantity,
    },
    { returnDocument: "after", session },
  );
  if (!updated) {
    throw new AppError(404, "Product not found");
  }
  return updated;
};

exports.createReview = async (payload) => {
  const { title, comment, rating, files, productId, userId, session } = payload;
  const data = {
    ...(title && { title }),
    comment,
    rating,
    product_id: productId,
    user_id: userId,
  };

  // check if user has already reviewed the product
  const existingReview = await repo.findOne(
    { product_id: productId, user_id: userId },
    "_id",
    { session },
  );
  if (existingReview) {
    throw new AppError(400, "You have already reviewed this product");
  }

  // check if product exists
  const product = await productRepo.findById(productId, "_id", { session });
  if (!product) {
    throw new AppError(404, "Product not found");
  }

  const reviewImages = [];
  // upload review images if exist
  if (files.length) {
    const uploadedImages = await uploadMultiplePublicFiles(
      files,
      "reviews-images",
      5,
    );
    data.images = uploadedImages.map((file) => {
      reviewImages.push(file.url);
      return file.key;
    });
  }

  const review = await repo.createWithSession(data, session);
  if (!review) {
    throw new AppError(400, "Failed to create review");
  }
  await updateProductRating(productId, session);
  review.images = reviewImages;
  return review;
};

exports.getProductReviews = async (productId, query) => {
  const { page = 1, limit = 10, sort = "-createdAt" } = query;
  const skip = (Number(page) - 1) * Number(limit);
  const sortStage = {
    [sort.replace("-", "")]: sort.startsWith("-") ? -1 : 1,
  };

  const pipeline = [
    {
      $match: {
        product_id: new mongoose.Types.ObjectId(productId),
      },
    },

    {
      $facet: {
        metadata: [{ $count: "total" }],
        reviews: [
          { $sort: sortStage },
          { $skip: skip },
          { $limit: limit },
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
              is_verified_purchase: 1,
              votes: 1,
              images: {
                $map: {
                  input: "$images",
                  as: "img",
                  in: { $concat: [S3_BASE_URL, "/", "$$img"] },
                },
              },
              user_name: {
                $trim: {
                  input: {
                    $concat: ["$user.first_name", " ", "$user.last_name"],
                  },
                },
              },
              user_id: "$user._id",
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
        reviews: "$reviews",
      },
    },
  ];
  const [result] = await repo.aggregate(pipeline);
  return (
    result || {
      totalRecords: 0,
      reviews: [],
    }
  );
};

exports.updateReview = async (reviewId, userId, payload, session) => {
  const { title, rating, comment } = payload;

  // get existing review
  const existingReview = await repo.findOne(
    { _id: reviewId, user_id: userId },
    " product_id rating",
    { lean: true, session },
  );
  if (!existingReview) {
    throw new AppError(404, "Review not found");
  }

  // update review
  const review = await repo.updateOne(
    { _id: reviewId, user_id: userId },
    {
      ...(title && { title }),
      ...(rating && { rating }),
      ...(comment && { comment }),
    },
    { returnDocument: "after", runValidators: true, session },
  );

  // update product rating if rating is changed
  if (rating && rating !== existingReview.rating) {
    await updateProductRating(review.product_id, session);
  }

  return review;
};

exports.deleteReview = async (reviewId, session) => {
  const review = await repo.deleteById(reviewId, { session });
  if (!review) {
    throw new AppError(404, "Review not found");
  }
  await updateProductRating(review.product_id, session);
  return review;
};
