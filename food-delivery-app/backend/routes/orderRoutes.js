const express = require("express");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
}

const DELIVERY_FEE = 30;
const TAX_RATE = 0.05;

// @route POST /api/orders - place a new order
// body: { restaurantId, items: [{menuItem, name, price, quantity}], deliveryAddress, paymentMethod }
router.post("/", protect, authorize("customer"), async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress, paymentMethod } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const itemsTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const tax = Math.round(itemsTotal * TAX_RATE * 100) / 100;
    const total = Math.round((itemsTotal + DELIVERY_FEE + tax) * 100) / 100;

    let paymentStatus = "pending";
    let stripePaymentIntentId;

    if (paymentMethod === "card" && stripe) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100), // smallest currency unit
        currency: "inr",
        automatic_payment_methods: { enabled: true },
        metadata: { customer: req.user._id.toString() },
      });
      stripePaymentIntentId = paymentIntent.id;
      // NOTE: for the capstone demo, we mark as paid once intent is created against a test key.
      // In production you'd confirm payment client-side and verify via webhook before marking paid.
      paymentStatus = "paid";
    } else if (paymentMethod === "cod") {
      paymentStatus = "pending"; // paid on delivery
    }

    const order = await Order.create({
      customer: req.user._id,
      restaurant: restaurant._id,
      items,
      deliveryAddress,
      itemsTotal,
      deliveryFee: DELIVERY_FEE,
      tax,
      total,
      paymentMethod: paymentMethod || "card",
      paymentStatus,
      stripePaymentIntentId,
      status: "placed",
    });

    // notify restaurant dashboard in real time
    const io = req.app.get("io");
    io.to(`restaurant_${restaurant._id}`).emit("new_order", order);

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/orders/mine - customer's own orders
router.get("/mine", protect, authorize("customer"), async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate("restaurant", "name image")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/orders/restaurant - orders for the logged-in restaurant owner
router.get("/restaurant", protect, authorize("restaurant"), async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return res.json([]);
    const orders = await Order.find({ restaurant: restaurant._id })
      .populate("customer", "name phone")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/orders/:id - order detail (owner customer or restaurant owner)
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("restaurant", "name image owner")
      .populate("customer", "name phone");
    if (!order) return res.status(404).json({ message: "Order not found" });

    const isCustomerOwner = order.customer._id.toString() === req.user._id.toString();
    const isRestaurantOwner = order.restaurant.owner.toString() === req.user._id.toString();
    if (!isCustomerOwner && !isRestaurantOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route PUT /api/orders/:id/status - restaurant updates order status
router.put("/:id/status", protect, authorize("restaurant"), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["accepted", "preparing", "out_for_delivery", "delivered", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const order = await Order.findById(req.params.id).populate("restaurant");
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your order" });
    }
    order.status = status;
    await order.save();

    // real-time push to the customer tracking this order
    const io = req.app.get("io");
    io.to(`order_${order._id}`).emit("order_status_update", {
      orderId: order._id,
      status: order.status,
      statusHistory: order.statusHistory,
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
