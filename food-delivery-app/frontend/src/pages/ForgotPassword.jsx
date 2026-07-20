import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [demoToken, setDemoToken] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setSubmitted(true);
      if (res.data.demoToken) {
        setDemoToken(res.data.demoToken);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Forgot Password</h2>

        {!submitted ? (
          <>
            <p className="auth-hint">
              Enter your account email. We'll generate a reset token for you.
            </p>
            {error && <p className="error-text">{error}</p>}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Please wait..." : "Send Reset Token"}
            </button>
          </>
        ) : (
          <>
            <p className="success-text">
              If an account with that email exists, reset instructions have been generated.
            </p>
            {demoToken && (
              <div className="demo-token-box">
                <p className="demo-label">
                  ⚠️ Demo mode — no email server configured. Use this token directly:
                </p>
                <code className="demo-token">{demoToken}</code>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
                >
                  Continue to Reset Password →
                </button>
              </div>
            )}
          </>
        )}

        <p>
          Remembered your password? <Link to="/login">Back to Login</Link>
        </p>
      </form>
    </div>
  );
};

export default ForgotPassword;
