const Category = require("./category.model");

// create
exports.create = (payload) => {
  return Category.create(payload);
};

// get
exports.findOne = (filter = {}, projection = null, options = {}) => {
  return Category.findOne(filter, projection, options);
};

exports.findById = (id, projection = null, options = {}) => {
  return Category.findById(id, projection, options);
};

exports.findMany = (filter = {}, projection = null, options = {}) => {
  return Category.find(filter, projection, (options = {}));
};

// update
exports.updateById = (id, payload, options = {}) => {
  return Category.findByIdAndUpdate(id, payload, options);
};

// delete
exports.deleteById = (id, options = {}) => {
  return Category.findByIdAndDelete(id, options);
};

exports.deleteMany = (filter = {}, options = {}) => {
  return Category.deleteMany(filter, options);
};
