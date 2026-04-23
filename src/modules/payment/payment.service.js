const repo = require("./payment.repository");
const { getPaymentProvider } = require("./payment.factory");
const AppError = require("../../utils/app-error");

exports.initiatePayment = async (payload, session) => {
  const { order_id, user_id, method, amount } = payload;
  const provider = getPaymentProvider(method);
  const result = await provider.initiatePayment({ order_id, amount });

  const payment = await repo.createWithSession(
    {
      order_id,
      user_id,
      method,
      amount,
      status: result.status,
    },
    session,
  );
  if (!payment) {
    throw new AppError(400, "Failed to create payment record");
  }
  return payment;
};

exports.markCODPaid = async (payment_id, session) => {
  const payment = await repo.updateById(
    payment_id,
    { status: "PAID", paid_at: new Date() },
    { returnDocument: "after", session },
  );
  if (!payment) {
    throw new AppError(400, "Failed to mark COD payment as paid");
  }
  return payment;
};

exports.getPaymentByOrder = (order_id) => {
  const payment = repo.findOne({ order_id }, "-createdAt -updatedAt", {
    lean: true,
  });
  if (!payment) {
    throw new AppError(400, "Payment not found for this order");
  }
  return payment;
};

exports.refundPayment = async (payment_id) => {
  const payment = await repo.findById(payment_id, "-createdAt -updatedAt", {
    lean: true,
  });
  if (!payment) {
    throw new AppError(400, "Payment not found");
  }
  const provider = getPaymentProvider(payment.method);
  const result = await provider.refund({
    order_id: payment.order_id,
    amount: payment.amount,
  });

  const updatedPayment = await repo.updateById(
    payment_id,
    {
      status: "REFUNDED",
      refund_amount: payment.amount,
      refunded_at: Date.now,
    },
    { returnDocument: "after" },
  );
  if (!updatedPayment) {
    throw new AppError(400, "Failed to update payment record");
  }
  return updatedPayment;
};
