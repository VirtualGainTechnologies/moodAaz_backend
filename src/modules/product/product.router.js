const router = require("express").Router();

const { catchAsync } = require("../../utils/catch-async");
const { authenticate, authorize, multer } = require("../../middlewares");
const {
  createProduct,
  updateProduct,
  getProductDetails,
  getAllProducts,
} = require("./product.controller");
const {
  createProductValidator,
  getProductDetailsValidator,
  getAllProductsValidator,
  updateProductValidator,
} = require("./product.validator");

router.post(
  "/create",
  authenticate,
  authorize("SUPER-ADMIN"),
  multer.any(),
  createProductValidator,
  catchAsync("createProduct api", createProduct),
);
router.get(
  "/:id",
  authenticate,
  authorize("SUPER-ADMIN"),
  getProductDetailsValidator,
  catchAsync("getProductDetails api", getProductDetails),
);
router.get(
  "/",
  authenticate,
  authorize("SUPER-ADMIN"),
  getAllProductsValidator,
  catchAsync("getAllProducts api", getAllProducts),
);
router.put(
  "/:id",
  authenticate,
  authorize("SUPER-ADMIN"),
  updateProductValidator,
  catchAsync("updateProduct api", updateProduct),
);

module.exports = router;
