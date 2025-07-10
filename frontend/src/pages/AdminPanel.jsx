import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import Credits from "../components/Credits";

function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [bulkUploadText, setBulkUploadText] = useState("");
  const { isModern } = useTheme();
  
  // Question form state
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correct: 0,
    category: "historical"
  });

  // Note form state
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    type: "text"
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    loadUsers();
    loadQuestions();
    loadNotes();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await axios.get("https://quizzapp-ep6o.onrender.com/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const loadQuestions = async () => {
    try {
      const response = await axios.get("https://quizzapp-ep6o.onrender.com/api/admin/questions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuestions(response.data);
    } catch (error) {
      console.error("Failed to load questions:", error);
    }
  };

  const loadNotes = async () => {
    try {
      const response = await axios.get("https://quizzapp-ep6o.onrender.com/api/admin/notes", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(response.data);
    } catch (error) {
      console.error("Failed to load notes:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    
    try {
      await axios.delete(`https://quizzapp-ep6o.onrender.com/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user");
    }
  };

  const handleViewUserHistory = async (userId) => {
    try {
      const response = await axios.get(`https://quizzapp-ep6o.onrender.com/api/results/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserHistory(response.data);
      setSelectedUser(users.find(u => u.id === userId));
    } catch (error) {
      console.error("Failed to load user history:", error);
      alert("Failed to load user history");
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    
    try {
      await axios.delete(`https://quizzapp-ep6o.onrender.com/api/admin/questions/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadQuestions();
    } catch (error) {
      console.error("Failed to delete question:", error);
      alert("Failed to delete question");
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.question || !newQuestion.optionA || !newQuestion.optionB || 
        !newQuestion.optionC || !newQuestion.optionD) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const options = [newQuestion.optionA, newQuestion.optionB, newQuestion.optionC, newQuestion.optionD];
      
      await axios.post("https://quizzapp-ep6o.onrender.com/api/admin/questions", {
        question: newQuestion.question,
        options: JSON.stringify(options),
        correct: newQuestion.correct,
        category: newQuestion.category
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNewQuestion({
        question: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correct: 0,
        category: "historical"
      });
      loadQuestions();
    } catch (error) {
      console.error("Failed to add question:", error);
      alert("Failed to add question");
    }
  };

  const handleEditQuestion = (question) => {
    const options = JSON.parse(question.options);
    setEditingQuestion({
      id: question.id,
      question: question.question,
      optionA: options[0],
      optionB: options[1],
      optionC: options[2],
      optionD: options[3],
      correct: question.correct,
      category: question.category
    });
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion.question || !editingQuestion.optionA || !editingQuestion.optionB || 
        !editingQuestion.optionC || !editingQuestion.optionD) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const options = [editingQuestion.optionA, editingQuestion.optionB, editingQuestion.optionC, editingQuestion.optionD];
      
      await axios.put(`https://quizzapp-ep6o.onrender.com/api/admin/questions/${editingQuestion.id}`, {
        question: editingQuestion.question,
        options: JSON.stringify(options),
        correct: editingQuestion.correct,
        category: editingQuestion.category
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setEditingQuestion(null);
      loadQuestions();
    } catch (error) {
      console.error("Failed to update question:", error);
      alert("Failed to update question");
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkUploadText.trim()) {
      alert("Please enter questions in the specified format");
      return;
    }

    try {
      const lines = bulkUploadText.trim().split('\n');
      const questions = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split('|');
        if (parts.length !== 7) {
          alert(`Invalid format on line ${i + 1}. Expected format: question|optionA|optionB|optionC|optionD|correct|category`);
          return;
        }

        questions.push({
          question: parts[0].trim(),
          optionA: parts[1].trim(),
          optionB: parts[2].trim(),
          optionC: parts[3].trim(),
          optionD: parts[4].trim(),
          correct: parseInt(parts[5].trim()),
          category: parts[6].trim()
        });
      }

      const response = await axios.post("https://quizzapp-ep6o.onrender.com/api/admin/questions/bulk", {
        questions
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(response.data.message);
      if (response.data.errors && response.data.errors.length > 0) {
        console.log("Errors:", response.data.errors);
      }
      
      setBulkUploadText("");
      loadQuestions();
    } catch (error) {
      console.error("Failed to bulk upload questions:", error);
      alert("Failed to bulk upload questions");
    }
  };

  const handleAddNote = async () => {
    if (!newNote.title || !newNote.content) {
      alert("Please fill in all fields");
      return;
    }

    try {
      await axios.post("https://quizzapp-ep6o.onrender.com/api/admin/notes", newNote, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNewNote({ title: "", content: "", type: "text" });
      loadNotes();
    } catch (error) {
      console.error("Failed to add note:", error);
      alert("Failed to add note");
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    
    try {
      await axios.delete(`https://quizzapp-ep6o.onrender.com/api/admin/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadNotes();
    } catch (error) {
      console.error("Failed to delete note:", error);
      alert("Failed to delete note");
    }
  };

  return (
    <div className={`min-h-screen p-6 transition-all duration-300 ${
      isModern 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
        : 'bg-gray-100'
    }`}>
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="max-w-7xl mx-auto">
        <h1 className={`text-3xl font-bold mb-6 text-center transition-colors duration-300 ${
          isModern 
            ? 'text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent' 
            : 'text-gray-800'
        }`}>
          Admin Panel
        </h1>

        {/* Tab Navigation */}
        <div className={`rounded-lg shadow-md mb-6 transition-all duration-300 ${
          isModern 
            ? 'bg-white/10 backdrop-blur-lg border border-white/20' 
            : 'bg-white'
        }`}>
          <div className="flex border-b border-gray-200/20">
            {[
              { id: "users", label: "User Management" },
              { id: "questions", label: "Question Management" },
              { id: "notes", label: "Notes Management" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? isModern
                      ? "border-b-2 border-blue-400 text-blue-400 bg-blue-500/10"
                      : "border-b-2 border-blue-500 text-blue-600"
                    : isModern
                      ? "text-white/70 hover:text-white hover:bg-white/5"
                      : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Users</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Role</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-t">
                      <td className="px-4 py-2">{user.name}</td>
                      <td className="px-4 py-2">{user.email}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-sm ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleViewUserHistory(user.id)}
                          className="bg-blue-500 text-white px-3 py-1 rounded mr-2 hover:bg-blue-600"
                        >
                          View History
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* User History Modal */}
            {selectedUser && (
              <div className="mt-6 p-4 bg-gray-50 rounded">
                <h3 className="text-lg font-semibold mb-3">
                  Quiz History for {selectedUser.name}
                </h3>
                {userHistory.length > 0 ? (
                  <div className="space-y-2">
                    {userHistory.map((result, index) => (
                      <div key={result.id || index} className="bg-white p-3 rounded border">
                        <p>Score: {result.score}/{result.total_questions} ({result.percentage}%) | 
                           Status: {result.passed ? 'PASSED' : 'FAILED'} | 
                           Date: {new Date(result.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No quiz history found for this user.</p>
                )}
                <button
                  onClick={() => setSelectedUser(null)}
                  className="mt-3 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === "questions" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Questions Management</h2>
            
            {/* Add Question Form */}
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <h3 className="text-lg font-semibold mb-3">Add New Question</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    placeholder="Question"
                    value={newQuestion.question}
                    onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Option A"
                  value={newQuestion.optionA}
                  onChange={(e) => setNewQuestion({...newQuestion, optionA: e.target.value})}
                  className="p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Option B"
                  value={newQuestion.optionB}
                  onChange={(e) => setNewQuestion({...newQuestion, optionB: e.target.value})}
                  className="p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Option C"
                  value={newQuestion.optionC}
                  onChange={(e) => setNewQuestion({...newQuestion, optionC: e.target.value})}
                  className="p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Option D"
                  value={newQuestion.optionD}
                  onChange={(e) => setNewQuestion({...newQuestion, optionD: e.target.value})}
                  className="p-2 border rounded"
                />
                <select
                  value={newQuestion.correct}
                  onChange={(e) => setNewQuestion({...newQuestion, correct: parseInt(e.target.value)})}
                  className="p-2 border rounded"
                >
                  <option value={0}>A is correct</option>
                  <option value={1}>B is correct</option>
                  <option value={2}>C is correct</option>
                  <option value={3}>D is correct</option>
                </select>
                <select
                  value={newQuestion.category}
                  onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
                  className="p-2 border rounded"
                >
                  <option value="historical">Historical/Grammatical</option>
                  <option value="math">Math</option>
                  <option value="logical">Logical</option>
                </select>
              </div>
              <button
                onClick={handleAddQuestion}
                className="mt-3 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Add Question
              </button>
            </div>

            {/* Bulk Upload Section */}
            <div className="mb-6 p-4 bg-blue-50 rounded">
              <h3 className="text-lg font-semibold mb-3">Bulk Upload Questions</h3>
              <p className="text-sm text-gray-600 mb-3">
                Format: question|optionA|optionB|optionC|optionD|correct|category<br/>
                Example: What is 2+2?|2|3|4|5|2|math<br/>
                Correct: 0=A, 1=B, 2=C, 3=D | Categories: historical, math, logical
              </p>
              <textarea
                placeholder="Enter questions in the format above, one per line..."
                value={bulkUploadText}
                onChange={(e) => setBulkUploadText(e.target.value)}
                className="w-full p-2 border rounded h-32"
              />
              <button
                onClick={handleBulkUpload}
                className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Upload Questions
              </button>
            </div>

            {/* Edit Question Modal */}
            {editingQuestion && (
              <div className="mb-6 p-4 bg-yellow-50 rounded border-2 border-yellow-200">
                <h3 className="text-lg font-semibold mb-3">Edit Question</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      placeholder="Question"
                      value={editingQuestion.question}
                      onChange={(e) => setEditingQuestion({...editingQuestion, question: e.target.value})}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Option A"
                    value={editingQuestion.optionA}
                    onChange={(e) => setEditingQuestion({...editingQuestion, optionA: e.target.value})}
                    className="p-2 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Option B"
                    value={editingQuestion.optionB}
                    onChange={(e) => setEditingQuestion({...editingQuestion, optionB: e.target.value})}
                    className="p-2 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Option C"
                    value={editingQuestion.optionC}
                    onChange={(e) => setEditingQuestion({...editingQuestion, optionC: e.target.value})}
                    className="p-2 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Option D"
                    value={editingQuestion.optionD}
                    onChange={(e) => setEditingQuestion({...editingQuestion, optionD: e.target.value})}
                    className="p-2 border rounded"
                  />
                  <select
                    value={editingQuestion.correct}
                    onChange={(e) => setEditingQuestion({...editingQuestion, correct: parseInt(e.target.value)})}
                    className="p-2 border rounded"
                  >
                    <option value={0}>A is correct</option>
                    <option value={1}>B is correct</option>
                    <option value={2}>C is correct</option>
                    <option value={3}>D is correct</option>
                  </select>
                  <select
                    value={editingQuestion.category}
                    onChange={(e) => setEditingQuestion({...editingQuestion, category: e.target.value})}
                    className="p-2 border rounded"
                  >
                    <option value="historical">Historical/Grammatical</option>
                    <option value="math">Math</option>
                    <option value="logical">Logical</option>
                  </select>
                </div>
                <div className="mt-3 space-x-2">
                  <button
                    onClick={handleUpdateQuestion}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Update Question
                  </button>
                  <button
                    onClick={() => setEditingQuestion(null)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-3">
              {questions.map(question => (
                <div key={question.id} className="border p-4 rounded">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{question.question}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Category: {question.category} | Correct: {String.fromCharCode(65 + question.correct)}
                      </p>
                      {question.options && (
                        <div className="mt-2 text-sm">
                          {JSON.parse(question.options).map((option, idx) => (
                            <span key={idx} className="mr-4">
                              {String.fromCharCode(65 + idx)}: {option}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleEditQuestion(question)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === "notes" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Notes Management</h2>
            
            {/* Add Note Form */}
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <h3 className="text-lg font-semibold mb-3">Add New Note</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Note Title"
                  value={newNote.title}
                  onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <textarea
                  placeholder="Note Content"
                  value={newNote.content}
                  onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                  className="w-full p-2 border rounded h-32"
                />
                <select
                  value={newNote.type}
                  onChange={(e) => setNewNote({...newNote, type: e.target.value})}
                  className="p-2 border rounded"
                >
                  <option value="text">Text</option>
                  <option value="pdf">PDF</option>
                </select>
                <button
                  onClick={handleAddNote}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Add Note
                </button>
              </div>
            </div>

            {/* Notes List */}
            <div className="space-y-3">
              {notes.map(note => (
                <div key={note.id} className="border p-4 rounded">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{note.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">Type: {note.type}</p>
                      <p className="mt-2">{note.content.substring(0, 100)}...</p>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Credits />
    </div>
  );
}

export default AdminPanel;

