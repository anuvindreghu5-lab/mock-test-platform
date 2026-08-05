import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { setTokens, setUser } from "../utils/auth";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
    first_name: "",
    last_name: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check passwords match before sending
    if (formData.password !== formData.password2) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/users/register/", formData);
      setTokens(response.data.access, response.data.refresh);
      setUser(response.data.user);
      navigate("/dashboard");
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        // Collect all error messages from all fields
        const messages = [];
        Object.keys(data).forEach((key) => {
          if (Array.isArray(data[key])) {
            data[key].forEach((msg) => {
              if (key === "username") messages.push(`Username: ${msg}`);
              else if (key === "email") messages.push(`Email: ${msg}`);
              else if (key === "password") messages.push(`Password: ${msg}`);
              else if (key === "password2") messages.push(`Confirm Password: ${msg}`);
              else messages.push(msg);
            });
          } else {
            messages.push(data[key]);
          }
        });
        setError(messages.join(" | "));
      } else {
        setError("Registration failed. Please try again!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1e3a8a,#0f172a)] flex items-center justify-center p-4 overflow-hidden relative">
  
  {/* Background Glow */}
  <div className="absolute w-72 h-72 bg-blue-500/20 blur-3xl rounded-full top-10 left-10"></div>
  <div className="absolute w-72 h-72 bg-cyan-400/10 blur-3xl rounded-full bottom-10 right-10"></div>

  <div className="relative w-full max-w-md">
    
    {/* Glass Card */}
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-3xl p-8">
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
          <span className="text-2xl">🚀</span>
        </div>

        <h1 className="text-4xl font-bold text-white tracking-wide">
          Create Account
        </h1>

        <p className="text-gray-300 mt-2 text-sm">
          Join and start your exam journey
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/20 border border-red-400/30 text-red-200 px-4 py-3 rounded-xl mb-5 text-sm backdrop-blur-md">
          ⚠️ {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <input
          type="text"
          placeholder="Username"
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
          className="w-full px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300"
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          className="w-full px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="First Name"
            value={formData.first_name}
            onChange={(e) =>
              setFormData({ ...formData, first_name: e.target.value })
            }
            className="w-full px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300"
          />

          <input
            type="text"
            placeholder="Last Name"
            value={formData.last_name}
            onChange={(e) =>
              setFormData({ ...formData, last_name: e.target.value })
            }
            className="w-full px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300"
          />
        </div>

        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          className="w-full px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300"
          required
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={formData.password2}
          onChange={(e) =>
            setFormData({ ...formData, password2: e.target.value })
          }
          className="w-full px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300"
          required
        />

        {/* Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold shadow-lg hover:scale-[1.02] hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-70"
        >
          {loading ? "Creating Account..." : "Register"}
        </button>
      </form>

      {/* Login */}
      <p className="text-center mt-6 text-gray-300 text-sm">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-cyan-300 font-semibold hover:text-white transition"
        >
          Login
        </Link>
      </p>
    </div>
  </div>
</div>
  );
};

export default Register;