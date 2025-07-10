import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function QuizPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(2 * 60 * 60); // 2 hours in seconds
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());
  const [showInstructions, setShowInstructions] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);

  // Load questions from backend
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("https://quizzapp-ep6o.onrender.com/api/quiz", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuestions(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load questions:", error);
        navigate("/dashboard");
      }
    };

    loadQuestions();
  }, [navigate]);

  // Timer countdown
  useEffect(() => {
    if (!quizStarted) return;
    
    if (timeLeft <= 0) {
      handleSubmitQuiz();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, quizStarted]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartQuiz = () => {
    setShowInstructions(false);
    setQuizStarted(true);
  };

  const handleAnswer = (questionIndex, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      const token = localStorage.getItem("token");
      const answersArray = questions.map((_, index) => answers[index] !== undefined ? answers[index] : -1);
      const timeTaken = Math.floor((Date.now() - startTime) / 1000); // Time in seconds
      
      const response = await axios.post("https://quizzapp-ep6o.onrender.com/api/quiz/submit", {
        answers: answersArray,
        questions: questions,
        timeTaken: timeTaken
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Navigate to results page with the result data
      navigate("/results", { 
        state: { 
          resultData: response.data,
          questions: questions,
          answers: answersArray
        } 
      });
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      alert("Failed to submit quiz. Please try again.");
    }
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel the quiz? Your progress will be lost.")) {
      navigate("/dashboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Loading quiz...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">No questions available</div>
      </div>
    );
  }

  // Show Albanian instructions modal
  if (showInstructions) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
          <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">
            Udhëzime për Kuizin
          </h1>
          
          <div className="space-y-4 text-lg">
            <p className="text-center font-semibold text-gray-800">
              Kuizi ka <span className="text-blue-600">100 pyetje</span>
            </p>
            
            <p className="text-center">
              Për të kaluar kuizin ju duhet të merrni <span className="text-green-600 font-semibold">70 pikë</span>
            </p>
            
            <p className="text-center">
              Çdo pyetje ka <span className="text-blue-600 font-semibold">1 pikë</span> dhe vetëm <span className="text-red-600 font-semibold">1 përgjigje të saktë</span>
            </p>
            
            <p className="text-center">
              Koha e testit është <span className="text-orange-600 font-semibold">2 orë</span>
            </p>
            
            <div className="border-t pt-4 mt-6">
              <p className="text-center text-xl font-semibold text-green-600">
                Ju urojmë fat të mirë! 🍀
              </p>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4 mt-8">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Anulo
            </button>
            <button
              onClick={handleStartQuiz}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Filloj Kuizin
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Timer and Progress Bar */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-white p-4 rounded shadow-md flex justify-between items-center">
          <div className="text-lg font-semibold">
            Time Left: <span className={timeLeft < 600 ? "text-red-600" : "text-green-600"}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="text-lg">
            Question {currentQuestion + 1} of {questions.length}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded shadow-md">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            {question.question}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(currentQuestion, idx)}
                className={`p-4 text-left rounded border-2 transition-all ${
                  answers[currentQuestion] === idx
                    ? "border-blue-600 bg-blue-50 text-blue-800"
                    : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                }`}
              >
                <span className="font-semibold mr-2">{String.fromCharCode(65 + idx)}.</span>
                {option}
              </button>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex space-x-4">
              <button
                onClick={handleCancel}
                className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Cancel Quiz
              </button>
              
              {currentQuestion === questions.length - 1 ? (
                <button
                  onClick={handleSubmitQuiz}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Submit Quiz
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Navigation Grid */}
        <div className="bg-white p-6 rounded shadow-md mt-6">
          <h3 className="text-lg font-semibold mb-4">Question Navigation</h3>
          <div className="grid grid-cols-10 gap-2">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-10 h-10 rounded text-sm font-semibold ${
                  idx === currentQuestion
                    ? "bg-blue-600 text-white"
                    : answers[idx] !== undefined
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <div className="flex justify-center space-x-6 mt-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
              Current
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              Answered
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
              Unanswered
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuizPage;

