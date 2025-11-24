import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Signup.css";

function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    dob: "",
    email: "",
  });

  const [statusMessage, setStatusMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(null);

  const navigate = useNavigate(); //hook

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("/signup", formData);

      if (res.status === 201) {
        setStatusMessage("Signup successful!");
        setIsSuccess(true);
        setFormData({ username: "", password: "", dob: "", email: "" });

        // Redirect after 2 seconds
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setStatusMessage("Signup failed. Please try again.");
        setIsSuccess(false);
      }
    } catch (err) {
      setStatusMessage(
        "Signup failed: " + (err.response?.data?.error || err.message)
      );
      setIsSuccess(false);
    }
  };

  return (
    <div className="container">
      <div className="form-box">
        <h2>Sign Up</h2>

        {statusMessage && (
          <div className={`message ${isSuccess ? "success" : "error"}`}>
            <span className="close-btn" onClick={() => setStatusMessage("")}>×</span>
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <label htmlFor="dob">Date of Birth</label>
          <input
            type="date"
            id="dob"
            name="dob"
            className="custom-date"
            value={formData.dob}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <button type="submit">Sign Up</button>
        </form>

        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;