import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import api from "../api/axios";

const DELIVERY_FEE = 30;
const TAX_RATE = 0.05;

const Checkout = () => {
  const { cart, itemsTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState({ line1: "", city: "", state: "", zip: "", instructions: "" });
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  if (!cart || cart.items.length === 0) {
    navigate("/cart");
    return null;
  }

  const tax = Math.round(itemsTotal * TAX_RATE * 100) / 100;
  const total = Math.round((itemsTotal + DELIVERY_FEE + tax) * 100) / 100;

  const handleChange = (e) => setAddress({ ...address, [e.target.name]: e.target.value });

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError("");
    setPlacing(true);
    try {
      const res = await api.post("/orders", {
        restaurantId: cart.restaurantId,
        items: cart.items.map((i) => ({
          menuItem: i.menuItemId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        deliveryAddress: address,
        paymentMethod,
      });
      clearCart();
      navigate(`/order/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="checkout-page">
      <h2>Checkout</h2>
      <form onSubmit={handlePlaceOrder}>
        <h3>Delivery Address</h3>
        <input name="line1" placeholder="Address line" value={address.line1} onChange={handleChange} required />
        <input name="city" placeholder="City" value={address.city} onChange={handleChange} required />
        <input name="state" placeholder="State" value={address.state} onChange={handleChange} required />
        <input name="zip" placeholder="ZIP / PIN code" value={address.zip} onChange={handleChange} required />
        <textarea
          name="instructions"
          placeholder="Delivery instructions (optional)"
          value={address.instructions}
          onChange={handleChange}
        />

        <h3>Payment Method</h3>
        <div className="payment-options">
          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={paymentMethod === "card"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            Card (test mode)
          </label>
          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="cod"
              checked={paymentMethod === "cod"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            Cash on Delivery
          </label>
        </div>

        <div className="order-summary">
          <div className="summary-row">
            <span>Items total</span>
            <span>₹{itemsTotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery fee</span>
            <span>₹{DELIVERY_FEE.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Tax (5%)</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={placing}>
          {placing ? "Placing order..." : `Place Order · ₹${total.toFixed(2)}`}
        </button>
      </form>
    </div>
  );
};

export default Checkout;
