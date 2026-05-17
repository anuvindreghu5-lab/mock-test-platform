import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { setTokens, setUser } from "../utils/auth";

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("LOGIN DATA SENT:", formData); // 👈 DEBUG LINE

    setLoading(true);

    try {
      const response = await api.post("/token/", {
        username: formData.username,
        password: formData.password,
      });

      setTokens(response.data.access, response.data.refresh);

      const userData = { username: formData.username };
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));

      navigate("/dashboard");

    } catch (err) {
      console.log("LOGIN ERROR:", err.response?.data || err.message);
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1e3a8a,#0f172a)] flex items-center justify-center px-4 overflow-hidden relative">
  
  {/* Background Glow */}
  <div className="absolute w-72 h-72 bg-blue-500/20 blur-3xl rounded-full top-10 left-10"></div>
  <div className="absolute w-72 h-72 bg-cyan-400/10 blur-3xl rounded-full bottom-10 right-10"></div>

  <div className="relative w-full max-w-md">
    
    {/* Glass Card */}
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-3xl p-8">
      
      {/* Logo / Heading */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
          <span className="text-2xl">🎓</span>
        </div>

        <h1 className="text-4xl font-bold text-white tracking-wide">
          Online Exam
        </h1>

        <p className="text-gray-300 mt-2 text-sm">
          Continue your learning journey
        </p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-400/30 text-red-200 px-4 py-3 rounded-xl mb-5 text-sm backdrop-blur-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Username */}
        <div>
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
        </div>

        {/* Password */}
        <div>
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
        </div>

        {/* Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold shadow-lg hover:scale-[1.02] hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-70"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {/* Register */}
      <p className="text-center mt-6 text-gray-300 text-sm">
        Don&apos;t have an account?{" "}
        <Link
          to="/register"
          className="text-cyan-300 font-semibold hover:text-white transition"
        >
          Register
        </Link>
      </p>
    </div>
  </div>
</div>
  );
};

export default Login;