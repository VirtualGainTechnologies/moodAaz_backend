const AppError = require("../../utils/app-error");
const repo = require("./user.repository");

exports.getUserProfile = async (userId) => {
  const user = await repo.findById(
    userId,
    "email first_name last_name phone phone_code gender date_of_birth",
    {
      lean: true,
    },
  );
  if (!user) {
    throw new AppError(400, "Failed to get user details");
  }

  return user;
};

exports.updateUserProfile = async (payload) => {
  const { userId, firstName, lastName, gender } = payload;
  const user = await repo.updateById(
    userId,
    { first_name: firstName, last_name: lastName, gender },
    {
      returnDocument: "after",
      select:
        "_id first_name last_name gender email phone_code phone email_verified phone_verified role",
    },
  );
  if (!user) {
    throw new AppError(400, "Failed to update user profile");
  }
  return user;
};

