import React, { useEffect, useState } from "react";
import api from "../api/axios";
import socket from "../api/socket";

const NEXT_STATUS = {
  placed: "accepted",
  accepted: "preparing",
  preparing: "out_for_delivery",
  out_for_delivery: "delivered",
};

const RestaurantDashboard = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("orders");

  // restaurant profile form
  const [profileForm, setProfileForm] = useState({
    name: "",
    description: "",
    cuisine: "",
    address: "",
    image: "",
  });

  // new menu item form
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "Main",
    isVeg: true,
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const restRes = await api.get("/restaurants/mine");
      setRestaurant(restRes.data);
      if (restRes.data) {
        socket.emit("join_restaurant_room", restRes.data._id);
        const [menuRes, ordersRes] = await Promise.all([
          api.get("/menu/mine"),
          api.get("/orders/restaurant"),
        ]);
        setMenu(menuRes.data);
        setOrders(ordersRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const handler = (order) => setOrders((prev) => [order, ...prev]);
    socket.on("new_order", handler);
    return () => socket.off("new_order", handler);
  }, []);

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/restaurants", {
        ...profileForm,
        cuisine: profileForm.cuisine.split(",").map((c) => c.trim()).filter(Boolean),
      });
      setRestaurant(res.data);
      socket.emit("join_restaurant_room", res.data._id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create restaurant");
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/menu", { ...itemForm, price: Number(itemForm.price) });
      setMenu((prev) => [...prev, res.data]);
      setItemForm({ name: "", description: "", price: "", category: "Main", isVeg: true });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add item");
    }
  };

  const toggleAvailability = async (item) => {
    const res = await api.put(`/menu/${item._id}`, { isAvailable: !item.isAvailable });
    setMenu((prev) => prev.map((m) => (m._id === item._id ? res.data : m)));
  };

  const advanceStatus = async (order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    const res = await api.put(`/orders/${order._id}/status`, { status: next });
    setOrders((prev) => prev.map((o) => (o._id === order._id ? res.data : o)));
  };

  const cancelOrder = async (order) => {
    const res = await api.put(`/orders/${order._id}/status`, { status: "cancelled" });
    setOrders((prev) => prev.map((o) => (o._id === order._id ? res.data : o)));
  };

  if (loading) return <p className="page-loading">Loading dashboard...</p>;

  if (!restaurant) {
    return (
      <div className="dashboard-page">
        <h2>Set up your restaurant</h2>
        <form className="restaurant-form" onSubmit={handleCreateRestaurant}>
          <input
            placeholder="Restaurant name"
            value={profileForm.name}
            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            required
          />
          <textarea
            placeholder="Description"
            value={profileForm.description}
            onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
          />
          <input
            placeholder="Cuisine (comma separated, e.g. Italian, Fast Food)"
            value={profileForm.cuisine}
            onChange={(e) => setProfileForm({ ...profileForm, cuisine: e.target.value })}
          />
          <input
            placeholder="Address"
            value={profileForm.address}
            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
            required
          />
          <input
            placeholder="Image URL (optional)"
            value={profileForm.image}
            onChange={(e) => setProfileForm({ ...profileForm, image: e.target.value })}
          />
          <button type="submit">Create Restaurant</button>
        </form>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <h2>{restaurant.name} · Dashboard</h2>
      <div className="tabs">
        <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>
          Orders
        </button>
        <button className={tab === "menu" ? "active" : ""} onClick={() => setTab("menu")}>
          Menu
        </button>
      </div>

      {tab === "orders" && (
        <div className="orders-list">
          {orders.length === 0 && <p className="empty-state">No orders yet.</p>}
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-card-header">
                <strong>#{order._id.slice(-6).toUpperCase()}</strong>
                <span className={`status-pill ${order.status}`}>{order.status}</span>
              </div>
              <p>Customer: {order.customer?.name} · {order.customer?.phone}</p>
              <ul>
                {order.items.map((i) => (
                  <li key={i.name}>
                    {i.name} × {i.quantity}
                  </li>
                ))}
              </ul>
              <p className="order-total">Total: ₹{order.total.toFixed(2)}</p>
              <div className="order-actions">
                {NEXT_STATUS[order.status] && (
                  <button onClick={() => advanceStatus(order)}>
                    Mark as {NEXT_STATUS[order.status].replace(/_/g, " ")}
                  </button>
                )}
                {!["delivered", "cancelled"].includes(order.status) && (
                  <button className="danger" onClick={() => cancelOrder(order)}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "menu" && (
        <div className="menu-management">
          <form className="menu-item-form" onSubmit={handleAddItem}>
            <h3>Add Menu Item</h3>
            <input
              placeholder="Item name"
              value={itemForm.name}
              onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              required
            />
            <input
              placeholder="Description"
              value={itemForm.description}
              onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
            />
            <input
              type="number"
              placeholder="Price"
              value={itemForm.price}
              onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
              required
            />
            <input
              placeholder="Category (e.g. Starters, Main, Dessert)"
              value={itemForm.category}
              onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
            />
            <label>
              <input
                type="checkbox"
                checked={itemForm.isVeg}
                onChange={(e) => setItemForm({ ...itemForm, isVeg: e.target.checked })}
              />
              Vegetarian
            </label>
            <button type="submit">Add Item</button>
          </form>

          <div className="menu-item-list">
            {menu.map((item) => (
              <div key={item._id} className="menu-manage-row">
                <span>
                  {item.isVeg ? "🟢" : "🔴"} {item.name} · ₹{item.price}
                </span>
                <button onClick={() => toggleAvailability(item)}>
                  {item.isAvailable ? "Mark Unavailable" : "Mark Available"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDashboard;
