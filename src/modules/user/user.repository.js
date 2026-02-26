const User = require("./user.model");

// create
exports.create = (payload) => User.create(payload);

// get
exports.findOne = (filter = {}, projection = null, options = {}) =>
  User.findOne(filter, projection, options);

exports.findById = (id, projection = null, options = {}) =>
  User.findById(id, projection, options);

exports.findMany = (filter = {}, projection = null, options = {}) =>
  User.find(filter, projection, options);

// update
exports.updateOne = (filter = {}, payload = {}, options = {}) =>
  User.findOneAndUpdate(filter, payload, options);

exports.updateById = (id, payload = {}, options = {}) =>
  User.findByIdAndUpdate(id, payload, options);

// delete
exports.deleteById = (id, options = {}) =>
  User.findByIdAndDelete(id, options);
