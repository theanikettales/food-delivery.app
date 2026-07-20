import React from "react";
import { Link, useNavigate } from "react-router-dom";

const CITIES = [
  "Bangalore", "Gurgaon", "Hyderabad", "Delhi",
  "Mumbai", "Pune", "Kolkata", "Chennai",
  "Ahmedabad", "Chandigarh", "Jaipur", "Lucknow",
];

const Footer = () => {
  const navigate = useNavigate();

  const handleCityClick = (city) => {
    navigate(`/?city=${encodeURIComponent(city)}`);
  };

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-cities">
          <h2 className="section-title">Cities we deliver in</h2>
          <div className="city-grid">
            {CITIES.map((city) => (
              <button
                type="button"
                key={city}
                className="city-grid-btn"
                onClick={() => handleCityClick(city)}
              >
                Order food online in {city}
              </button>
            ))}
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-brand-col">
            <Link to="/" className="brand">🍔 FoodExpress</Link>
            <p className="footer-copyright">© {new Date().getFullYear()} FoodExpress. All rights reserved.</p>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <a href="#">About Us</a>
            <a href="#">Careers</a>
            <a href="#">Team</a>
          </div>

          <div className="footer-col">
            <h4>Contact us</h4>
            <a href="#">Help &amp; Support</a>
            <a href="#">Partner With Us</a>
          </div>

          <div className="footer-col">
            <h4>Legal</h4>
            <a href="#">Terms &amp; Conditions</a>
            <a href="#">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
