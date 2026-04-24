const mongoose = require("mongoose");
const moment = require("moment-timezone");

const repo = require("./order.repository");
const cache = require("./order.cache");
const paymentService = require("../payment/payment.service");
const addressRepo = require("../address/address.repository");
const cartRepo = require("../cart/cart.repository");
const productRepo = require("../product/product.repository");
const userRepo = require("../user/user.repository");
const AppError = require("../../utils/app-error");
const {
  S3_TEST_PUBLIC_BASE_URL,
  S3_PROD_PUBLIC_BASE_URL,
  NODE_ENV,
} = require("../../config/env");
const {
  sendEmailOtp,
  sendMobileOtp,
  verifyOtp,
} = require("../otp/otp.service");

const IST = "Asia/Kolkata";
const S3_BASE_URL =
  NODE_ENV === "production" ? S3_PROD_PUBLIC_BASE_URL : S3_TEST_PUBLIC_BASE_URL;

const getExpectedDeliveryDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7); // flat 7 days for all orders
  return date.getTime();
};

exports.placeOrder = async (payload, session) => {
  const { user_id, address_id, payment_method = "COD" } = payload;

  // 1. validate address
  const address = await addressRepo.findOne(
    { _id: address_id, user_id },
    "-createdAt -updatedAt",
    { lean: true, session },
  );
  if (!address) {
    throw new AppError(400, "Address not found");
  }

  // 2. fetch cart
  const cart = await cartRepo.findOne({ user_id }, "items", {
    lean: true,
    populate: {
      path: "items.product_id",
      select: "name variants variants_images image_attribute",
    },
    session,
  });
  if (!cart) throw new AppError(400, "Cart not found");
  if (cart.items.length === 0) throw new AppError(400, "Cart is empty");

  // 3. snapshot items at current prices
  const orderItems = cart.items.map((item) => {
    const product = item.product_id;

    // find the exact variant from product.variants array
    const variant = product.variants.find(
      (v) => v._id.toString() === item.variant_id.toString(),
    );
    if (!variant) {
      throw new AppError(400, `Variant not found for product: ${product.name}`);
    }

    // check stock
    if (variant.stock < item.quantity) {
      throw new AppError(
        400,
        `Insufficient stock for "${product.name}" - only ${variant.stock} left`,
      );
    }

    // thumbnail image
    const colorValue = variant.attributes?.get
      ? variant.attributes.get(product.image_attribute)
      : variant.attributes?.[product.image_attribute];
    const variantImage = product.variants_images.find(
      (vi) => vi.value?.toLowerCase() === colorValue?.toLowerCase(),
    );
    const thumbnail = variantImage?.thumbnail || null;

    return {
      product_id: product._id,
      variant_id: variant._id,
      sku: variant.sku,
      name: product.name,
      image: thumbnail,
      mrp_price: variant.price,
      sale_price: variant.sale_price,
      quantity: item.quantity,
      attributes: variant.attributes,
      total_mrp: variant.price * item.quantity,
      total_sale: variant.sale_price * item.quantity,
    };
  });

  // 4. calculate totals
  let mrp_price = 0,
    sale_price = 0;
  orderItems.forEach((item) => {
    mrp_price += item.total_mrp;
    sale_price += item.total_sale;
  });
  const shipping_charge = 0;
  const discount = mrp_price - sale_price;
  const total = sale_price + shipping_charge;

  // 5. snapshot shipping address
  const shipping_address = {
    address_id: address._id,
    address_type: address.address_type,
    full_name: address.full_name,
    mobile_number: address.mobile_number,
    alternate_contact: address.alternate_contact,
    locallity: address.locallity,
    full_address: address.full_address,
    landmark: address.landmark,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
  };

  // 6. create order
  const order = await repo.createWithSession(
    {
      user_id,
      items: orderItems,
      shipping_address,
      payment_method,
      mrp_price,
      sale_price,
      shipping_charge,
      discount,
      total,
      status: "PENDING",
      status_history: [
        {
          status: "PENDING",
          note: "Order placed successfully",
        },
      ],
      expected_delivery_date: getExpectedDeliveryDate(),
    },
    session,
  );

  // 7. create payment record
  const payment = await paymentService.initiatePayment(
    {
      order_id: order._id,
      user_id,
      method: payment_method,
      amount: total,
    },
    session,
  );

  // 8. link payment to order
  const updatedOrder = await repo.updateById(
    order._id,
    {
      payment_id: payment._id,
      status: "CONFIRMED",
      $push: {
        status_history: {
          status: "CONFIRMED",
          note: "Payment initiated",
        },
      },
    },
    { returnDocument: "after", session },
  );
  if (!updatedOrder) {
    throw new AppError(400, "Failed to update order with payment details");
  }

  // 9. clear cart
  const updatedCart = await cartRepo.updateOne(
    { user_id },
    { $set: { items: [] } },
    { returnDocument: "after", session },
  );
  if (!updatedCart) {
    throw new AppError(400, "Failed to clear cart");
  }

  // 10. update stock
  const bulkOps = orderItems.map((item) => ({
    updateOne: {
      filter: {
        _id: item.product_id,
        "variants._id": item.variant_id,
      },
      update: {
        $inc: {
          "variants.$.stock": -item.quantity,
          total_stock: -item.quantity,
        },
      },
    },
  }));
  await productRepo.bulkWrite(bulkOps, { session });
  await cache.invalidateOnOrderPlace(user_id);
  return order;
};

exports.getUserOrders = async (query) => {
  let { userId, status, page = 1, limit = 10 } = query;
  const cached = await cache("USER_LIST").get(userId, query);
  if (cached) return cached;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  const pipeline = [
    {
      $match: {
        user_id: new mongoose.Types.ObjectId(userId),
        ...(status
          ? { status: { $in: status.split(",").map((s) => s.toUpperCase()) } }
          : {}),
      },
    },
    {
      $sort: { date: -1 },
    },
    {
      $facet: {
        meta: [{ $count: "total" }],
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              order_id: 1,
              items: {
                $map: {
                  input: "$items",
                  as: "item",
                  in: {
                    product_id: "$$item.product_id",
                    variant_id: "$$item.variant_id",
                    sku: "$$item.sku",
                    name: "$$item.name",
                    image: {
                      $cond: {
                        if: { $ifNull: ["$$item.image", false] },
                        then: {
                          $concat: [S3_BASE_URL, "/", "$$item.image"],
                        },
                        else: null,
                      },
                    },
                    mrp_price: "$$item.mrp_price",
                    sale_price: "$$item.sale_price",
                    quantity: "$$item.quantity",
                    attributes: "$$item.attributes",
                    total_mrp: "$$item.total_mrp",
                    total_sale: "$$item.total_sale",
                  },
                },
              },
              payment_method: 1,
              sale_price: 1,
              mrp_price: 1,
              shipping_charge: 1,
              discount: 1,
              total: 1,
              status: 1,
              expected_delivery_date: 1,
              cancelled_at: 1,
              cancellation_reason: 1,
              date: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        total: { $ifNull: [{ $arrayElemAt: ["$meta.total", 0] }, 0] },
        orders: "$data",
      },
    },
  ];
  const [result] = await repo.aggregate(pipeline);
  await cache("USER_LIST").set(userId, query, result);

  return (
    result || {
      total: 0,
      orders: [],
    }
  );
};

exports.getOrderById = async (order_id, user_id) => {
  const cached = await cache("DETAIL").get(order_id);
  if (cached) return cached;

  const pipeline = [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(order_id),
        user_id: new mongoose.Types.ObjectId(user_id),
      },
    },
    {
      $lookup: {
        from: "payments",
        localField: "payment_id",
        foreignField: "_id",
        as: "payment",
        pipeline: [
          {
            $project: {
              method: 1,
              status: 1,
              transaction_id: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: "$payment",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        order_id: 1,
        items: {
          $map: {
            input: "$items",
            as: "item",
            in: {
              product_id: "$$item.product_id",
              variant_id: "$$item.variant_id",
              sku: "$$item.sku",
              name: "$$item.name",
              image: {
                $cond: {
                  if: { $ifNull: ["$$item.image", false] },
                  then: {
                    $concat: [S3_BASE_URL, "/", "$$item.image"],
                  },
                  else: null,
                },
              },
              mrp_price: "$$item.mrp_price",
              sale_price: "$$item.sale_price",
              quantity: "$$item.quantity",
              attributes: "$$item.attributes",
              total_mrp: "$$item.total_mrp",
              total_sale: "$$item.total_sale",
            },
          },
        },
        shipping_address: 1,
        payment_method: 1,
        payment: 1,
        sale_price: 1,
        mrp_price: 1,
        shipping_charge: 1,
        discount: 1,
        total: 1,
        status: 1,
        status_history: 1,
        expected_delivery_date: 1,
        delivered_at: 1,
        cancelled_at: 1,
        cancellation_reason: 1,
        date: 1,
      },
    },
  ];

  const [order] = await repo.aggregate(pipeline);
  if (!order) {
    throw new AppError(404, "Order not found");
  }
  await cache("DETAIL").set(order_id, order);
  return order;
};

exports.sendCancelOrderOtp = async (payload) => {
  const { order_id, user_id, reason = "Cancelled by user" } = payload;
  const user = await userRepo.findById(
    user_id,
    "email email_verified phone_verified phone_code phone",
    { lean: true },
  );
  if (!user) {
    throw new AppError(404, "User not found");
  }

  const order = await repo.findOne({ _id: order_id, user_id }, "status", {
    lean: true,
  });
  if (!order) {
    throw new AppError(404, "Order not found");
  }
  if (!["PENDING", "CONFIRMED"].includes(order.status)) {
    throw new AppError(
      400,
      `Order cannot be cancelled in '${order.status}' status`,
    );
  }

  if (user.phone_verified) {
    const result = await sendMobileOtp(user.phone_code, user.phone);
    return { otpId: result.otpId, reason };
  } else if (user.email_verified) {
    const result = await sendEmailOtp(user.email, "CANCEL_ORDER");
    return { otpId: result.otpId, reason };
  } else {
    throw new AppError(
      400,
      "Verify your email or phone number to receive OTP.",
    );
  }
};

exports.verifyCancelOrderOtp = async (payload, session) => {
  const { order_id, user_id, otpId, otp, reason = "" } = payload;
  const verified = await verifyOtp(otpId, otp);
  if (!verified) {
    throw new AppError(400, "Failed to verify otp");
  }

  const order = await repo.findOne(
    { _id: order_id, user_id },
    "-status_history",
    { lean: true, session },
  );
  if (!order) {
    throw new AppError(404, "Order not found");
  }

  if (!["PENDING", "CONFIRMED"].includes(order.status)) {
    throw new AppError(
      400,
      `Order cannot be cancelled in '${order.status}' status`,
    );
  }

  // update order status
  const updatedOrder = await repo.updateById(
    order_id,
    {
      status: "CANCELLED",
      cancelled_at: Date.now(),
      cancellation_reason: reason,
      $push: {
        status_history: {
          status: "CANCELLED",
          note: reason || "Cancelled by user",
        },
      },
    },
    { returnDocument: "after", session },
  );
  if (!updatedOrder) {
    throw new AppError(400, "Failed to cancel order");
  }

  // update stock
  const bulkOps = order.items.map((item) => ({
    updateOne: {
      filter: {
        _id: item.product_id,
        "variants._id": item.variant_id,
      },
      update: {
        $inc: {
          "variants.$.stock": item.quantity,
          total_stock: item.quantity,
        },
      },
    },
  }));
  await productRepo.bulkWrite(bulkOps, { session });
  await cache.invalidateOnOrderUpdate(user_id, order_id);
  return true;
};

// admin
exports.getAdminOrders = async (query) => {
  const cached = await cache("ADMIN_LIST").get(query);
  if (cached) return cached;

  let { status, from, to, paymentMethod, search, page = 1, limit = 10 } = query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  const match = {
    ...(status ? { status: status.toUpperCase() } : {}),
    ...(paymentMethod ? { payment_method: paymentMethod.toUpperCase() } : {}),
    ...(from &&
      to && {
        date: {
          $gte: moment.tz(from, "YYYY-MM-DD", IST).startOf("day").valueOf(),
          $lte: moment.tz(to, "YYYY-MM-DD", IST).endOf("day").valueOf(),
        },
      }),
  };

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user",
        pipeline: [
          {
            $project: {
              email: 1,
              phone: 1,
              full_name: {
                $trim: {
                  input: {
                    $concat: [
                      { $ifNull: ["$first_name", ""] },
                      {
                        $cond: {
                          if: {
                            $and: [
                              { $ifNull: ["$first_name", false] },
                              { $ifNull: ["$last_name", false] },
                            ],
                          },
                          then: " ",
                          else: "",
                        },
                      },
                      { $ifNull: ["$last_name", ""] },
                    ],
                  },
                },
              },
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      },
    },
    ...(search
      ? [
          {
            $match: {
              $or: [
                { order_id: { $regex: search, $options: "i" } },
                { "user.email": { $regex: search, $options: "i" } },
              ],
            },
          },
        ]
      : []),
    { $sort: { date: -1 } },
    {
      $facet: {
        meta: [{ $count: "total" }],
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              order_id: 1,
              status: 1,
              payment_method: 1,
              items_total: 1,
              total_discount: 1,
              grand_total: 1,
              expected_delivery_date: 1,
              delivered_at: 1,
              cancelled_at: 1,
              returned_at: 1,
              cancellation_reason: 1,
              date: 1,
              user: 1,
              items: {
                $map: {
                  input: "$items",
                  as: "item",
                  in: {
                    product_id: "$$item.product_id",
                    variant_id: "$$item.variant_id",
                    sku: "$$item.sku",
                    name: "$$item.name",
                    image: {
                      $cond: {
                        if: { $ifNull: ["$$item.image", false] },
                        then: {
                          $concat: [
                            process.env.S3_BASE_URL,
                            "/",
                            "$$item.image",
                          ],
                        },
                        else: null,
                      },
                    },
                    mrp: "$$item.mrp",
                    sale_price: "$$item.sale_price",
                    discount: "$$item.discount",
                    quantity: "$$item.quantity",
                    total: "$$item.total",
                  },
                },
              },
              shipping_address: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        total: { $ifNull: [{ $arrayElemAt: ["$meta.total", 0] }, 0] },
        orders: "$data",
      },
    },
  ];
  const [result] = await repo.aggregate(pipeline);
  if (!result) {
    throw new AppError(400, "Failed to fetch orders");
  }
  await cache("ADMIN_LIST").set(query, result);

  return result || { total: 0, orders: [] };
};

exports.updateOrderStatus = async (payload, session) => {
  const { order_id, status, note = "" } = payload;
  const order = await repo.findById(order_id, "-status_history", {
    lean: true,
    session,
  });
  if (!order) {
    throw new AppError(404, "Order not found");
  }

  const statusNote = (status) => {
    switch (status) {
      case "DELIVERED":
        return "Order delivered by delivery partner";
      case "CANCELLED":
        return "Order cancelled by admin";
      default:
        return "";
    }
  };

  const update = {
    status,
    $push: {
      status_history: {
        status,
        note: note || statusNote(status),
      },
    },
    ...(status === "CANCELLED" && {
      cancelled_at: Date.now(),
      cancellation_reason: note || "Cancelled by admin",
    }),
    ...(status === "DELIVERED" && {
      delivered_at: Date.now(),
    }),
  };

  if (status === "DELIVERED") {
    if (order.payment_method === "COD" && order.payment_id) {
      await paymentService.markCODPaid(order.payment_id, session);
    }
  }

  const updatedOrder = await repo.updateById(order_id, update, {
    returnDocument: "after",
    session,
  });
  if (!updatedOrder) {
    throw new AppError(400, "Failed to update order status");
  }

  await cache.invalidateOnOrderUpdate(order.user_id, order._id);
  return updatedOrder;
};
