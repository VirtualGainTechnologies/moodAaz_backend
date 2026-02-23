const { AdminModel } = require("./admin.model");

exports.findOne = (filter, projection = null, options = {}) => {
  return AdminModel.findOne(filter, projection, options);
};

exports.create = (payload) => {
  return AdminModel.create(payload);
};

exports.updateByFilter = (filter, update, options = {}) => {
  return AdminModel.findOneAndUpdate(filter, update, options);
};

exports.updateById = (id, update, options) => {
  return AdminModel.findByIdAndUpdate(id, update, options);
};

exports.findById = (id, projection = null, options = null) =>
  AdminModel.findById(id, projection, options);

exports.getAllSubAdmins = (query) => {
  return AdminModel.aggregate(query);
};
