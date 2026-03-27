const Wishlist = require("./wishlist.model");

// create
exports.create = (payload) => {
  return Wishlist.create(payload);
};

exports.createWithSession = (payload, session) => {
  return Wishlist.create([payload], { session }).then((doc) => doc[0]);
};

// get
exports.findOne = (filter = {}, projection = null, options = {}) => {
  return Wishlist.findOne(filter, projection, options);
};

exports.findById = (id, projection = null, options = {}) => {
  return Wishlist.findById(id, projection, options);
};

exports.findMany = (filter = {}, projection = null, options = {}) => {
  return Wishlist.find(filter, projection, options);
};

exports.aggregate = (pipeline = [], options = {}) => {
  return Wishlist.aggregate(pipeline).option(options);
};

// update
exports.updateById = (id, payload, options = {}) => {
  return Wishlist.findByIdAndUpdate(id, payload, options);
};

exports.updateOne = (filter = {}, payload = {}, options = {}) => {
  return Wishlist.findOneAndUpdate(filter, payload, options);
};

// delete
exports.deleteById = (id, options = {}) => {
  return Wishlist.findByIdAndDelete(id, options);
};

exports.deleteMany = (filter = {}, options = {}) => {
  return Wishlist.deleteMany(filter, options);
};
