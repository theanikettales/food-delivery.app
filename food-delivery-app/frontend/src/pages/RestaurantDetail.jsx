import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const RestaurantDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { cart, addItem } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    api
      .get(`/restaurants/${id}`)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="page-loading">Loading menu...</p>;
  if (!data) return <p className="empty-state">Restaurant not found.</p>;

  const { restaurant, menu } = data;
  const categories = [...new Set(menu.map((m) => m.category))];

  const handleAdd = (item) => {
    if (!user || user.role !== "customer") {
      alert("Please log in as a customer to order.");
      return;
    }
    addItem(restaurant, item);
  };

  const quantityInCart = (itemId) =>
    cart?.items.find((i) => i.menuItemId === itemId)?.quantity || 0;

  return (
    <div className="restaurant-detail-page">
      <div
        className="restaurant-banner"
        style={{
          backgroundImage: `url(${restaurant.image || "https://placehold.co/1000x260?text=Restaurant"})`,
        }}
      >
        <div className="banner-overlay">
          <h1>{restaurant.name}</h1>
          <p>{(restaurant.cuisine || []).join(", ")}</p>
          <p className="address">{restaurant.address}</p>
        </div>
      </div>

      {categories.map((cat) => (
        <div key={cat} className="menu-category">
          <h2>{cat}</h2>
          <div className="menu-list">
            {menu
              .filter((m) => m.category === cat)
              .map((item) => (
                <div key={item._id} className="menu-item">
                  <div className="menu-item-info">
                    <h4>
                      {item.isVeg ? "🟢" : "🔴"} {item.name}
                    </h4>
                    <p>{item.description}</p>
                    <p className="price">₹{item.price}</p>
                  </div>
                  <button className="add-btn" onClick={() => handleAdd(item)}>
                    {quantityInCart(item._id) > 0 ? `Added (${quantityInCart(item._id)})` : "Add +"}
                  </button>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RestaurantDetail;
