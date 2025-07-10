import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function ResultDetailsPage() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [resultData, setResultData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResultDetails();
  }, [resultId]);

  const loadResultDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`https://quizzapp-ep6o.onrender.com/api/results/${resultId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setResultData(response.data);
      
      // Load questions for detailed review
      const questionsResponse = await axios.get("https://quizzapp-ep6o.onrender.com/api/quiz", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuestions(questionsResponse.data.slice(0, response.data.totalQuestions));
      setLoading(false);
    } catch (error) {
      console.error("Failed to load result details:", error);
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
    return date.toLocaleDateString() + " at " + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Loading result details...</div>
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded shadow-md text-center">
          <p>Result not found.</p>
          <button
            onClick={() => navigate("/results/history")}
            className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Results Summary */}
        <div className="bg-white p-8 rounded shadow-md mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Quiz Result Details</h1>
            <button
              onClick={() => navigate("/results/history")}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Back to History
            </button>
          </div>
          
          <div className="text-center mb-6">
            <p className="text-gray-600">Completed on {formatDate(resultData.createdAt)}</p>
          </div>
          
          <div className={`text-center p-6 rounded-lg mb-6 ${
            resultData.passed ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'
          } border-2`}>
            <h2 className={`text-2xl font-bold mb-2 ${
              resultData.passed ? 'text-green-700' : 'text-red-700'
            }`}>
              {resultData.passed ? '🎉 PASSED' : '😔 FAILED'}
            </h2>
            <p className={`text-lg ${
              resultData.passed ? 'text-green-600' : 'text-red-600'
            }`}>
              {resultData.message}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-700">Score</h3>
              <p className="text-2xl font-bold text-blue-800">
                {resultData.score} / {resultData.totalQuestions}
              </p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-700">Percentage</h3>
              <p className="text-2xl font-bold text-purple-800">
                {resultData.percentage}%
              </p>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-700">Time Taken</h3>
              <p className="text-2xl font-bold text-yellow-800">
                {formatTime(resultData.timeTaken || 0)}
              </p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700">Status</h3>
              <p className={`text-2xl font-bold ${
                resultData.passed ? 'text-green-600' : 'text-red-600'
              }`}>
                {resultData.passed ? 'PASSED' : 'FAILED'}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Question Review */}
        {questions.length > 0 && resultData && resultData.answers && (
          <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-2xl font-bold mb-6">Question Review</h2>
            
            {questions.map((question, idx) => {
              const userAnswer = resultData.answers[idx];
              const isCorrect = userAnswer !== -1 && parseInt(question.correct) === parseInt(userAnswer);
              const wasAnswered = userAnswer !== -1;
              
              return (
                <div
                  key={idx}
                  className={`border-l-4 p-4 mb-4 ${
                    isCorrect ? "border-green-500 bg-green-50" : 
                    wasAnswered ? "border-red-500 bg-red-50" : 
                    "border-gray-500 bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-lg">
                      {idx + 1}. {question.question}
                    </p>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                      isCorrect ? "bg-green-200 text-green-800" : 
                      wasAnswered ? "bg-red-200 text-red-800" : 
                      "bg-gray-200 text-gray-800"
                    }`}>
                      {isCorrect ? "✓ Correct" : wasAnswered ? "✗ Incorrect" : "⊘ Not Answered"}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                    {question.options && question.options.map((option, optIdx) => (
                      <div
                        key={optIdx}
                        className={`p-2 rounded border ${
                          optIdx === parseInt(question.correct) ? "bg-green-100 border-green-300" :
                          optIdx === userAnswer ? "bg-red-100 border-red-300" :
                          "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <span className="font-semibold mr-2">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        {option}
                        {optIdx === parseInt(question.correct) && (
                          <span className="ml-2 text-green-600 font-semibold">✓ Correct</span>
                        )}
                        {optIdx === userAnswer && optIdx !== parseInt(question.correct) && (
                          <span className="ml-2 text-red-600 font-semibold">✗ Your Answer</span>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {!wasAnswered && (
                    <p className="text-gray-600 italic">
                      You did not answer this question.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="text-center mt-8 space-x-4">
          <button
            onClick={() => navigate("/results/history")}
            className="bg-blue-600 text-white py-3 px-6 rounded hover:bg-blue-700 font-semibold"
          >
            Back to History
          </button>
          <button
            onClick={() => navigate("/quiz")}
            className="bg-green-600 text-white py-3 px-6 rounded hover:bg-green-700 font-semibold"
          >
            Take Another Quiz
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultDetailsPage;

