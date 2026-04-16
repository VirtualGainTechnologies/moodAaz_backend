const router = require("express").Router();

const { catchAsync } = require("../../utils/catch-async");
const { authenticate, authorize, multer } = require("../../middlewares");
const {
  createProduct,
  updateProduct,
  getProductDetails,
  getAllProducts,
  getAdminProductList,
  deleteProduct,
} = require("./product.controller");
const {
  createProductValidator,
  getAllProductsValidator,
  updateProductValidator,
  getAdminProductListValidator,
  productIdValidator,
} = require("./product.validator");

// public
router.get(
  "/:id",
  productIdValidator,
  catchAsync("getProductDetails api", getProductDetails),
);
router.get(
  "/",
  getAllProductsValidator,
  catchAsync("getAllProducts api", getAllProducts),
);

// admin
router.post(
  "/admin/create",
  authenticate,
  authorize("SUPER-ADMIN"),
  multer.any(),
  createProductValidator,
  catchAsync("createProduct api", createProduct),
);
router.put(
  "/admin/:id",
  authenticate,
  authorize("SUPER-ADMIN"),
  updateProductValidator,
  catchAsync("updateProduct api", updateProduct),
);
router.get(
  "/admin/list",
  // authenticate,
  // authorize("SUPER-ADMIN"),
  getAdminProductListValidator,
  catchAsync("getAdminProductList api", getAdminProductList),
);
router.delete(
  "/admin/delete/:id",
  // authenticate,
  // authorize("SUPER-ADMIN"),
  productIdValidator,
  catchAsync("deleteProduct api", deleteProduct),
);

module.exports = router;
