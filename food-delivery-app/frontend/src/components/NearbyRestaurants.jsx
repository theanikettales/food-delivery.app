import React, { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const POPULAR_CITIES = [
  "Jaipur", "Delhi", "Mumbai", "Bangalore", "Hyderabad",
  "Chennai", "Kolkata", "Pune", "Ahmedabad", "Lucknow",
  "Chandigarh", "Bhopal", "Patna", "Indore", "Surat",
  "Nagpur", "Kochi", "Guwahati", "Bhubaneswar", "Dehradun",
];

const NearbyRestaurants = ({ externalTrigger }) => {
  const { user, updatePreferredCity } = useAuth();
  const [city, setCity] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [lastSearchedCity, setLastSearchedCity] = useState("");
  const [savingCity, setSavingCity] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const autoSearchedRef = useRef(false);

  const runSearch = async (cityName) => {
    if (!cityName.trim()) return;
    setLoading(true);
    setError("");
    setSearched(true);
    setLastSearchedCity(cityName);
    try {
      const res = await api.get(`/nearby?city=${encodeURIComponent(cityName.trim())}`);
      setResults(res.data.results);
    } catch (err) {
      setError(
        err.response?.data?.message || "Couldn't fetch nearby restaurants. Try again in a moment."
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-search using the user's saved city as soon as they land on the page
  // (e.g. right after login) — no need to type or click anything.
  useEffect(() => {
    if (!autoSearchedRef.current && user?.preferredCity) {
      autoSearchedRef.current = true;
      setCity(user.preferredCity);
      runSearch(user.preferredCity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.preferredCity]);

  // The main "Search restaurants..." bar on the Home page also triggers a
  // nearby-city search here, so users don't have to type the city twice.
  useEffect(() => {
    if (externalTrigger?.city) {
      setCity(externalTrigger.city);
      runSearch(externalTrigger.city);
      // scroll this section into view so the results are visible immediately
      document.querySelector(".nearby-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalTrigger?.key]);

  const handleSearch = (e) => {
    e.preventDefault();
    runSearch(city);
  };

  const handleChipClick = (cityName) => {
    setCity(cityName);
    runSearch(cityName);
  };

  const handleSaveCity = async () => {
    if (!lastSearchedCity) return;
    setSavingCity(true);
    try {
      await updatePreferredCity(lastSearchedCity);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCity(false);
    }
  };

  const firstCuisine = (cuisine) => (cuisine ? cuisine.split(";")[0].trim() : null);

  const isCitySaved = user?.preferredCity && user.preferredCity === lastSearchedCity;

  return (
    <div className="nearby-section">
      <div className="nearby-header">
        <h2>🔎 Explore Nearby Restaurants</h2>
        <p className="nearby-note">
          Real restaurants across Indian cities, powered by OpenStreetMap. These are for browsing
          only — to place an order, use the restaurants listed below under "Order Now".
          {user?.preferredCity && (
            <> Showing results for your saved city: <strong>{user.preferredCity}</strong>.</>
          )}
        </p>
      </div>

      <form className="nearby-search-bar" onSubmit={handleSearch}>
        <input
          placeholder="Enter any Indian city (e.g. Jaipur, Delhi, Mumbai)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? (
            <span className="btn-spinner-wrap">
              <span className="btn-spinner" /> Searching...
            </span>
          ) : (
            "Find Restaurants"
          )}
        </button>
      </form>

      <div className="city-chips">
        {POPULAR_CITIES.map((c) => (
          <button
            key={c}
            type="button"
            className={`city-chip ${lastSearchedCity === c ? "active" : ""}`}
            onClick={() => handleChipClick(c)}
            disabled={loading}
          >
            {c}
          </button>
        ))}
      </div>

      {user && searched && !loading && !error && lastSearchedCity && (
        <div className="save-city-row">
          {isCitySaved ? (
            <span className="saved-tag">✓ {lastSearchedCity} is your saved city</span>
          ) : (
            <button className="save-city-btn" onClick={handleSaveCity} disabled={savingCity}>
              {savingCity ? "Saving..." : `📌 Save "${lastSearchedCity}" as my city`}
            </button>
          )}
          {savedNotice && <span className="saved-notice">Saved! We'll load this next time.</span>}
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      {loading && (
        <div className="nearby-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="nearby-card skeleton">
              <div className="nearby-image skeleton-block" />
              <div className="nearby-card-body">
                <div className="skeleton-line short" />
                <div className="skeleton-line" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && searched && !error && results.length === 0 && (
        <p className="empty-state">
          No restaurants found for "{lastSearchedCity}". Try a nearby city or check the spelling.
        </p>
      )}

      {!loading && results.length > 0 && (
        <div className="nearby-grid">
          {results.map((place) => {
            const cuisine = firstCuisine(place.cuisine);
            return (
              <a
                key={place.id}
                href={place.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="nearby-card"
              >
                <div
                  className="nearby-image"
                  style={{ backgroundImage: `url(${place.photoUrl})` }}
                >
                  {cuisine && <span className="cuisine-badge">{cuisine}</span>}
                </div>
                <div className="nearby-card-body">
                  <h4>{place.name}</h4>
                  <p className="address">📍 {place.address}</p>
                  <span className="view-map-link">View on Map →</span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NearbyRestaurants;
