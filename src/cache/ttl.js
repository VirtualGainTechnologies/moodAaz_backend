const TTL = {
  PRODUCT_LIST: 60 * 5, // 5 mins
  PRODUCT_DETAIL: 60 * 10, // 10 mins
  CATEGORY: 60 * 60 * 24, // 24 hrs
  REVIEW_RATINGS: 60 * 60, // 1 hr
  CART: 60 * 60 * 24, // 24 hrs
};

module.exports = { TTL };
