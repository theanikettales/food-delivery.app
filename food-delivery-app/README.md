# FoodExpress — MERN Food Delivery App (Capstone Project)

A full-stack food delivery platform built with MongoDB, Express.js, React.js, and Node.js.
Supports two roles — **Customer** and **Restaurant Owner** — with cart & checkout, mock/test
payments, and **real-time order tracking** via Socket.io.

---

## Features

**Customer**
- Browse & search restaurants
- View restaurant menus by category
- Add items to cart (single restaurant per cart)
- Checkout with delivery address + payment method (card test mode / cash on delivery)
- Live order tracking timeline (Placed → Accepted → Preparing → Out for Delivery → Delivered)
- Order history

**Restaurant Owner**
- Create & manage restaurant profile
- Add/edit menu items, toggle availability
- Receive new orders in real time (no refresh needed)
- Update order status, which instantly reflects on the customer's tracking page

**Cross-cutting**
- JWT authentication, role-based route protection (customer / restaurant / admin-ready)
- Socket.io rooms: one per restaurant (new orders), one per order (status updates)
- Stripe test-mode payment intent creation (optional — app works without a Stripe key using COD)

---

## Tech Stack

| Layer      | Tech |
|------------|------|
| Frontend   | React 18 (Vite), React Router, Axios, Socket.io-client |
| Backend    | Node.js, Express.js |
| Database   | MongoDB + Mongoose |
| Realtime   | Socket.io |
| Payments   | Stripe (test mode) |
| Auth       | JWT + bcrypt |

---

## Project Structure

```
food-delivery-app/
├── backend/
│   ├── config/db.js          # MongoDB connection
│   ├── models/                # User, Restaurant, MenuItem, Order
│   ├── middleware/auth.js     # JWT verification + role guard
│   ├── routes/                # authRoutes, restaurantRoutes, menuRoutes, orderRoutes
│   ├── server.js               # Express + Socket.io entry point
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/                # axios instance + socket client
    │   ├── context/            # AuthContext, CartContext
    │   ├── components/         # Navbar, RestaurantCard, ProtectedRoute
    │   ├── pages/               # Home, Login, Register, RestaurantDetail, Cart,
    │   │                        # Checkout, OrderTracking, MyOrders, RestaurantDashboard
    │   ├── App.jsx
    │   └── index.css
    └── vite.config.js
```

---

## Setup Instructions

### Prerequisites
- Node.js v18+ installed
- MongoDB running locally (`mongodb://localhost:27017`) or a MongoDB Atlas connection string
- (Optional) A free Stripe account for test-mode card payments

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/food_delivery
JWT_SECRET=some_long_random_string
JWT_EXPIRES_IN=7d
STRIPE_SECRET_KEY=sk_test_...       # optional — leave blank to just use COD
CLIENT_URL=http://localhost:5173
```

Run it:
```bash
npm run dev
```
Server starts on `http://localhost:5000`.

### 2. Frontend

```bash
cd frontend
npm install
```

(Optional) create `frontend/.env` if your backend isn't on the default URL:
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Run it:
```bash
npm run dev
```
App runs on `http://localhost:5173`.

---

## Demo Walkthrough (for your presentation)

1. **Register two accounts** in separate browser windows (or one normal + one incognito):
   - Account A → role: *Restaurant Owner*
   - Account B → role: *Customer*
2. As the restaurant owner, go to **Dashboard** → create your restaurant profile → add a few menu items.
3. As the customer, go to the home page → open that restaurant → add items to cart → checkout
   (choose COD if you haven't set up a Stripe key) → place order.
4. You'll land on the **live order tracking page**.
5. Switch back to the restaurant owner's **Dashboard → Orders tab** — the new order appears instantly
   (no refresh, thanks to Socket.io).
6. Click "Mark as accepted" → "Mark as preparing" → etc. Switch back to the customer tab: the
   tracking timeline updates live, in real time, without refreshing.

This live hand-off between two roles is the strongest part to demo — it visibly proves the
real-time architecture rather than just describing it.

---

## Notable Design Decisions

- **Cart is client-side only** (React Context), sent to the backend only at checkout — keeps the
  cart snappy and avoids unnecessary API calls while shopping.
- **One restaurant per cart** — matches how real platforms (Swiggy/Zomato/DoorDash) work, and
  keeps checkout math simple.
- **Stripe integration is intentionally minimal** (PaymentIntent creation, test mode only) — enough
  to demonstrate real payment-gateway integration without building a full webhook-based
  confirmation flow, which is overkill for a capstone.
- **Delivery tracking is a status timeline, not a live map.** A simulated GPS/live map is a common
  over-scoping trap for this kind of project; the status timeline delivers the same "wow" factor
  in the demo with a fraction of the effort and no third-party maps API dependency.

## Suggested Extensions (if you have time left)

- Admin panel to approve new restaurants before they go live
- Ratings & reviews on delivered orders
- Delivery agent role with its own simple accept/deliver dashboard
- Order status history endpoint/page (statusHistory is already tracked in the schema)
- Image upload (Multer/Cloudinary) instead of pasting image URLs
