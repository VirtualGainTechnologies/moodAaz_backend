const router = require("express").Router();

// module routes
const adminRoutes = require("../modules/admin/admin.routes");
const categoryRoutes = require("../modules/category/category.routes");
const otpRouter = require("../modules/otp/otp.routes");
const userRouter = require("../modules/user/user.routes");

// health check
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

router.use("/admin", adminRoutes);
router.use("/category", categoryRoutes);
router.use("/otp", otpRouter);
router.use("/user", userRouter);

module.exports = router;
