const mongoose = require("mongoose");

const repo = require("./order.repository");
const paymentService = require("../payment/payment.service");
const addressRepo = require("../address/address.repository");
const cartRepo = require("../cart/cart.repository");
const productRepo = require("../product/product.repository");
const AppError = require("../../utils/app-error");
const {
  S3_TEST_PUBLIC_BASE_URL,
  S3_PROD_PUBLIC_BASE_URL,
  NODE_ENV,
} = require("../../config/env");

const S3_BASE_URL =
  NODE_ENV === "production" ? S3_PROD_PUBLIC_BASE_URL : S3_TEST_PUBLIC_BASE_URL;

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

    const effectivePrice = variant.sale_price || variant.price;
    return {
      product_id: product._id,
      variant_id: variant._id,
      sku: variant.sku,
      name: product.name,
      image: thumbnail,
      price: effectivePrice,
      quantity: item.quantity,
      total: effectivePrice * item.quantity,
    };
  });

  // 4. calculate totals
  const items_total = orderItems.reduce((sum, i) => sum + i.total, 0);
  const shipping_charge = 0;
  const discount = 0;
  const grand_total = items_total + shipping_charge - discount;

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
      items_total,
      shipping_charge,
      discount,
      grand_total,
      status: "PENDING",
      status_history: [
        {
          status: "PENDING",
          note: "Order placed",
        },
      ],
    },
    session,
  );

  // 7. create payment record
  const payment = await paymentService.initiatePayment(
    {
      order_id: order._id,
      user_id,
      method: payment_method,
      amount: grand_total,
    },
    session,
  );

  // 8. link payment → order, confirm
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

  return {
    order: updatedOrder,
    payment,
  };
};

exports.getUserOrders = async (query) => {
  let { userId, status, page = 1, limit = 10 } = query;
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  const pipeline = [
    {
      $match: {
        user_id: new mongoose.Types.ObjectId(userId),
        ...(status ? { status } : {}),
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $facet: {
        meta: [{ $count: "total" }],
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
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
                      $concat: [S3_BASE_URL, "/", "$$item.image"],
                    },
                    price: "$$item.price",
                    quantity: "$$item.quantity",
                    total: "$$item.total",
                  },
                },
              },
              shipping_address: 1,
              payment_method: 1,
              items_total: 1,
              shipping_charge: 1,
              discount: 1,
              grand_total: 1,
              status: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        total: { $ifNull: [{ $arrayElemAt: ["$meta.total", 0] }, 0] },
        data: 1,
      },
    },
  ];
  const [result] = await repo.aggregate(pipeline);
  return (
    result || {
      total: 0,
      data: [],
    }
  );
};

exports.getOrderById = async (order_id, user_id) => {
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
              price: "$$item.price",
              quantity: "$$item.quantity",
              total: "$$item.total",
            },
          },
        },
        shipping_address: 1,
        payment_method: 1,
        payment: 1,
        items_total: 1,
        shipping_charge: 1,
        discount: 1,
        grand_total: 1,
        status: 1,
        status_history: 1,
        delivered_at: 1,
        cancelled_at: 1,
        cancellation_reason: 1,
      },
    },
  ];

  const [order] = await repo.aggregate(pipeline);
  if (!order) {
    throw new AppError(404, "Order not found");
  }

  return order;
};

exports.cancelOrder = async (payload, session) => {
  const { order_id, user_id, reason = "" } = payload;
  const order = await repo.findOne(
    { _id: order_id, user_id },
    "-status_history",
    { lean: true, session },
  );
  if (!order) {
    throw new AppError(404, "Order not found");
  }

  if (!["PENDING", "CONFIRMED", "PROCESSING"].includes(order.status)) {
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
      cancelled_at: new Date().getTime(),
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
  return updatedOrder;
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

  const update = {
    status,
    $push: { status_history: { status, note } },
  };

  if (status === "DELIVERED") {
    update.delivered_at = new Date().getTime();
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
  return updatedOrder;
};
