const { CODProvider } = require("./payment.provider");

const getPaymentProvider = (method) => {
  switch (method) {
    case "COD":
      return new CODProvider();

    default:
      throw new Error(`Unsupported payment method: ${method}`);
  }
};

module.exports = { getPaymentProvider };
