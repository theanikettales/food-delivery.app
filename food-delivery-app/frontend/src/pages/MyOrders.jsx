import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const statusLabel = {
  placed: "Placed",
  accepted: "Accepted",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/orders/mine")
      .then((res) => setOrders(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="page-loading">Loading orders...</p>;
  if (orders.length === 0) return <p className="empty-state">No orders yet.</p>;

  return (
    <div className="my-orders-page">
      <h2>My Orders</h2>
      {orders.map((order) => (
        <Link to={`/order/${order._id}`} key={order._id} className="order-row">
          <div>
            <strong>{order.restaurant?.name}</strong>
            <p>{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div className={`status-pill ${order.status}`}>{statusLabel[order.status]}</div>
          <div className="order-total">₹{order.total.toFixed(2)}</div>
        </Link>
      ))}
    </div>
  );
};

export default MyOrders;
