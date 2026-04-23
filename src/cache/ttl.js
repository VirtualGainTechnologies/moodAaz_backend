const TTL = {
  PRODUCT_LIST: 60 * 5, // 5 mins
  PRODUCT_DETAIL: 60 * 10, // 10 mins
  CATEGORY: 60 * 60 * 24, // 24 hrs
  REVIEW_RATINGS: 60 * 60, // 1 hr
  CART: 60 * 60 * 24, // 24 hrs
  WISHLIST: 60 * 60 * 24, // 24 hrs
  MEDIA_LIST: 60 * 60 * 24, // 24 hrs

  // orders
  ORDER_USER_LIST: 60 * 5, // 5 mins
  ORDER_DETAIL: 60 * 5, // 5 mins
  ORDER_ADMIN_LIST: 60 * 2, // 2 mins 
  ORDER_ADMIN_DETAIL: 60 * 2, // 2 mins
};

module.exports = { TTL };
