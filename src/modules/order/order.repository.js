const Order = require("./order.model");

// create
exports.create = (payload) => {
  return Order.create(payload);
};

exports.createWithSession = (payload, session) => {
  return Order.create([payload], { session }).then((doc) => doc[0]);
};

// get
exports.findOne = (filter = {}, projection = null, options = {}) => {
  return Order.findOne(filter, projection, options);
};

exports.findById = (id, projection = null, options = {}) => {
  return Order.findById(id, projection, options);
};

exports.findMany = (filter = {}, projection = null, options = {}) => {
  return Order.find(filter, projection, (options = {}));
};

exports.aggregate = (pipeline = [], options = {}) => {
  return Order.aggregate(pipeline).option(options);
};

// update
exports.updateById = (id, payload, options = {}) => {
  return Order.findByIdAndUpdate(id, payload, options);
};

exports.updateOne = (filter = {}, payload = {}, options = {}) => {
  return Order.findOneAndUpdate(filter, payload, options);
};

exports.bulkWrite = (operations = [], options = {}) => {
  return Order.bulkWrite(operations, options);
};

// delete
exports.deleteById = (id, options = {}) => {
  return Order.findByIdAndDelete(id, options);
};

exports.deleteMany = (filter = {}, options = {}) => {
  return Order.deleteMany(filter, options);
};
