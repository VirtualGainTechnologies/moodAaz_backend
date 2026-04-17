const AppError = require("../../utils/app-error");
const repo = require("./address.repository");

exports.addAddress = async (payload) => {
  const {
    userId,
    fullName,
    isDefault = false,
    label,
    phone,
    line1,
    line2,
    city,
    state,
    pincode,
    country,
  } = payload;

  if (isDefault) {
    await repo.updateOne(
      { user_id: userId, is_default: true },
      { $set: { is_default: false } },
      { returnDocument: "after", select: "_id" },
    );
  }

  const address = await repo.create({
    user_id: userId,
    full_name: fullName,
    is_default: isDefault,
    label,
    phone,
    line1,
    ...(line2 && { line2 }),
    city,
    state,
    pincode,
    country,
  });

  if (!address) {
    throw new AppError(400, "Failed to add address");
  }
  return address;
};

exports.getAddresses = async (userId) => {
  const addresses = await repo.findMany(
    { user_id: userId },
    "-updatedAt -createdAt",
    {
      lean: true,
    },
  );
  if (!addresses) {
    throw new AppError(400, "Failed to get addresses");
  }
  return addresses;
};

exports.updateAddress = async ( payload) => {
  const {
    userId,
    addressId,
    fullName,
    isDefault = false,
    label,
    phone,
    line1,
    line2,
    city,
    state,
    pincode,
    country,
  } = payload;

  if (isDefault) {
    await repo.updateOne(
      { user_id: userId, is_default: true },
      { $set: { is_default: false } },
      { returnDocument: "after", select: "_id" },
    );
  }

  const address = await repo.updateOne(
    { _id: addressId, user_id: userId },
    {
      $set: {
        ...(fullName && { full_name: fullName }),
        ...(label && { label }),
        ...(phone && { phone }),
        ...(line1 && { line1 }),
        ...(line2 && { line2 }),
        ...(city && { city }),
        ...(state && { state }),
        ...(pincode && { pincode }),
        ...(country && { country }),
        is_default: isDefault,
      },
    },
    { returnDocument: "after", select: "-createdAt -updatedAt" },
  );
  if (!address) {
    throw new AppError(400, "Address not found");
  }

  return address;
};

exports.deleteAddress = async (payload) => {
  const { userId, addressId } = payload;
  const address = await repo.findOne(
    {
      _id: addressId,
      user_id: userId,
    },
    "_id",
    { lean: true },
  );
  if (!address) {
    throw new AppError(400, "Address not found");
  }

  const deleted = await repo.deleteById(addressId);
  if (!deleted) {
    throw new AppError(400, "Failed to delete address");
  }

  return true;
};

exports.setDefault = async (payload) => {
  const { userId, addressId } = payload;
  await repo.updateOne(
    { user_id: userId, is_default: true },
    { $set: { is_default: false } },
    { returnDocument: "after", select: "_id" },
  );

  const address = await repo.updateOne(
    { _id: addressId, user_id: userId },
    { $set: { is_default: true } },
    { returnDocument: "after" },
  );
  if (!address) {
    throw new AppError(400, "Address not found");
  }
  return address;
};
