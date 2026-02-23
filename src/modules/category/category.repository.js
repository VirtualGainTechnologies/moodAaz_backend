const Category = require("./category.model");

exports.create = (data) => Category.create(data);

exports.findOne = (filter = {}, projection = null, options = {}) =>
  Category.findOne(filter, projection, options);

exports.findById = (id, projection = null, options = {}) =>
  Category.findById(id, projection, options);

exports.findAll = (filter = {}, projection = null, options) =>
  Category.find(filter, projection, options);

exports.updateById = (id, data, options = {}) =>
  Category.findByIdAndUpdate(id, data, options);

exports.deleteById = (id) => Category.findByIdAndDelete(id);
