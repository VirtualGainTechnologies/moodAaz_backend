const Media = require("./media.model");

// create
exports.create = (payload) => {
  return Media.create(payload);
};

// get
exports.findOne = (filter = {}, projection = null, options = {}) => {
  return Media.findOne(filter, projection, options);
};

exports.findById = (id, projection = null, options = {}) => {
  return Media.findById(id, projection, options);
};

exports.findMany = (filter = {}, projection = null, options = {}) => {
  return Media.find(filter, projection, (options = {}));
};

// update
exports.updateById = (id, payload, options = {}) => {
  return Media.findByIdAndUpdate(id, payload, options);
};

// delete
exports.deleteById = (id, options = {}) => {
  return Media.findByIdAndDelete(id, options);
};

exports.deleteMany = (filter = {}, options = {}) => {
  return Media.deleteMany(filter, options);
};
