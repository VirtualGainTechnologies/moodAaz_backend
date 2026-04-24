const service = require("./order.service");

exports.placeOrder = async (req, session) => {
  const result = await service.placeOrder(
    {
      user_id: req.user._id,
      address_id: req.body.addressId,
      payment_method: req.body.paymentMethod,
    },
    session,
  );
  return {
    message: "Order placed successfully",
    error: false,
    data: result,
  };
};

exports.getUserOrders = async (req, res) => {
  const orders = await service.getUserOrders({
    userId: req.user._id,
    status: req.query.status,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
  });
  res.status(200).json({
    message: "Orders fetched successfully",
    error: false,
    data: orders,
  });
};

exports.getOrderById = async (req, res) => {
  const order = await service.getOrderById(req.params.id, req.user._id);
  res.status(200).json({
    message: "Order fetched successfully",
    error: false,
    data: order,
  });
};

exports.sendCancelOrderOtp = async (req, res) => {
  const result = await service.sendCancelOrderOtp({
    order_id: req.params?.id,
    user_id: req.user?._id,
    reason: req.body?.reason,
  });

  res.status(200).json({
    message: "OTP sent successfully",
    error: false,
    data: result,
  });
};

exports.verifyCancelOrderOtp = async (req, session) => {
  await service.verifyCancelOrderOtp(
    {
      order_id: req.params?.id,
      user_id: req.user?._id,
      otpId: req.body?.otpId,
      otp: req.body?.otp,
      reason: req.body?.reason,
    },
    session,
  );
  return {
    message: "Order cancelled successfully",
    error: false,
    data: null,
  };
};

exports.getAdminOrders = async (req, res) => {
  const result = await service.getAdminOrders(req.query);

  res.status(200).json({
    message: "Orders fetched successfully",
    error: false,
    data: result,
  });
};

exports.updateOrderStatus = async (req, session) => {
  const order = await service.updateOrderStatus(
    {
      order_id: req.params.id,
      status: req.body.status,
      note: req.body.note,
    },
    session,
  );
  return {
    message: "Order status updated",
    error: false,
    data: order,
  };
};
