const Payment = require("./payment.model");

// create
exports.create = (payload) => {
  return Payment.create(payload);
};

exports.createWithSession = (payload, session) => {
  return Payment.create([payload], { session }).then((doc) => doc[0]);
};

// get
exports.findOne = (filter = {}, projection = null, options = {}) => {
  return Payment.findOne(filter, projection, options);
};

exports.findById = (id, projection = null, options = {}) => {
  return Payment.findById(id, projection, options);
};

exports.findMany = (filter = {}, projection = null, options = {}) => {
  return Payment.find(filter, projection, (options = {}));
};

exports.aggregate = (pipeline = [], options = {}) => {
  return Payment.aggregate(pipeline).option(options);
};

// update
exports.updateById = (id, payload, options = {}) => {
  return Payment.findByIdAndUpdate(id, payload, options);
};

exports.updateOne = (filter = {}, payload = {}, options = {}) => {
  return Payment.findOneAndUpdate(filter, payload, options);
};

exports.bulkWrite = (operations = [], options = {}) => {
  return Payment.bulkWrite(operations, options);
};

// delete
exports.deleteById = (id, options = {}) => {
  return Payment.findByIdAndDelete(id, options);
};

exports.deleteMany = (filter = {}, options = {}) => {
  return Payment.deleteMany(filter, options);
};
