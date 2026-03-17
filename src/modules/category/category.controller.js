const AppError = require("../../utils/app-error");
const service = require("./category.service");

exports.createCategory = async (req, res) => {
  const category = await service.createCategory(req.body, req.file);
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
  const categories = await service.getAllCategories();
  if (!categories) {
    throw new AppError(400, "Failed to fetch categories");
  }
  res.status(200).json({
    message: "Category fetched successfully",
    error: false,
    data: categories,
  });
};

exports.getSubCategories = async (req, res) => {
  const { id } = req.params;
  const categories = await service.getCategoriesByParent(id);
  if (!categories) {
    throw new AppError(400, "Failed to retrieve subcategories");
  }
  res.status(200).json({
    message: "Subcategories retrieved successfully",
    error: false,
    data: categories,
  });
};

exports.getMainCategories = async (req, res) => {
  const categories = await service.getCategoriesByParent(null);
  if (!categories) {
    throw new AppError(400, "Failed to retrieve main categories");
  }
  res.status(200).json({
    message: "Main categories retrieved successfully",
    error: false,
    data: categories,
  });
};

exports.updateCategory = async (req, res) => {
  const { name } = req.body;
  const payload = { name, id: req.params.id };
  if (req.file) {
    payload.image = req.file;
  }
  const category = await service.updateCategory(payload);
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
