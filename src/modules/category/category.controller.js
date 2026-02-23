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

exports.getCategoryTree = async (req, res) => {
  const tree = await service.getCategoryTree();
  if (!tree) {
    throw new AppError(400, "Failed to fetch categories");
  }
  res.status(200).json({
    message: "Category fetched successfully",
    error: false,
    data: tree,
  });
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await service.updateCategory(req.params.id, req.body);
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    await service.deleteCategory(req.params.id);
    res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    next(err);
  }
};
