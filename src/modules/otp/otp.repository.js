const { OtpModel } = require("./otp.model");

exports.createOtp = (data) => OtpModel.create(data);

exports.findById = (id, projection = null, options = null) =>
  OtpModel.findById(id, projection, options);

exports.deleteById = (id) => OtpModel.findByIdAndDelete(id);

exports.deleteExistingOtp = ({ email, phone }) => {
  return OtpModel.deleteMany({
    ...(email && { email }),
    ...(phone && { phone }),
  });
};

exports.incrementAttempts = (id) =>
  OtpModel.findByIdAndUpdate(id, { $inc: { attempts: 1 } }, { new: true });
