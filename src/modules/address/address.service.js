const AppError = require("../../utils/app-error");
const repo = require("./address.repository");

exports.addAddress = async (payload) => {
  const {
    userId,
    fullName,
    mobileNumber,
    alternateContact,
    locallity,
    fullAddress,
    landmark,
    city,
    state,
    pinCode,
    addressType,
    isDefault = false,
  } = payload;

  if (isDefault) {
    await repo.updateOne(
      { user_id: userId, is_default: true },
      { $set: { is_default: false } },
    );
  }

  const address = await repo.create({
    user_id: userId,
    full_name: fullName,
    mobile_number: mobileNumber,
    ...(alternateContact && { alternate_contact: alternateContact }),
    ...(locallity && { locallity }),
    full_address: fullAddress,
    ...(landmark && { landmark }),
    city,
    state,
    pincode: pinCode,
    address_type: addressType,
    is_default: isDefault,
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

exports.updateAddress = async (payload) => {
  const {
    userId,
    addressId,
    fullName,
    mobileNumber,
    alternateContact,
    locallity,
    fullAddress,
    landmark,
    city,
    state,
    pinCode,
    addressType,
    isDefault,
  } = payload;

  if (isDefault) {
    await repo.updateOne(
      { user_id: userId, is_default: true },
      { $set: { is_default: false } },
    );
  }

  const address = await repo.updateOne(
    { _id: addressId, user_id: userId },
    {
      $set: {
        ...(fullName && { full_name: fullName }),
        ...(mobileNumber && { mobile_number: mobileNumber }),
        ...(alternateContact && { alternate_contact: alternateContact }),
        ...(locallity && { locallity }),
        ...(fullAddress && { full_address: fullAddress }),
        ...(landmark && { landmark }),
        ...(city && { city }),
        ...(state && { state }),
        ...(pinCode && { pincode: pinCode }),
        ...(addressType && { address_type: addressType }),
        ...(typeof isDefault === "boolean" && { is_default: isDefault }),
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
