const router = require("express").Router();

const { catchAsync } = require("../../utils/catch-async");
const { authenticate, authorize, multer } = require("../../middlewares");
const {
  createProduct,
  updateProduct,
  getProductDetails,
  getAllProducts,
  getAdminProductList,
} = require("./product.controller");
const {
  createProductValidator,
  getProductDetailsValidator,
  getAllProductsValidator,
  updateProductValidator,
  getAdminProductListValidator,
} = require("./product.validator");

// public
router.get(
  "/:id",
  getProductDetailsValidator,
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
  authenticate,
  authorize("SUPER-ADMIN"),
  getAdminProductListValidator,
  catchAsync("getAdminProductList api", getAdminProductList),
);

module.exports = router;
