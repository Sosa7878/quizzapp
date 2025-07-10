import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import QuizPage from "./pages/QuizPage";
import ResultPage from "./pages/ResultPage";
import ResultDetailsPage from "./pages/ResultDetailsPage";
import ResultsHistoryPage from "./pages/ResultsHistoryPage";
import AdminPanel from "./pages/AdminPanel";
import NotesPage from "./pages/NotesPage";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.css";

function App() {
  return (
    <Router basename="/">
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <div className="App">
              <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/quiz" element={<QuizPage />} />
                <Route path="/results" element={<ResultPage />} />
                <Route path="/results/:resultId" element={<ResultDetailsPage />} />
                <Route path="/results/history" element={<ResultsHistoryPage />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/notes" element={<NotesPage />} />
              </Routes>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;

