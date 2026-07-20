import React from "react";
import { Link } from "react-router-dom";

const RestaurantCard = ({ restaurant }) => {
  return (
    <Link to={`/restaurant/${restaurant._id}`} className="restaurant-card">
      <div
        className="restaurant-image"
        style={{
          backgroundImage: `url(${restaurant.image || "https://placehold.co/400x220?text=Restaurant"})`,
        }}
      />
      <div className="restaurant-info">
        <h3>{restaurant.name}</h3>
        <p className="cuisine">{(restaurant.cuisine || []).join(", ")}</p>
        <div className="meta-row">
          <span>⭐ {restaurant.rating?.toFixed(1) || "New"}</span>
          <span className={restaurant.isOpen ? "status open" : "status closed"}>
            {restaurant.isOpen ? "Open" : "Closed"}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default RestaurantCard;
