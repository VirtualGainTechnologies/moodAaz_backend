class CODProvider {
  async initiatePayment() {
    return {
      status: "PENDING",
      transaction_id: null,
      gateway_order_id: null,
      gateway_response: null,
    };
  }

  async verifyPayment() {
    return {
      verified: true,
      failure_reason: null,
    };
  }

  async refund() {
    return {
      status: "NOT_APPLICABLE",
      refund_id: null,
      refunded_at: null,
    };
  }
}

module.exports = { CODProvider };
