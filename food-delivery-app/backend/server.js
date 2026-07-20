require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");
const nearbyRoutes = require("./routes/nearbyRoutes");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT"],
  },
});

// make io accessible in route handlers via req.app.get("io")
app.set("io", io);

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/nearby", nearbyRoutes);

app.get("/", (req, res) => res.send("Food Delivery API is running"));

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // customer joins a room to track a specific order
  socket.on("join_order_room", (orderId) => {
    socket.join(`order_${orderId}`);
  });

  // restaurant owner joins a room to receive new orders live
  socket.on("join_restaurant_room", (restaurantId) => {
    socket.join(`restaurant_${restaurantId}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
