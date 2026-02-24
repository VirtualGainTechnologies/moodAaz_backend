const router = require("express").Router();

// module routes
const adminRoutes = require("../modules/admin/admin.router");
const categoryRoutes = require("../modules/category/category.router");
const otpRoutes = require("../modules/otp/otp.router");

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
router.use("/otp", otpRoutes);

module.exports = router;
