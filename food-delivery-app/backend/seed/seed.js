/**
 * Seed script — populates the database with sample restaurants and menus
 * so the app has data to browse immediately.
 *
 * Run from the backend/ folder:
 *   node seed/seed.js
 * or:
 *   npm run seed
 *
 * Safe to re-run: it clears out only the sample data it created before
 * re-inserting, based on the seed owner emails below.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const MenuItem = require("../models/MenuItem");

const SAMPLE_RESTAURANTS = [
  {
    owner: { name: "Marco Rossi", email: "marco@pizzapalace.demo" },
    restaurant: {
      name: "Pizza Palace",
      description: "Wood-fired pizzas made the traditional Italian way.",
      cuisine: ["Italian", "Pizza"],
      address: "12 MG Road, Jaipur",
      image: "https://loremflickr.com/600/360/pizza?lock=101",
      rating: 4.5,
      numReviews: 128,
    },
    menu: [
      { name: "Margherita Pizza", description: "Classic tomato, mozzarella, basil.", price: 249, category: "Pizza", isVeg: true },
      { name: "Pepperoni Pizza", description: "Loaded with spicy pepperoni.", price: 329, category: "Pizza", isVeg: false },
      { name: "Garlic Bread", description: "Crusty bread with garlic butter.", price: 129, category: "Starters", isVeg: true },
      { name: "Tiramisu", description: "Classic Italian coffee dessert.", price: 179, category: "Dessert", isVeg: true },
    ],
  },
  {
    owner: { name: "Priya Nair", email: "priya@spicehut.demo" },
    restaurant: {
      name: "Spice Hut",
      description: "Authentic North Indian curries and tandoori favourites.",
      cuisine: ["Indian", "North Indian"],
      address: "45 C-Scheme, Jaipur",
      image: "https://loremflickr.com/600/360/indian_food?lock=102",
      rating: 4.7,
      numReviews: 340,
    },
    menu: [
      { name: "Butter Chicken", description: "Creamy tomato-based curry with tender chicken.", price: 289, category: "Main", isVeg: false },
      { name: "Paneer Tikka Masala", description: "Grilled paneer in a spiced curry.", price: 259, category: "Main", isVeg: true },
      { name: "Garlic Naan", description: "Tandoor-baked flatbread with garlic.", price: 59, category: "Breads", isVeg: true },
      { name: "Gulab Jamun", description: "Warm milk dumplings in sugar syrup.", price: 99, category: "Dessert", isVeg: true },
    ],
  },
  {
    owner: { name: "Kenji Watanabe", email: "kenji@sushiyama.demo" },
    restaurant: {
      name: "Sushi Yama",
      description: "Fresh sushi and Japanese comfort food.",
      cuisine: ["Japanese", "Sushi"],
      address: "8 Malviya Nagar, Jaipur",
      image: "https://loremflickr.com/600/360/sushi?lock=103",
      rating: 4.6,
      numReviews: 210,
    },
    menu: [
      { name: "California Roll", description: "Crab, avocado, cucumber.", price: 349, category: "Sushi", isVeg: false },
      { name: "Vegetable Tempura", description: "Crispy battered seasonal vegetables.", price: 219, category: "Starters", isVeg: true },
      { name: "Chicken Katsu Curry", description: "Breaded chicken cutlet with curry rice.", price: 379, category: "Main", isVeg: false },
      { name: "Miso Soup", description: "Traditional soybean broth.", price: 99, category: "Starters", isVeg: true },
    ],
  },
  {
    owner: { name: "Carlos Mendes", email: "carlos@burgerbarn.demo" },
    restaurant: {
      name: "Burger Barn",
      description: "Juicy handcrafted burgers and crispy fries.",
      cuisine: ["American", "Fast Food"],
      address: "21 Vaishali Nagar, Jaipur",
      image: "https://loremflickr.com/600/360/burger?lock=104",
      rating: 4.3,
      numReviews: 175,
    },
    menu: [
      { name: "Classic Cheeseburger", description: "Beef patty, cheddar, lettuce, tomato.", price: 199, category: "Burgers", isVeg: false },
      { name: "Veggie Burger", description: "Grilled veggie patty with special sauce.", price: 179, category: "Burgers", isVeg: true },
      { name: "Loaded Fries", description: "Fries topped with cheese and jalapeños.", price: 149, category: "Sides", isVeg: true },
      { name: "Chocolate Shake", description: "Thick and creamy chocolate milkshake.", price: 129, category: "Beverages", isVeg: true },
    ],
  },
  {
    owner: { name: "Ananya Rao", email: "ananya@greenbowl.demo" },
    restaurant: {
      name: "Green Bowl",
      description: "Healthy salads, bowls, and fresh juices.",
      cuisine: ["Healthy", "Salads"],
      address: "3 Raja Park, Jaipur",
      image: "https://loremflickr.com/600/360/salad?lock=105",
      rating: 4.4,
      numReviews: 96,
    },
    menu: [
      { name: "Quinoa Buddha Bowl", description: "Quinoa, chickpeas, roasted veggies, tahini.", price: 249, category: "Bowls", isVeg: true },
      { name: "Grilled Chicken Salad", description: "Mixed greens, grilled chicken, vinaigrette.", price: 279, category: "Salads", isVeg: false },
      { name: "Avocado Toast", description: "Sourdough, smashed avocado, chili flakes.", price: 189, category: "Starters", isVeg: true },
      { name: "Fresh Watermelon Juice", description: "Cold-pressed, no added sugar.", price: 99, category: "Beverages", isVeg: true },
    ],
  },
];

const DEMO_PASSWORD = "Demo@1234";

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI not set — make sure backend/.env exists and is filled in.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB for seeding...");

  for (const entry of SAMPLE_RESTAURANTS) {
    // remove any previous sample data tied to this owner email, so this script is re-runnable
    const existingOwner = await User.findOne({ email: entry.owner.email });
    if (existingOwner) {
      const existingRestaurant = await Restaurant.findOne({ owner: existingOwner._id });
      if (existingRestaurant) {
        await MenuItem.deleteMany({ restaurant: existingRestaurant._id });
        await Restaurant.deleteOne({ _id: existingRestaurant._id });
      }
      await User.deleteOne({ _id: existingOwner._id });
    }

    const owner = await User.create({
      name: entry.owner.name,
      email: entry.owner.email,
      password: DEMO_PASSWORD,
      role: "restaurant",
    });

    const restaurant = await Restaurant.create({
      owner: owner._id,
      ...entry.restaurant,
    });

    const items = entry.menu.map((item) => ({ ...item, restaurant: restaurant._id }));
    await MenuItem.insertMany(items);

    console.log(`Seeded: ${restaurant.name} (${items.length} menu items) — owner login: ${owner.email} / ${DEMO_PASSWORD}`);
  }

  console.log("\nDone! Refresh your app's homepage to see the restaurants.");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
