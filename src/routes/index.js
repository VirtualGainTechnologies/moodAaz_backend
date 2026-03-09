const router = require("express").Router();

// module routes
const adminRoutes = require("../modules/admin/admin.router");
const categoryRoutes = require("../modules/category/category.router");
const otpRoutes = require("../modules/otp/otp.router");
const mediaRoutes = require("../modules/media/media.router");
const productRoutes = require("../modules/product/product.router");
const reviewRoutes = require("../modules/review/review.router");
const userRoutes = require("../modules/user/user.router");

// health check
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

router.use("/admin", adminRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/reviews", reviewRoutes);
router.use("/otp", otpRoutes);
router.use("/media", mediaRoutes);
router.use("/user", userRoutes);

module.exports = router;
