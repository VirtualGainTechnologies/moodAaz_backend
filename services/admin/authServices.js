const { AdminModel } = require("../../models/admin/adminModel");

exports.createAdmin = (data) => {
  return AdminModel.create(data);
};
exports.getAdminByFilter = (filter = {}, projections = null, options = {}) => {
  return AdminModel.findOne(filter, projections, options);
};
exports.updateAdminById = (id, updateObject = {}, options = {}) => {
  return AdminModel.findByIdAndUpdate(id, updateObject, options);
};

exports.updateAdminByFilter = (
  filter = {},
  updateObject = {},
  options = {}
) => {
  return AdminModel.findOneAndUpdate(filter, updateObject, options);
};

exports.getAllAdminByFilter = (
  filter = {},
  projections = null,
  options = {}
) => {
  return AdminModel.find(filter, projections, options);
};

exports.getAdminById = (id, projections = {}, options = {}) => {
  return AdminModel.findById(id, projections, options);
};

exports.getAllSubAdminsByFilter = (options) => {
  const { email, role, page = 0, limit = 10 } = options;

  const filter = {
    ...(role === "ALL" ? { role: { $ne: "SUPER-ADMIN" } } : { role }),
    ...(email && {
      email: { $regex: email, $options: "i" },
    }),
  };

  return AdminModel.aggregate([
    { $match: filter },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $skip: page * Number(limit) },
          { $limit: Number(limit) },
          {
            $project: {
              _id: 1,
              user_name: 1,
              email: 1,
              phone_code: 1,
              phone: 1,
              role: 1,
              status: 1,
              createdAt: 1,
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
        result: "$data",
      },
    },
  ]);
};
