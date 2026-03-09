const User = require("./user.model");

// create
exports.create = (payload) => {
  return User.create(payload);
};

// get
exports.findOne = (filter = {}, projection = null, options = {}) => {
  return User.findOne(filter, projection, options);
};

exports.findById = (id, projection = null, options = {}) => {
  return User.findById(id, projection, options);
};

exports.findMany = (filter = {}, projection = null, options = {}) => {
  return User.find(filter, projection, (options = {}));
};

exports.aggregate = (pipeline = [], options = {}) => {
  return User.aggregate(pipeline).option(options);
};

// update
exports.updateOne = (filter = {}, payload = {}, options = {}) => {
  return User.findOneAndUpdate(filter, payload, options);
};
exports.updateById = (id, payload = {}, options = {}) => {
  return User.findByIdAndUpdate(id, payload, options);
};

// delete
exports.deleteById = (id, options = {}) => {
  return User.findByIdAndDelete(id, options);
};

exports.deleteMany = (filter = {}, options = {}) => {
  return User.deleteMany(filter, options);
};
