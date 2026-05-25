import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config";

function QuizPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerMinutes, setTimerMinutes] = useState(120);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());
  const [showModuleSelect, setShowModuleSelect] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [modulesLoading, setModulesLoading] = useState(true);

  const token = localStorage.getItem("token");
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  // Load modules on mount
  useEffect(() => {
    const loadModules = async () => {
      try {
        const response = await api.get("/api/modules");
        setModules(response.data);
      } catch (error) {
        console.error("Failed to load modules:", error);
      }
      setModulesLoading(false);
    };
    loadModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load questions after module selection
  const loadQuestions = async (moduleId) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/quiz?module_id=${moduleId}`);
      const { questions: qs, timer_minutes } = response.data;
      setQuestions(qs);
      setTimerMinutes(timer_minutes);
      setTimeLeft(timer_minutes * 60);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load questions:", error);
      navigate("/dashboard");
    }
  };

  const handleModuleSelect = () => {
    if (!selectedModuleId) {
      alert("Zgjidhni fillimisht një modul");
      return;
    }
    const mod = modules.find(m => m.id === parseInt(selectedModuleId));
    if (mod) {
      setTimerMinutes(mod.timer_minutes);
      setTimeLeft(mod.timer_minutes * 60);
    }
    loadQuestions(selectedModuleId);
    setShowModuleSelect(false);
    setShowInstructions(true);
  };

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
  }, [timeLeft, quizStarted]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }));
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
      const answersArray = questions.map((_, index) => answers[index] !== undefined ? answers[index] : -1);
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      const response = await api.post("/api/quiz/submit", {
        answers: answersArray,
        questions: questions,
        timeTaken: timeTaken
      });
      navigate("/results", {
        state: {
          resultData: response.data,
          questions: questions,
          answers: answersArray
        }
      });
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      alert("Dorëzimi i kuizit dështoi. Provo përsëri.");
    }
  };

  const handleCancel = () => {
    if (window.confirm("Jeni të sigurt që doni të anuloni kuizin? Përparimi juaj do të humbasë.")) {
      navigate("/dashboard");
    }
  };

  // Module Selection Screen
  if (showModuleSelect) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">
            Zgjidh Modulin
          </h1>
          <p className="text-center text-gray-600 mb-6">Zgjidhni një modul për të filluar kuizin</p>
          {modulesLoading ? (
            <p className="text-center">Duke ngarkuar modulet...</p>
          ) : modules.length === 0 ? (
            <p className="text-center text-red-500">Nuk ka module të disponueshme. Kontaktoni adminin.</p>
          ) : (
            <div className="space-y-3">
              <select
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value)}
                className="w-full p-3 border rounded text-lg"
              >
                <option value="">-- Zgjidh Modulin --</option>
                {modules.map(mod => (
                  <option key={mod.id} value={mod.id}>
                    {mod.name} ({mod.timer_minutes} min)
                  </option>
                ))}
              </select>
              <button
                onClick={handleModuleSelect}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg"
              >
                Vazhdo
              </button>
            </div>
          )}
          <div className="flex justify-center mt-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Kthehu
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Duke ngarkuar kuizin...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Nuk ka pyetje të disponueshme në këtë modul</div>
      </div>
    );
  }

  // Instructions Screen
  if (showInstructions) {
    const hrs = Math.floor(timerMinutes / 60);
    const mins = timerMinutes % 60;
    const timeStr = hrs > 0 ? `${hrs} orë ${mins > 0 ? `${mins} min` : ''}` : `${timerMinutes} minuta`;
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
          <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">
            Udhëzime për Kuizin
          </h1>
          <div className="space-y-4 text-lg">
            <p className="text-center font-semibold text-gray-800">
              Kuizi ka <span className="text-blue-600">{questions.length} pyetje</span>
            </p>
            <p className="text-center">
              Për të kaluar kuizin ju duhet të merrni <span className="text-green-600 font-semibold">70 pikë</span>
            </p>
            <p className="text-center">
              Çdo pyetje ka <span className="text-blue-600 font-semibold">1 pikë</span> dhe vetëm <span className="text-red-600 font-semibold">1 përgjigje të saktë</span>
            </p>
            <p className="text-center">
              Koha e testit është <span className="text-orange-600 font-semibold">{timeStr}</span>
            </p>
            <div className="border-t pt-4 mt-6">
              <p className="text-center text-xl font-semibold text-green-600">
                Ju urojmë fat të mirë!
              </p>
            </div>
          </div>
          <div className="flex justify-center space-x-4 mt-8">
            <button onClick={() => navigate("/dashboard")} className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
              Anulo
            </button>
            <button onClick={handleStartQuiz} className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold">
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
            Koha e Mbetur: <span className={timeLeft < 600 ? "text-red-600" : "text-green-600"}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="text-lg">
            Pyetja {currentQuestion + 1} nga {questions.length}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded shadow-md">
          <h2 className="text-2xl font-semibold mb-6 text-center">{question.question}</h2>
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
              Para
            </button>
            <div className="flex space-x-4">
              <button onClick={handleCancel} className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                Anulo Kuizin
              </button>
              {currentQuestion === questions.length - 1 ? (
                <button onClick={handleSubmitQuiz} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  Dorëzo Kuizin
                </button>
              ) : (
                <button onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Tjetra
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Navigation Grid */}
        <div className="bg-white p-6 rounded shadow-md mt-6">
          <h3 className="text-lg font-semibold mb-4">Navigimi i Pyetjeve</h3>
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
            <div className="flex items-center"><div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>Aktuale</div>
            <div className="flex items-center"><div className="w-4 h-4 bg-green-500 rounded mr-2"></div>U Përgjigj</div>
            <div className="flex items-center"><div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>Pa Përgjigje</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuizPage;

