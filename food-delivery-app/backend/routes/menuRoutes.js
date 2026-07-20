const express = require("express");
const MenuItem = require("../models/MenuItem");
const Restaurant = require("../models/Restaurant");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// helper to make sure the restaurant belongs to req.user
async function getOwnRestaurantOrFail(req, res) {
  const restaurant = await Restaurant.findOne({ owner: req.user._id });
  if (!restaurant) {
    res.status(400).json({ message: "Create your restaurant profile first" });
    return null;
  }
  return restaurant;
}

// @route POST /api/menu - add menu item
router.post("/", protect, authorize("restaurant"), async (req, res) => {
  try {
    const restaurant = await getOwnRestaurantOrFail(req, res);
    if (!restaurant) return;
    const { name, description, price, category, image, isVeg } = req.body;
    const item = await MenuItem.create({
      restaurant: restaurant._id,
      name,
      description,
      price,
      category,
      image,
      isVeg,
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/menu/mine - list own menu items
router.get("/mine", protect, authorize("restaurant"), async (req, res) => {
  try {
    const restaurant = await getOwnRestaurantOrFail(req, res);
    if (!restaurant) return;
    const items = await MenuItem.find({ restaurant: restaurant._id });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route PUT /api/menu/:id - update a menu item (must own its restaurant)
router.put("/:id", protect, authorize("restaurant"), async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id).populate("restaurant");
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (item.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your menu item" });
    }
    Object.assign(item, req.body);
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route DELETE /api/menu/:id
router.delete("/:id", protect, authorize("restaurant"), async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id).populate("restaurant");
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (item.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your menu item" });
    }
    await item.deleteOne();
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
