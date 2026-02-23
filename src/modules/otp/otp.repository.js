const Otp = require("./otp.model");

// create
exports.create = (payload) => {
  return Otp.create(payload);
};

// get
exports.findOne = (filter = {}, projection = null, options = {}) => {
  return Otp.findOne(filter, projection, options);
};

exports.findById = (id, projection = null, options = {}) => {
  return Otp.findById(id, projection, options);
};

exports.findMany = (filter = {}, projection = null, options = {}) => {
  return Otp.find(filter, projection, (options = {}));
};

// update
exports.updateById = (id, payload, options = {}) => {
  return Otp.findByIdAndUpdate(id, payload, options);
};

// delete
exports.deleteById = (id, options = {}) => {
  return Otp.findByIdAndDelete(id, options);
};

exports.deleteMany = (filter = {}, options = {}) => {
  return Otp.deleteMany(filter, options);
};
