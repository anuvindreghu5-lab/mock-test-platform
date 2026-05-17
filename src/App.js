import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { isAuthenticated } from "./utils/auth";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import TestPage from "./pages/TestPage";
import ResultPage from "./pages/ResultPage";
import AdminUpload from "./pages/AdminUpload";

// Logo
import logo from "./assets/rankpilot-logo.png";

// Protected Route
const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // SPLASH SCREEN
  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#0f172a] flex flex-col items-center justify-center">

        <img
          src={logo}
          alt="RankPilot"
          className="w-28 h-28 mb-5 animate-pulse"
        />

        <h1 className="text-4xl font-bold text-white">
          RankPilot
        </h1>

        <p className="text-cyan-400 mt-2 text-sm tracking-widest">
          EXAM PREPARATION PLATFORM
        </p>

        {/* Loading dots */}
        <div className="flex gap-2 mt-6">
          <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce delay-100"></div>
          <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce delay-200"></div>
        </div>
      </div>
    );
  }

  // MAIN APP
  return (
    <Router>
      <Routes>

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/test/:testId"
          element={
            <ProtectedRoute>
              <TestPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/result/:resultId"
          element={
            <ProtectedRoute>
              <ResultPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/upload"
          element={
            <ProtectedRoute>
              <AdminUpload />
            </ProtectedRoute>
          }
        />

        {/* ROOT */}
        <Route
          path="/"
          element={
            isAuthenticated() ? (
              <Navigate to="/dashboard" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

      </Routes>
    </Router>
  );
}

export default App;