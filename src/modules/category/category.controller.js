const AppError = require("../../utils/AppError");
const service = require("./category.service");

exports.createCategory = async (req, res) => {
  const category = await service.createCategory(req.body);
  if (!category) {
    throw new AppError(400, "Failed to create category");
  }

  res.status(200).json({
    message: "Category created successfully",
    error: false,
    data: category,
  });
};

exports.getAllCategories = async (req, res) => {
  const tree = await service.getAllCategories();
  if (!tree) {
    throw new AppError(400, "Failed to fetch categories");
  }
  res.status(200).json({
    message: "Category fetched successfully",
    error: false,
    data: tree,
  });
};

exports.updateCategory = async (req, res) => {
  const { name } = req.body;
  const category = await service.updateCategory(req.params.id, name);
  if (!category) {
    throw new AppError(400, "Failed to update category");
  }
  res.status(200).json({
    message: "Category updated successfully",
    error: false,
    data: category,
  });
};

exports.deleteCategory = async (req, res) => {
  const isDeleted = await service.deleteCategory(req.params.id);
  if (!isDeleted) {
    throw new AppError(400, "Failed to delete category");
  }
  res.status(200).json({
    message: "Category deleted successfully",
    error: false,
    data: null,
  });
};
