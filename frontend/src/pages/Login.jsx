import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";
import API_BASE_URL from "../config";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isModern } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/login`, {
        email,
        password,
      });

      const { token } = response.data;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isAdmin = payload.role === 'admin';

      login(token, isAdmin);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Kyçja dështoi");
    }
  };

  return (
    <div className={`flex items-center justify-center min-h-screen p-4 transition-all duration-300 ${
      isModern
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'
        : 'bg-gradient-to-br from-blue-50 via-white to-blue-50'
    }`}>
      <div className={`w-full max-w-md transition-all duration-300 ${
        isModern
          ? 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl'
          : 'bg-white shadow-xl'
      } rounded-2xl p-8`}>
        {/* Logo/Icon */}
        <div className="text-center mb-8">
          <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl ${
            isModern
              ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg'
              : 'bg-blue-600 shadow-md'
          }`}>
            <span className="text-white font-bold">G63</span>
          </div>
          <h1 className={`text-2xl font-bold ${isModern ? 'text-white' : 'text-gray-800'}`}>
            Aplikacioni i Përgatitjes për Testime
          </h1>
          <p className={`text-sm mt-1 ${isModern ? 'text-white/60' : 'text-gray-500'}`}>
            Kyçu për të vazhduar
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isModern ? 'text-white/80' : 'text-gray-700'}`}>
              Email ose Emri i përdoruesit
            </label>
            <input
              type="text"
              placeholder="Email ose User"
              className={`w-full p-3 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isModern
                  ? 'bg-white/20 border-white/30 text-white placeholder-white/50'
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${isModern ? 'text-white/80' : 'text-gray-700'}`}>
              Fjalëkalimi
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className={`w-full p-3 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isModern
                  ? 'bg-white/20 border-white/30 text-white placeholder-white/50'
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className={`p-3 rounded-xl text-sm text-center ${
              isModern ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-95 ${
              isModern
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg hover:shadow-blue-500/25'
                : 'bg-blue-600 hover:bg-blue-700 shadow-md'
            }`}
          >
            Kyçu
          </button>
        </form>

        <div className={`mt-6 text-center text-xs ${isModern ? 'text-white/40' : 'text-gray-400'}`}>
          &copy; {new Date().getFullYear()} Valdrin Preteni &mdash; All rights reserved
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
