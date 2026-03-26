

exports.getProductReviews = async (productId, query) => {
  const { page = 1, limit = 10 } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const [reviewResult, summary] = await Promise.all([
    repo.aggregate([
      {
        $match: {
          product_id: new mongoose.Types.ObjectId(productId),
          status: "APPROVED",
        },
      },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          reviews: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: Number(limit) },
            {
              $lookup: {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user",
              },
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                rating: 1,
                title: 1,
                comment: 1,
                is_verified_purchase: 1,
                createdAt: 1,
                images: {
                  $map: {
                    input: "$images",
                    as: "img",
                    in: { $concat: [S3_BASE_URL, "/", "$$img"] },
                  },
                },
                user: {
                  _id: "$user._id",
                  name: {
                    $trim: {
                      input: {
                        $concat: ["$user.first_name", " ", "$user.last_name"],
                      },
                    },
                  },
                  avatar: {
                    $cond: {
                      if: { $ifNull: ["$user.avatar", false] },
                      then: { $concat: [S3_BASE_URL, "/", "$user.avatar"] },
                      else: null,
                    },
                  },
                },
              },
            },
          ],
        },
      },
    ]),
    getReviewSummary(productId),
  ]);

  const [{ metadata, reviews } = {}] = reviewResult;
  return {
    summary: summary,
    totalRecords: metadata?.[0]?.total ?? 0,
    reviews: reviews ?? [],
  };
};

// summary — cached separately
// computed once, invalidated on any review change
const getReviewSummary = async (productId) => {
  const cached = await reviewCache("SUMMARY").get(productId);
  if (cached) return cached;

  const [summary] = await repo.aggregate([
    {
      $match: {
        product_id: new mongoose.Types.ObjectId(productId),
        status: "APPROVED",
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        average: { $avg: "$rating" },
        star5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
        star4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
        star3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
        star2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
        star1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        total: 1,
        average: { $round: ["$average", 1] },
        breakdown: {
          5: {
            count: "$star5",
            percentage: {
              $round: [
                { $multiply: [{ $divide: ["$star5", "$total"] }, 100] },
                0,
              ],
            },
          },
          4: {
            count: "$star4",
            percentage: {
              $round: [
                { $multiply: [{ $divide: ["$star4", "$total"] }, 100] },
                0,
              ],
            },
          },
          3: {
            count: "$star3",
            percentage: {
              $round: [
                { $multiply: [{ $divide: ["$star3", "$total"] }, 100] },
                0,
              ],
            },
          },
          2: {
            count: "$star2",
            percentage: {
              $round: [
                { $multiply: [{ $divide: ["$star2", "$total"] }, 100] },
                0,
              ],
            },
          },
          1: {
            count: "$star1",
            percentage: {
              $round: [
                { $multiply: [{ $divide: ["$star1", "$total"] }, 100] },
                0,
              ],
            },
          },
        },
      },
    },
  ]);

  const result = summary ?? null;

  if (result) await reviewCache("SUMMARY").set(productId, result);
  return result;
};
