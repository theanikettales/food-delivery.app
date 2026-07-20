import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import socket from "../api/socket";

const STEPS = [
  { key: "placed", label: "Order Placed" },
  { key: "accepted", label: "Accepted" },
  { key: "preparing", label: "Preparing" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

const OrderTracking = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then((res) => setOrder(res.data))
      .finally(() => setLoading(false));

    socket.emit("join_order_room", id);
    const handler = (payload) => {
      if (payload.orderId === id) {
        setOrder((prev) => (prev ? { ...prev, status: payload.status } : prev));
      }
    };
    socket.on("order_status_update", handler);
    return () => socket.off("order_status_update", handler);
  }, [id]);

  if (loading) return <p className="page-loading">Loading order...</p>;
  if (!order) return <p className="empty-state">Order not found.</p>;

  const currentIndex = STEPS.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="order-tracking-page">
      <h2>Order #{order._id.slice(-6).toUpperCase()}</h2>
      <p className="restaurant-name">{order.restaurant?.name}</p>

      {isCancelled ? (
        <p className="error-text">This order was cancelled.</p>
      ) : (
        <div className="status-timeline">
          {STEPS.map((step, idx) => (
            <div
              key={step.key}
              className={`timeline-step ${idx <= currentIndex ? "done" : ""} ${
                idx === currentIndex ? "current" : ""
              }`}
            >
              <div className="dot" />
              <span>{step.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="order-items-summary">
        <h3>Items</h3>
        {order.items.map((item) => (
          <div key={item.menuItem} className="summary-row">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="summary-row total">
          <span>Total</span>
          <span>₹{order.total.toFixed(2)}</span>
        </div>
      </div>

      <p className="live-note">🟢 This page updates live as the restaurant updates your order.</p>
    </div>
  );
};

export default OrderTracking;
