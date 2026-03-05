const Review = require("./review.model");

// create
exports.create = (payload) => {
  return Review.create(payload);
};

// get
exports.findOne = (filter = {}, projection = null, options = {}) => {
  return Review.findOne(filter, projection, options);
};

exports.findById = (id, projection = null, options = {}) => {
  return Review.findById(id, projection, options);
};

exports.findMany = (filter = {}, projection = null, options = {}) => {
  return Review.find(filter, projection, (options = {}));
};

// update
exports.updateById = (id, payload, options = {}) => {
  return Review.findByIdAndUpdate(id, payload, options);
};

// delete
exports.deleteById = (id, options = {}) => {
  return Review.findByIdAndDelete(id, options);
};

exports.deleteMany = (filter = {}, options = {}) => {
  return Review.deleteMany(filter, options);
};
