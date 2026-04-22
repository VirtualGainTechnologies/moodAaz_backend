const service = require("./order.service");

exports.placeOrder = async (req, session) => {
  const result = await service.placeOrder(
    {
      user_id: req.user._id,
      address_id: req.body.address_id,
      payment_method: req.body.payment_method,
    },
    session,
  );
  return {
    message: "Order placed successfully",
    error: false,
    data: result,
  };
};

exports.getMyOrders = async (req, res) => {
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

exports.cancelOrder = async (req, session) => {
  const order = await service.cancelOrder(
    {
      order_id: req.params.id,
      user_id: req.user._id,
      reason: req.body.reason,
    },
    session,
  );
  return {
    message: "Order cancelled successfully",
    error: false,
    data: order,
  };
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
