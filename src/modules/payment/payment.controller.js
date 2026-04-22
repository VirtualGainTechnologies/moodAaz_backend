const service = require("./payment.service");

exports.getPaymentByOrder = async (req, res) => {
  const { order_id } = req.params;
  const payment = await service.getPaymentByOrder(order_id);
  if (!payment) {
    throw new AppError(400, "Payment not found");
  }
  res.status(200).json({
    message: "Payment fetched successfully",
    error: false,
    data: payment,
  });
};

exports.refundPayment = async (req, res) => {
  const { payment_id } = req.params;
  const payment = await service.refundPayment(payment_id);
  res.status(200).json({
    message: "Payment refunded successfully",
    error: false,
    data: payment,
  });
};
