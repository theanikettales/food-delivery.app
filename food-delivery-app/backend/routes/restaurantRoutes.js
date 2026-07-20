const express = require("express");
const Restaurant = require("../models/Restaurant");
const MenuItem = require("../models/MenuItem");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// @route GET /api/restaurants - public list, with search
router.get("/", async (req, res) => {
  try {
    const { search, cuisine } = req.query;
    const filter = { isApproved: true };
    if (search) filter.name = { $regex: search, $options: "i" };
    if (cuisine) filter.cuisine = { $in: [cuisine] };
    const restaurants = await Restaurant.find(filter).sort({ createdAt: -1 });
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/restaurants/mine - restaurant owner's own restaurant
router.get("/mine", protect, authorize("restaurant"), async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/restaurants/:id - public detail + menu
router.get("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    const menu = await MenuItem.find({ restaurant: restaurant._id, isAvailable: true });
    res.json({ restaurant, menu });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/restaurants - create (restaurant role only, one per owner)
router.post("/", protect, authorize("restaurant"), async (req, res) => {
  try {
    const existing = await Restaurant.findOne({ owner: req.user._id });
    if (existing) {
      return res.status(400).json({ message: "You already have a restaurant profile" });
    }
    const { name, description, cuisine, address, image } = req.body;
    const restaurant = await Restaurant.create({
      owner: req.user._id,
      name,
      description,
      cuisine,
      address,
      image,
    });
    res.status(201).json(restaurant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route PUT /api/restaurants/:id - update own restaurant
router.put("/:id", protect, authorize("restaurant"), async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your restaurant" });
    }
    Object.assign(restaurant, req.body);
    await restaurant.save();
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
