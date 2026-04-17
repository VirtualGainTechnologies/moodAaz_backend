const Address = require("./address.model");

// create
exports.create = (payload) => {
  return Address.create(payload);
};

// get
exports.findOne = (filter = {}, projection = null, options = {}) => {
  return Address.findOne(filter, projection, options);
};

exports.findById = (id, projection = null, options = {}) => {
  return Address.findById(id, projection, options);
};

exports.findMany = (filter = {}, projection = null, options = {}) => {
  return Address.find(filter, projection, (options = {}));
};

exports.aggregate = (pipeline = [], options = {}) => {
  return Address.aggregate(pipeline).option(options);
};

// update
exports.updateOne = (filter = {}, payload = {}, options = {}) => {
  return Address.findOneAndUpdate(filter, payload, options);
};

exports.updateById = (id, payload = {}, options = {}) => {
  return Address.findByIdAndUpdate(id, payload, options);
};

// delete
exports.deleteById = (id, options = {}) => {
  return Address.findByIdAndDelete(id, options);
};
