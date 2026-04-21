const router = require("express").Router();

const { authenticate, authorize } = require("../../middlewares");
const { catchAsync } = require("../../utils/catch-async");
const {
  getAddresses,
  addAddress,
  updateAddress,
  setDefault,
  deleteAddress,
} = require("./address.controller");
const {
  addressIdValidator,
  addAddressValidator,
  updateAddressValidator,
} = require("./address.validator");

router.use(authenticate, authorize("USER"));
router.get("/all", catchAsync("getAddresses api", getAddresses));
router.post(
  "/add",
  addAddressValidator,
  catchAsync("addAddress api", addAddress),
);
router.put(
  "/:id",
  updateAddressValidator,
  catchAsync("updateAddress api", updateAddress),
);
router.patch(
  "/:id/default",
  addressIdValidator,
  catchAsync("setDefault api", setDefault),
);
router.delete(
  "/:id",
  addressIdValidator,
  catchAsync("deleteAddress api", deleteAddress),
);

module.exports = router;
