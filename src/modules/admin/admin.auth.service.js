const bcrypt = require("bcryptjs");

const AppError = require("../../utils/AppError");
const repo = require("./admin.repository");
const { generateJwtToken } = require("../../utils/jwt");
const { sendEmailOtp, verifyOtp } = require("../otp/otp.service");

exports.registerSuperAdmin = async (body, meta) => {
  const existing = await repo.findOne({});
  if (existing) {
    throw new AppError(400, "Super admin already exists");
  }

  const token = generateJwtToken({ email: body.email, type: "ADMIN" });
  if (token.error) throw new AppError(400, token.message);

  const admin = await repo.create({
    user_name: body.userName,
    phone_code: body.phoneCode,
    phone: body.phone,
    email: body.email,
    password: body.password,
    token: token.data,
    role: "SUPER-ADMIN",
    last_login_ip: meta.ip,
    last_login_location: meta.location,
    last_login_date: Date.now(),
  });

  if (!admin) throw new AppError(400, "Failed to register super admin");

  return { token: admin.token };
};

exports.upsertSubAdmin = async (body, meta) => {
  if (!body.userId) {
    const existing = await repo.findOne({
      $or: [
        { user_name: body.userName },
        { email: body.email },
        { phone_code: body.phoneCode, phone: body.phone },
      ],
    });
    if (existing) throw new AppError(400, "Account already exists");

    const token = generateJwtToken({ email: body.email, role: body.role });
    if (token.error) throw new AppError(400, token.message);

    return repo.create({
      user_name: body.userName,
      phone_code: body.phoneCode,
      phone: body.phone,
      email: body.email,
      password: body.password,
      token: token.data,
      role: body.role,
      last_login_ip: meta.ip,
      last_login_location: meta.location,
      last_login_date: Date.now(),
    });
  }

  return repo.updateById(
    body.userId,
    {
      user_name: body.userName,
      phone_code: body.phoneCode,
      phone: body.phone,
      email: body.email,
      ...(body.password && {
        password: await bcrypt.hash(body.password, 12),
      }),
      role: body.role,
    },
    { new: true },
  );
};

exports.sendLoginOtp = async (body) => {
  const { email, password } = body;

  // check admin exists
  const admin = await repo.findOne(
    { email },
    "_id email phone phone_code is_login_attempt_exceeded login_count password status",
    {},
  );

  if (!admin) {
    throw new AppError(400, "Email is not registered");
  }

  //  check admin status
  if (admin.status === "BLOCKED") {
    throw new AppError(
      400,
      "Your account has been temporarily restricted due to security concerns",
    );
  }

  // check login attempt exceeded
  if (admin.is_login_attempt_exceeded) {
    throw new AppError(
      400,
      "You have exceeded the allowed number of login attempts, reset password to login again",
    );
  }

  // verify password
  const isPasswordMatched = await admin.comparePassword(password);
  if (!isPasswordMatched) {
    await admin.incrementLoginCount();
    // block admin if limit exceeded
    if (admin.login_count >= 5) {
      const updatedAdmin = await repo.updateById(
        admin._id,
        { is_login_attempt_exceeded: true },
        { new: true },
      );
      if (!updatedAdmin) {
        throw new AppError(400, "Error in updating the admin");
      }
    }

    throw new AppError(400, "Incorrect password");
  }

  // reset login count on success
  if (admin.login_count > 0) {
    const updatedCount = await repo.updateById(
      admin._id,
      { login_count: 0 },
      { new: true },
    );
    if (!updatedCount) {
      throw new AppError(400, "Failed to update login count");
    }
  }

  // send otp
  const result = await sendEmailOtp(email, "login");
  if (result.error) {
    throw new AppError(400, result.message);
  }
  return result;
};

exports.verifyLoginOtp = async (body) => {
  const { otpId, otp, email } = body;

  const verified = await verifyOtp(otpId, otp);
  if (verified.error) {
    throw new AppError(400, verified.message);
  }

  const admin = await repo.findOne({ email });
  if (!admin) {
    throw new AppError(400, "Email not registered");
  }

  const token = generateJwtToken({ email: admin.email, type: "ADMIN" });
  if (token.error) {
    throw new AppError(400, token.message);
  }

  const updatedToken = await repo.updateOne(
    { email: admin.email },
    {
      token: token.data,
      last_login_date: Date.now(),
    },
    { returnDocument: "after" },
  );
  if (!updatedToken) {
    throw new AppError(400, "Failed to update token");
  }

  return {
    token: token.data,
    role: admin.role,
    user_name: admin.user_name,
    email: admin.email,
  };
};

exports.getAdminProfile = async (adminId) => {
  const admin = await repo.findById(
    adminId,
    "-_id role user_name phone_code phone email status",
    { lean: true },
  );
  if (!admin) {
    throw new AppError(400, "Failed to fetch admin data");
  }

  if (admin.status == "BLOCKED") {
    throw new AppError(
      400,
      "Your account has been temporarily restricted due to security concerns",
    );
  }
  return admin;
};

exports.getAllSubAdmins = async (query) => {
  const { email, role, page = 0, limit = 10 } = query;
  const pipeline = [
    {
      $match: {
        ...(role === "ALL" ? { role: { $ne: "SUPER-ADMIN" } } : { role }),
        ...(email && {
          email: { $regex: email, $options: "i" },
        }),
      },
    },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $skip: page * Number(limit) },
          { $limit: Number(limit) },
          {
            $project: {
              _id: 1,
              user_name: 1,
              email: 1,
              phone_code: 1,
              phone: 1,
              role: 1,
              status: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        totalRecords: {
          $ifNull: [{ $arrayElemAt: ["$metadata.total", 0] }, 0],
        },
        data: "$data",
      },
    },
  ];
  const result = await repo.aggregate(pipeline);
  if (!result) {
    throw new AppError(400, "Failed to fetch admins");
  }
  return result;
};

exports.logout = async (adminId) => {
  if (!adminId) {
    throw new AppError(400, "Admin id is missing");
  }
  return await repo.updateById(adminId, { token: "" }, { new: true });
};
