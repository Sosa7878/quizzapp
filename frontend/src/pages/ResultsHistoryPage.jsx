import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function ResultsHistoryPage() {
  const navigate = useNavigate();
  const [resultsHistory, setResultsHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResultsHistory();
  }, []);

  const loadResultsHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("https://quizzapp-ep6o.onrender.com/api/results/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResultsHistory(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load results history:", error);
      setResultsHistory([]);
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const viewResultDetails = (resultId) => {
    navigate(`/results/${resultId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Loading results history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-8 rounded shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Quiz Results History</h1>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>

          {resultsHistory.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 mb-4">No quiz results found.</p>
              <button
                onClick={() => navigate("/quiz")}
                className="bg-green-600 text-white py-3 px-6 rounded hover:bg-green-700 font-semibold"
              >
                Take Your First Quiz
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Score</th>
                    <th className="px-4 py-3 text-left font-semibold">Percentage</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Time Taken</th>
                    <th className="px-4 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resultsHistory.map((result, index) => (
                    <tr key={result.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-3">{formatDate(result.created_at)}</td>
                      <td className="px-4 py-3 font-semibold">
                        {result.score} / {result.total_questions}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        <span className={result.percentage >= 70 ? "text-green-600" : "text-red-600"}>
                          {result.percentage}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatTime(result.time_taken || 0)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => viewResultDetails(result.id)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {resultsHistory.length > 0 && (
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Total Quizzes:</span>
                  <span className="font-semibold ml-2">{resultsHistory.length}</span>
                </div>
                <div>
                  <span className="text-blue-700">Passed:</span>
                  <span className="font-semibold ml-2 text-green-600">
                    {resultsHistory.filter(r => r.passed).length}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Failed:</span>
                  <span className="font-semibold ml-2 text-red-600">
                    {resultsHistory.filter(r => !r.passed).length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResultsHistoryPage;
