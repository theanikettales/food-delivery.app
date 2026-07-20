import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const Cart = () => {
  const { cart, updateQuantity, itemsTotal } = useCart();
  const navigate = useNavigate();

  if (!cart || cart.items.length === 0) {
    return (
      <div className="empty-state">
        <p>Your cart is empty.</p>
        <Link to="/">Browse restaurants</Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h2>Your Cart · {cart.restaurantName}</h2>
      <div className="cart-list">
        {cart.items.map((item) => (
          <div key={item.menuItemId} className="cart-row">
            <span className="cart-item-name">{item.name}</span>
            <div className="qty-controls">
              <button onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}>+</button>
            </div>
            <span className="cart-item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <div className="summary-row">
          <span>Items total</span>
          <span>₹{itemsTotal.toFixed(2)}</span>
        </div>
        <button className="checkout-btn" onClick={() => navigate("/checkout")}>
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart;
