import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login({ setIsLoggedIn }) {
  // State for form fields and error handling
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  //  On component mount: Redirect if already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (isLoggedIn) {
      navigate("/"); // Redirect to homepage if already logged in
    }
  }, [navigate]);

  //  Handles form submission and sends login request to backend
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent default form behavior

    try {
      const res = await axios.post("/login", {
        email,
        password,
      });

      //  On successful login: store session and navigate
      if (res.data.success) {
        localStorage.setItem("isLoggedIn", "true"); // Save login state
        localStorage.setItem("userId", res.data.userId); // Save user ID
        setIsLoggedIn(true); // Update parent state
        navigate("/"); // Redirect to homepage
      }
    } catch (err) {
      //  Handle failed login
      if (err.response?.status === 401) {
        setError("Invalid email or password");
      } else {
        setError("Something went wrong. Please try again later.");
      }
    }
  };

  return (
    <div className="container">
      <div className="form-box">
        <h2>Login</h2>

        {/*  Login form */}
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)} // Update email state
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)} // Update password state
          />
          <button type="submit">Login</button>

          {/*  Error message display */}
          {error && (
            <div className="error-msg">
              <span>{error}</span>
              <span className="close-btn" onClick={() => setError("")}>×</span>
            </div>
          )}

          {/* Static UI element for password reset (not functional) */}
          <p className="forgot-password">Forgot Password?</p>
        </form>

        {/*  Signup redirect */}
        <p>
          Don't have an account? <a href="/signup">Sign Up</a>
        </p>
      </div>
    </div>
  );
}

export default Login;