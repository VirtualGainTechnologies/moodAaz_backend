const Admin = require("./admin.model");

// create
exports.create = (payload) => {
  return Admin.create(payload);
};

// get
exports.findOne = (filter = {}, projection = null, options = {}) => {
  return Admin.findOne(filter, projection, options);
};

exports.findById = (id, projection = null, options = {}) => {
  return Admin.findById(id, projection, options);
};

exports.findMany = (filter = {}, projection = null, options = {}) => {
  return Admin.find(filter, projection, (options = {}));
};

// update
exports.updateOne = (filter = {}, payload = {}, options = {}) => {
  return Admin.findOneAndUpdate(filter, payload, options);
};
exports.updateById = (id, payload = {}, options = {}) => {
  return Admin.findByIdAndUpdate(id, payload, options);
};

// delete
exports.deleteById = (id, options = {}) => {
  return Admin.findByIdAndDelete(id, options);
};
