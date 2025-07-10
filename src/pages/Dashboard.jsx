import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import Credits from "../components/Credits";

function Dashboard() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { isModern } = useTheme();

  const handleStartQuiz = () => {
    navigate("/quiz");
  };

  const handleViewResults = () => {
    navigate("/results/history");
  };

  const handleAdminPanel = () => {
    navigate("/admin");
  };

  const handleViewNotes = () => {
    navigate("/notes");
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-6 transition-all duration-300 ${
      isModern 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
        : 'bg-gray-100'
    }`}>
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className={`p-8 rounded-2xl w-full max-w-md text-center transition-all duration-300 ${
        isModern 
          ? 'bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl' 
          : 'bg-white shadow-md'
      }`}>
        <h1 className={`text-3xl font-bold mb-8 transition-colors duration-300 ${
          isModern 
            ? 'text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent' 
            : 'text-gray-800'
        }`}>
          Welcome to the Quiz App
        </h1>

        <div className="space-y-4">
          <button
            onClick={handleStartQuiz}
            className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
              isModern 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-blue-500/25' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            🚀 Start Quiz
          </button>

          <button
            onClick={handleViewResults}
            className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
              isModern 
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg hover:shadow-purple-500/25' 
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            📊 View Results
          </button>

          <button
            onClick={handleViewNotes}
            className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
              isModern 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-green-500/25' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            📚 View Notes
          </button>

          {isAdmin && (
            <button
              onClick={handleAdminPanel}
              className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                isModern 
                  ? 'bg-gradient-to-r from-gray-600 to-gray-800 text-white shadow-lg hover:shadow-gray-500/25' 
                  : 'bg-gray-700 text-white hover:bg-gray-800'
              }`}
            >
              ⚙️ Admin Panel
            </button>
          )}
        </div>

        {isModern && (
          <div className="mt-8 text-center">
            <p className="text-white/70 text-sm">
              ✨ Modern UI Theme Active
            </p>
          </div>
        )}
      </div>

      <Credits />
    </div>
  );
}

export default Dashboard;
