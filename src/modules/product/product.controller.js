const AppError = require("../../utils/app-error");
const service = require("./product.service");

exports.createProduct = async (req, res) => {
  const product = await service.createProduct(req.body, req.files);
  if (!product) {
    throw new AppError(400, "Failed to create product");
  }

  res.status(200).json({
    message: "Product created successfully",
    error: false,
    data: product,
  });
};

exports.getAllProducts = async (req, res) => {
  const products = await service.getAllProducts(req.query);
  if (!products) {
    throw new AppError(400, "Failed to fetch products");
  }
  res.status(200).json({
    message: "Product list fetched successfully",
    error: false,
    data: products,
  });
};

exports.getProductDetails = async (req, res) => {
  const { id } = req.params;
  const product = await service.getProductDetails(id);
  if (!product) {
    throw new AppError(400, "Failed to fetch product details");
  }

  res.status(200).json({
    message: "Product details fetched successfully",
    error: false,
    data: product,
  });
};

exports.updateProduct = async (req, res) => {
  const product = await service.updateProduct(req.params.id, req.body);
  if (!product) {
    throw new AppError(400, "Failed to update product");
  }

  res.status(200).json({
    message: "Product updated successfully",
    error: false,
    data: product,
  });
};

exports.getAdminProductList = async (req, res) => {
  const { products, total } = await service.getAdminProductList(req.query);
  if (!products) {
    throw new AppError(400, "Failed to fetch admin products");
  }
  res.status(200).json({
    message: "Admin product list fetched successfully",
    error: false,
    data: {
      total,
      products,
    },
  });
};

exports.deleteProduct = async (req, res) => {
  const result = await service.deleteProduct(req.params.id);
  if (!result) {
    throw new AppError(400, "Failed to delete product");
  }
  res.status(200).json({
    message: "Product deleted successfully",
    error: false,
    data: null,
  });
};
