import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import RestaurantCard from "../components/RestaurantCard";
import NearbyRestaurants from "../components/NearbyRestaurants";

const CATEGORIES = [
  { label: "North Indian", cuisine: "North Indian", icon: "🍛" },
  { label: "Pizza", cuisine: "Pizza", icon: "🍕" },
  { label: "Burgers", cuisine: "Fast Food", icon: "🍔" },
  { label: "South Indian", cuisine: "South Indian", icon: "🥘" },
  { label: "Biryani", cuisine: "Biryani", icon: "🍚" },
  { label: "Chinese", cuisine: "Chinese", icon: "🥡" },
  { label: "Sushi", cuisine: "Japanese", icon: "🍣" },
  { label: "Desserts", cuisine: "Desserts", icon: "🍰" },
  { label: "Healthy", cuisine: "Healthy", icon: "🥗" },
  { label: "Italian", cuisine: "Italian", icon: "🍝" },
];

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [nearbyTrigger, setNearbyTrigger] = useState(null); // { city, key }

  const fetchRestaurants = async ({ q = "", cuisine = "" } = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      if (cuisine) params.set("cuisine", cuisine);
      const qs = params.toString();
      const res = await api.get(`/restaurants${qs ? `?${qs}` : ""}`);
      setRestaurants(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const city = searchParams.get("city");
    if (city) {
      setSearch(city);
      setLocation(city);
      fetchRestaurants({ q: city });
      setNearbyTrigger({ city, key: Date.now() });
      setSearchParams({}, { replace: true });
    } else {
      fetchRestaurants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveCategory(null);
    fetchRestaurants({ q: search });
    // The same search box also searches real nearby restaurants (by city name)
    // via the OpenStreetMap-powered section below.
    const city = location.trim() || search.trim();
    if (city) {
      setNearbyTrigger({ city, key: Date.now() });
    }
  };

  const handleCategoryClick = (cat) => {
    if (activeCategory === cat.cuisine) {
      setActiveCategory(null);
      fetchRestaurants({ q: search });
    } else {
      setActiveCategory(cat.cuisine);
      fetchRestaurants({ q: search, cuisine: cat.cuisine });
    }
  };

  return (
    <div className="home-page">
      <div className="hero">
        <div className="hero-decor hero-decor-left" aria-hidden="true">🥬🍅🥦</div>
        <div className="hero-decor hero-decor-right" aria-hidden="true">🍣🥢</div>
        <h1>Order food & groceries. Discover best restaurants.</h1>
        <form className="search-bar swiggy-search-bar" onSubmit={handleSearch}>
          <div className="search-field location-field">
            <span className="field-icon">📍</span>
            <input
              placeholder="Enter your delivery location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="search-field">
            <span className="field-icon">🔍</span>
            <input
              placeholder="Search for restaurant, item or more"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit">Search</button>
        </form>

        <div className="hero-cards">
          <a href="#order-now" className="hero-card">
            <div className="hero-card-text">
              <h3 style={{ color: "black" }}>FOOD DELIVERY</h3>
              <p>FROM RESTAURANTS</p>
              <span className="hero-card-badge">Order in minutes</span>
            </div>
            <span className="hero-card-arrow">→</span>
          </a>
          <a href="#order-now" className="hero-card">
            <div className="hero-card-text">
              <h3 style={{ color: "black" }}>TOP RATED</h3>
              <p>BEST OF THE CITY</p>
              <span className="hero-card-badge">Highly rated</span>
            </div>
            <span className="hero-card-arrow">→</span>
          </a>
          <a href="#nearby" className="hero-card">
            <div className="hero-card-text">
              <h3 style={{ color: "black" }}>EXPLORE NEARBY</h3>
              <p>FIND RESTAURANTS AROUND YOU</p>
              <span className="hero-card-badge">Powered by maps</span>
            </div>
            <span className="hero-card-arrow">→</span>
          </a>
        </div>
      </div>

      <div className="category-section">
        <h2 className="section-title">Order our best food options</h2>
        <div className="category-scroller">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              type="button"
              className={`category-chip ${activeCategory === cat.cuisine ? "active" : ""}`}
              onClick={() => handleCategoryClick(cat)}
            >
              <span className="category-icon">{cat.icon}</span>
              <span className="category-label">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div id="nearby">
        <NearbyRestaurants externalTrigger={nearbyTrigger} />
      </div>

      <h2 id="order-now" className="section-title">🛒 Order Now</h2>
      {loading ? (
        <p className="page-loading">Loading restaurants...</p>
      ) : restaurants.length === 0 ? (
        <p className="empty-state">No restaurants found.</p>
      ) : (
        <div className="restaurant-grid">
          {restaurants.map((r) => (
            <RestaurantCard key={r._id} restaurant={r} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
