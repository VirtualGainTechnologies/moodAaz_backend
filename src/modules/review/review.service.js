const mongoose = require("mongoose");
const repo = require("./review.repository");
const productRepo = require("../product/product.repository");
const AppError = require("../../utils/app-error");

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

exports.createReview = async (productId, userId, payload, session) => {
  const { title, comment, rating } = payload;
  const review = await repo.createWithSession(
    {
      ...(title && { title }),
      comment,
      rating,
      product_id: productId,
      user_id: userId,
    },
    session,
  );
  if (!review) {
    throw new AppError(400, "Failed to create review");
  }
  await updateProductRating(productId, session);
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
              "votes.likes": 1,
              "votes.dislikes": 1,
              createdAt: 1,
              user: {
                _id: "$user._id",
                name: "$user.name",
              },
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
  const review = await repo.updateOne(
    { _id: reviewId, user_id: userId },
    {
      ...(title && { title }),
      ...(rating && { rating }),
      ...(comment && { comment }),
    },
    { returnDocument: "after", runValidators: true, session },
  );
  if (!review) {
    throw new AppError(404, "Review not found");
  }
  await updateProductRating(review.product_id, session);
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
