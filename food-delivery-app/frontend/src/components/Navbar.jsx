import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const cartCount = cart ? cart.items.reduce((s, i) => s + i.quantity, 0) : 0;

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        🍔 FoodExpress
      </Link>
      <div className="nav-links">
        {user?.role === "customer" && (
          <>
            <Link to="/">Restaurants</Link>
            <Link to="/my-orders">My Orders</Link>
            <Link to="/cart" className="cart-link">
              Cart {cartCount > 0 && <span className="badge">{cartCount}</span>}
            </Link>
          </>
        )}
        {user?.role === "restaurant" && <Link to="/dashboard">Dashboard</Link>}
        <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle dark/light theme">
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        {user ? (
          <>
            <span className="user-name">Hi, {user.name}</span>
            <button className="btn-link" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
