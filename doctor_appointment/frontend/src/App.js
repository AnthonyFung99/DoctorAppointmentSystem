// Import necessary dependencies
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import all components
import Login from "./components/login/Login";
import Signup from "./components/signup/Signup";
import Header from "./components/header/Header";
import Home from "./components/home/Home";
import DoctorDetails from "./components/doctorDetails/DoctorDetails";
import BookAppointment from "./components/bookAppointment/BookAppointment";
import Logout from "./components/login/Logout";
import About from "./components/about/About";
import ShowAppointments from "./components/showAppointment/ShowAppointments";

function App() {
  // Track login state based on localStorage value
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  // Sync login state on component mount
  useEffect(() => {
    const stored = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(stored);
  }, []);

  return (
    // Set up React Router
    <Router>
      <div className="App">
        {/* Render Header on all pages */}
        <Header isLoggedIn={isLoggedIn} />

        {/* Define all routes in the application */}
        <Routes>
          {/* Login route - Pass setIsLoggedIn to update login state */}
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />

          {/* Conditionally render About page or redirect to login */}
          <Route
            path="/about"
            element={isLoggedIn ? <About /> : <Login setIsLoggedIn={setIsLoggedIn} />}
          />

          {/* Show all appointments */}
          <Route path="/appointments" element={<ShowAppointments />} />

          {/* Sign-up page */}
          <Route path="/signup" element={<Signup />} />

          {/* Home page */}
          <Route path="/" element={<Home />} />

          {/* Doctor details page (dynamic route) */}
          <Route path="/doctor/:id" element={<DoctorDetails />} />

          {/* Book an appointment (dynamic route) */}
          <Route path="/book-appointment/:doctorId" element={<BookAppointment />} />

          {/* Logout route: Pass setIsLoggedIn to clear login state */}
          <Route path="/logout" element={<Logout setIsLoggedIn={setIsLoggedIn} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;