const Cart = require("./cart.model");

// create
exports.create = (payload) => {
  return Cart.create(payload);
};

exports.createWithSession = (payload, session) => {
  return Cart.create([payload], { session }).then((doc) => doc[0]);
};

exports.save = (data) => {
  return Cart.save(data);
};

// get
exports.findOne = (filter = {}, projection = null, options = {}) => {
  return Cart.findOne(filter, projection, options);
};

exports.findById = (id, projection = null, options = {}) => {
  return Cart.findById(id, projection, options);
};

exports.findMany = (filter = {}, projection = null, options = {}) => {
  return Cart.find(filter, projection, (options = {}));
};

exports.aggregate = (pipeline = [], options = {}) => {
  return Cart.aggregate(pipeline).option(options);
};

// update
exports.updateById = (id, payload, options = {}) => {
  return Cart.findByIdAndUpdate(id, payload, options);
};

exports.updateOne = (filter = {}, payload = {}, options = {}) => {
  return Cart.findOneAndUpdate(filter, payload, options);
};

// delete
exports.deleteById = (id, options = {}) => {
  return Cart.findByIdAndDelete(id, options);
};

exports.deleteMany = (filter = {}, options = {}) => {
  return Cart.deleteMany(filter, options);
};
