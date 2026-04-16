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
