const Product = require("./product.model");

// create
exports.create = (payload) => {
  return Product.create(payload);
};

// get
exports.findOne = (filter = {}, projection = null, options = {}) => {
  return Product.findOne(filter, projection, options);
};

exports.findById = (id, projection = null, options = {}) => {
  return Product.findById(id, projection, options);
};

exports.findMany = (filter = {}, projection = null, options = {}) => {
  return Product.find(filter, projection, (options = {}));
};

// update
exports.updateById = (id, payload, options = {}) => {
  return Product.findByIdAndUpdate(id, payload, options);
};

// delete
exports.deleteById = (id, options = {}) => {
  return Product.findByIdAndDelete(id, options);
};

exports.deleteMany = (filter = {}, options = {}) => {
  return Product.deleteMany(filter, options);
};
