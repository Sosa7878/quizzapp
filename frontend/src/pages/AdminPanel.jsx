import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import Credits from "../components/Credits";
import API_BASE_URL from "../config";

function AdminPanel() {
  const [activeTab, setActiveTab] = useState("modules");
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [notes, setNotes] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const [bulkUploadText, setBulkUploadText] = useState("");
  const { isModern } = useTheme();
  
  const token = localStorage.getItem("token");
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  // Question form state
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correct: 0,
    module_id: ""
  });

  // Module form state
  const [newModule, setNewModule] = useState({
    name: "",
    timer_minutes: 30
  });

  // Note form state
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    type: "text"
  });

  useEffect(() => {
    loadModules();
    loadUsers();
    loadQuestions();
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadModules = async () => {
    try {
      const response = await api.get("/api/admin/modules");
      setModules(response.data);
    } catch (error) {
      console.error("Failed to load modules:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get("/api/admin/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const loadQuestions = async () => {
    try {
      const response = await api.get("/api/admin/questions");
      setQuestions(response.data);
    } catch (error) {
      console.error("Failed to load questions:", error);
    }
  };

  const loadNotes = async () => {
    try {
      const response = await api.get("/api/admin/notes");
      setNotes(response.data);
    } catch (error) {
      console.error("Failed to load notes:", error);
    }
  };

  // ==================== MODULE HANDLERS ====================
  
  const handleAddModule = async () => {
    if (!newModule.name || !newModule.timer_minutes) {
      alert("Plotësoni të gjitha fushat");
      return;
    }
    try {
      await api.post("/api/admin/modules", newModule);
      setNewModule({ name: "", timer_minutes: 30 });
      loadModules();
    } catch (error) {
      console.error("Failed to add module:", error);
      alert("Shtimi i modulit dështoi");
    }
  };

  const handleEditModule = (mod) => {
    setEditingModule({ id: mod.id, name: mod.name, timer_minutes: mod.timer_minutes });
  };

  const handleUpdateModule = async () => {
    if (!editingModule.name || !editingModule.timer_minutes) {
      alert("Plotësoni të gjitha fushat");
      return;
    }
    try {
      await api.put(`/api/admin/modules/${editingModule.id}`, {
        name: editingModule.name,
        timer_minutes: editingModule.timer_minutes
      });
      setEditingModule(null);
      loadModules();
    } catch (error) {
      console.error("Failed to update module:", error);
      alert("Përditësimi i modulit dështoi");
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm("Fshini këtë modul? Pyetjet në këtë modul do të shkëputen.")) return;
    try {
      await api.delete(`/api/admin/modules/${moduleId}`);
      loadModules();
      loadQuestions();
    } catch (error) {
      console.error("Failed to delete module:", error);
      alert("Fshirja e modulit dështoi");
    }
  };

  // User form state
  const [newUser, setNewUser] = useState({
    name: "", username: "", email: "", password: "", role: "user"
  });
  const [editingUser, setEditingUser] = useState(null);

  // ==================== USER HANDLERS ====================

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.password) {
      alert("Emri dhe fjalëkalimi janë të detyrueshëm");
      return;
    }
    try {
      await api.post("/api/admin/users", newUser);
      setNewUser({ name: "", username: "", email: "", password: "", role: "user" });
      loadUsers();
    } catch (error) {
      console.error("Failed to add user:", error);
      alert("Shtimi i përdoruesit dështoi");
    }
  };

  const handleEditUser = (user) => {
    setEditingUser({
      id: user.id,
      name: user.name,
      username: user.username || "",
      email: user.email || "",
      role: user.role,
      password: ""
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser.name) {
      alert("Emri është i detyrueshëm");
      return;
    }
    try {
      const payload = {
        name: editingUser.name,
        username: editingUser.username || null,
        email: editingUser.email || null,
        role: editingUser.role
      };
      if (editingUser.password) {
        payload.password = editingUser.password;
      }
      await api.put(`/api/admin/users/${editingUser.id}`, payload);
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error("Failed to update user:", error);
      alert("Përditësimi i përdoruesit dështoi");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Jeni të sigurt që doni të fshini këtë përdorues?")) return;
    try {
      await api.delete(`/api/admin/users/${userId}`);
      loadUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Fshirja e përdoruesit dështoi");
    }
  };

  const handleViewUserHistory = async (userId) => {
    try {
      const response = await api.get(`/api/results/user/${userId}`);
      setUserHistory(response.data);
      setSelectedUser(users.find(u => u.id === userId));
    } catch (error) {
      console.error("Failed to load user history:", error);
      alert("Ngarkimi i historikut dështoi");
    }
  };

  // ==================== QUESTION HANDLERS ====================

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Jeni të sigurt që doni të fshini këtë pyetje?")) return;
    try {
      await api.delete(`/api/admin/questions/${questionId}`);
      loadQuestions();
    } catch (error) {
      console.error("Failed to delete question:", error);
      alert("Fshirja e pyetjes dështoi");
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.question || !newQuestion.optionA || !newQuestion.optionB || 
        !newQuestion.optionC || !newQuestion.optionD) {
      alert("Plotësoni të gjitha fushat");
      return;
    }
    try {
      const options = [newQuestion.optionA, newQuestion.optionB, newQuestion.optionC, newQuestion.optionD];
      await api.post("/api/admin/questions", {
        question: newQuestion.question,
        options: JSON.stringify(options),
        correct: newQuestion.correct,
        module_id: newQuestion.module_id || null
      });
      setNewQuestion({
        question: "", optionA: "", optionB: "", optionC: "", optionD: "",
        correct: 0, module_id: ""
      });
      loadQuestions();
    } catch (error) {
      console.error("Failed to add question:", error);
      alert("Shtimi i pyetjes dështoi");
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
      module_id: question.module_id || ""
    });
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion.question || !editingQuestion.optionA || !editingQuestion.optionB || 
        !editingQuestion.optionC || !editingQuestion.optionD) {
      alert("Plotësoni të gjitha fushat");
      return;
    }
    try {
      const options = [editingQuestion.optionA, editingQuestion.optionB, editingQuestion.optionC, editingQuestion.optionD];
      await api.put(`/api/admin/questions/${editingQuestion.id}`, {
        question: editingQuestion.question,
        options: JSON.stringify(options),
        correct: editingQuestion.correct,
        module_id: editingQuestion.module_id || null
      });
      setEditingQuestion(null);
      loadQuestions();
    } catch (error) {
      console.error("Failed to update question:", error);
      alert("Përditësimi i pyetjes dështoi");
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkUploadText.trim()) {
      alert("Shkruani pyetjet në formatin e specifikuar");
      return;
    }
    try {
      const lines = bulkUploadText.trim().split('\n');
      const questions = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split('|');
        if (parts.length < 7) {
          alert(`Format i pavlefshëm në rreshtin ${i + 1}. Pritet: pyetja|opcioniA|opcioniB|opcioniC|opcioniD|saktë|moduli_id`);
          return;
        }
        questions.push({
          question: parts[0].trim(),
          optionA: parts[1].trim(),
          optionB: parts[2].trim(),
          optionC: parts[3].trim(),
          optionD: parts[4].trim(),
          correct: parseInt(parts[5].trim()),
          module_id: parts[6].trim() || null
        });
      }
      const response = await api.post("/api/admin/questions/bulk", { questions });
      alert(response.data.message);
      if (response.data.errors && response.data.errors.length > 0) {
        console.log("Errors:", response.data.errors);
      }
      setBulkUploadText("");
      loadQuestions();
    } catch (error) {
      console.error("Failed to bulk upload questions:", error);
      alert("Ngarkimi i pyetjeve dështoi");
    }
  };

  // ==================== NOTE HANDLERS ====================

  const handleAddNote = async () => {
    if (!newNote.title || !newNote.content) {
      alert("Plotësoni të gjitha fushat");
      return;
    }
    try {
      await api.post("/api/admin/notes", newNote);
      setNewNote({ title: "", content: "", type: "text" });
      loadNotes();
    } catch (error) {
      console.error("Failed to add note:", error);
      alert("Shtimi i shënimit dështoi");
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Jeni të sigurt që doni të fshini këtë shënim?")) return;
    try {
      await api.delete(`/api/admin/notes/${noteId}`);
      loadNotes();
    } catch (error) {
      console.error("Failed to delete note:", error);
      alert("Fshirja e shënimit dështoi");
    }
  };

  // Shared styling classes
  const cardClass = isModern
    ? 'bg-white/10 backdrop-blur-lg border border-white/20'
    : 'bg-white';
  const inputClass = `w-full p-2 border rounded ${isModern ? 'bg-white/20 text-white border-white/30' : ''}`;
  const selectClass = `p-2 border rounded ${isModern ? 'bg-white/20 text-white border-white/30' : ''}`;

  return (
    <div className={`min-h-screen p-6 transition-all duration-300 ${
      isModern 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
        : 'bg-gray-100'
    }`}>
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="max-w-7xl mx-auto">
        <h1 className={`text-3xl font-bold mb-6 text-center transition-colors duration-300 ${
          isModern 
            ? 'text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent' 
            : 'text-gray-800'
        }`}>
          Paneli Administrativ
        </h1>

        {/* Tab Navigation */}
        <div className={`rounded-lg shadow-md mb-6 transition-all duration-300 ${cardClass}`}>
          <div className="flex flex-wrap border-b border-gray-200/20">
            {[
              { id: "modules", label: "Menaxhimi i Moduleve" },
              { id: "users", label: "Menaxhimi i Përdoruesve" },
              { id: "questions", label: "Menaxhimi i Pyetjeve" },
              { id: "notes", label: "Menaxhimi i Shënimeve" }
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

        {/* ==================== MODULES TAB ==================== */}
        {activeTab === "modules" && (
          <div className={`rounded-lg shadow-md p-6 ${cardClass}`}>
            <h2 className={`text-2xl font-semibold mb-4 ${isModern ? 'text-white' : ''}`}>
              Menaxhimi i Moduleve
            </h2>

            {/* Add Module Form */}
            <div className={`mb-6 p-4 rounded ${isModern ? 'bg-white/5' : 'bg-gray-50'}`}>
              <h3 className={`text-lg font-semibold mb-3 ${isModern ? 'text-white' : ''}`}>
                Shto Modul të Ri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Module Name"
                  value={newModule.name}
                  onChange={(e) => setNewModule({...newModule, name: e.target.value})}
                  className={inputClass}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Timer (minutes)"
                    value={newModule.timer_minutes}
                    onChange={(e) => setNewModule({...newModule, timer_minutes: parseInt(e.target.value) || 1})}
                    className={inputClass}
                  />
                  <span className={isModern ? 'text-white/70' : 'text-gray-600'}>minuta</span>
                </div>
              </div>
              <button
                onClick={handleAddModule}
                className="mt-3 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Shto Modul
              </button>
            </div>

            {/* Edit Module Form */}
            {editingModule && (
              <div className="mb-6 p-4 rounded border-2 border-yellow-200 bg-yellow-50">
                <h3 className="text-lg font-semibold mb-3">Ndrysho Modulin</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                  placeholder="Emri i Modulit"
                    value={editingModule.name}
                    onChange={(e) => setEditingModule({...editingModule, name: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                    placeholder="Koha (minuta)"
                      value={editingModule.timer_minutes}
                      onChange={(e) => setEditingModule({...editingModule, timer_minutes: parseInt(e.target.value) || 1})}
                      className="w-full p-2 border rounded"
                    />
                    <span className="text-gray-600">minuta</span>
                  </div>
                </div>
                <div className="mt-3 space-x-2">
                  <button onClick={handleUpdateModule} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                    Përditëso Modulin
                  </button>
                  <button onClick={() => setEditingModule(null)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                    Anulo
                  </button>
                </div>
              </div>
            )}

            {/* Modules List */}
            <div className="space-y-3">
              {modules.length === 0 && (
                <p className={isModern ? 'text-white/70' : 'text-gray-500'}>
                  Nuk ka module të krijuara ende. Shtoni modulin tuaj të parë më lart.
                </p>
              )}
              {modules.map(mod => (
                <div key={mod.id} className={`border p-4 rounded ${isModern ? 'border-white/20' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className={`font-medium text-lg ${isModern ? 'text-white' : ''}`}>
                        {mod.name}
                      </p>
                      <p className={`text-sm mt-1 ${isModern ? 'text-white/70' : 'text-gray-600'}`}>
                        Koha: {mod.timer_minutes} min | Pyetje: {mod.question_count || 0}
                      </p>
                    </div>
                    <div className="space-x-2">
                      <button onClick={() => handleEditModule(mod)} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                        Ndrysho
                      </button>
                      <button onClick={() => handleDeleteModule(mod.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                        Fshij
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== USERS TAB ==================== */}
        {activeTab === "users" && (
          <div className={`rounded-lg shadow-md p-6 ${cardClass}`}>
            <h2 className={`text-2xl font-semibold mb-4 ${isModern ? 'text-white' : ''}`}>Menaxhimi i Përdoruesve</h2>

            {/* Add User Form */}
            <div className={`mb-6 p-4 rounded ${isModern ? 'bg-white/5' : 'bg-gray-50'}`}>
              <h3 className={`text-lg font-semibold mb-3 ${isModern ? 'text-white' : ''}`}>Shto Përdorues të Ri</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" placeholder="Emri *" value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})} className={inputClass} />
                <input type="text" placeholder="Emri i përdoruesit" value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})} className={inputClass} />
                <input type="email" placeholder="Email" value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})} className={inputClass} />
                <input type="password" placeholder="Fjalëkalimi *" value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})} className={inputClass} />
                <select value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})} className={selectClass}>
                  <option value="user">Përdorues</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <button onClick={handleAddUser} className="mt-3 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                Shto Përdorues
              </button>
            </div>

            {/* Edit User Modal */}
            {editingUser && (
              <div className="mb-6 p-4 rounded border-2 border-yellow-200 bg-yellow-50">
                <h3 className="text-lg font-semibold mb-3">Ndrysho Përdoruesin</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input type="text" placeholder="Emri" value={editingUser.name}
                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} className="w-full p-2 border rounded" />
                  <input type="text" placeholder="Emri i përdoruesit" value={editingUser.username}
                    onChange={(e) => setEditingUser({...editingUser, username: e.target.value})} className="w-full p-2 border rounded" />
                  <input type="email" placeholder="Email" value={editingUser.email}
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} className="w-full p-2 border rounded" />
                  <input type="password" placeholder="Fjalëkalimi i ri (lëre bosh për të mos ndryshuar)" value={editingUser.password}
                    onChange={(e) => setEditingUser({...editingUser, password: e.target.value})} className="w-full p-2 border rounded" />
                  <select value={editingUser.role}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})} className="p-2 border rounded">
                    <option value="user">Përdorues</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="mt-3 space-x-2">
                  <button onClick={handleUpdateUser} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                    Ruaj Ndryshimet
                  </button>
                  <button onClick={() => setEditingUser(null)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                    Anulo
                  </button>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className={isModern ? 'bg-white/10' : 'bg-gray-50'}>
                    <th className={`px-4 py-2 text-left ${isModern ? 'text-white' : ''}`}>Emri</th>
                    <th className={`px-4 py-2 text-left ${isModern ? 'text-white' : ''}`}>Username</th>
                    <th className={`px-4 py-2 text-left ${isModern ? 'text-white' : ''}`}>Email</th>
                    <th className={`px-4 py-2 text-left ${isModern ? 'text-white' : ''}`}>Roli</th>
                    <th className={`px-4 py-2 text-left ${isModern ? 'text-white' : ''}`}>Veprimet</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className={`border-t ${isModern ? 'border-white/20 text-white' : ''}`}>
                      <td className="px-4 py-2">{user.name}</td>
                      <td className="px-4 py-2 text-sm">{user.username || '-'}</td>
                      <td className="px-4 py-2 text-sm">{user.email || '-'}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-sm ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'Përdorues'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <button onClick={() => handleEditUser(user)} className="bg-yellow-500 text-white px-3 py-1 rounded mr-1 hover:bg-yellow-600">
                          Ndrysho
                        </button>
                        <button onClick={() => handleViewUserHistory(user.id)} className="bg-blue-500 text-white px-3 py-1 rounded mr-1 hover:bg-blue-600">
                          Historiku
                        </button>
                        {user.role !== 'admin' && (
                          <button onClick={() => handleDeleteUser(user.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                            Fshij
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedUser && (
              <div className="mt-6 p-4 bg-gray-50 rounded">
                <h3 className="text-lg font-semibold mb-3">Historia e Kuizeve për {selectedUser.name}</h3>
                {userHistory.length > 0 ? (
                  <div className="space-y-2">
                    {userHistory.map((result, index) => (
                      <div key={result.id || index} className="bg-white p-3 rounded border">
                        <p>Rezultati: {result.score}/{result.total_questions} ({result.percentage}%) | 
                           Statusi: {result.passed ? 'KALUAR' : 'DËSHTUAR'} | 
                           Data: {new Date(result.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Nuk u gjet historik për këtë përdorues.</p>
                )}
                <button onClick={() => setSelectedUser(null)} className="mt-3 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                  Mbylle
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================== QUESTIONS TAB ==================== */}
        {activeTab === "questions" && (
          <div className={`rounded-lg shadow-md p-6 ${cardClass}`}>
            <h2 className={`text-2xl font-semibold mb-4 ${isModern ? 'text-white' : ''}`}>Menaxhimi i Pyetjeve</h2>
            
            {/* Add Question Form */}
            <div className={`mb-6 p-4 rounded ${isModern ? 'bg-white/5' : 'bg-gray-50'}`}>
              <h3 className={`text-lg font-semibold mb-3 ${isModern ? 'text-white' : ''}`}>Shto Pyetje të Re</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <input type="text" placeholder="Pyetja" value={newQuestion.question}
                    onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                    className={inputClass} />
                </div>
                <input type="text" placeholder="Opsioni A" value={newQuestion.optionA}
                  onChange={(e) => setNewQuestion({...newQuestion, optionA: e.target.value})}
                  className={inputClass} />
                <input type="text" placeholder="Opsioni B" value={newQuestion.optionB}
                  onChange={(e) => setNewQuestion({...newQuestion, optionB: e.target.value})}
                  className={inputClass} />
                <input type="text" placeholder="Opsioni C" value={newQuestion.optionC}
                  onChange={(e) => setNewQuestion({...newQuestion, optionC: e.target.value})}
                  className={inputClass} />
                <input type="text" placeholder="Opsioni D" value={newQuestion.optionD}
                  onChange={(e) => setNewQuestion({...newQuestion, optionD: e.target.value})}
                  className={inputClass} />
                <select value={newQuestion.correct}
                  onChange={(e) => setNewQuestion({...newQuestion, correct: parseInt(e.target.value)})}
                  className={selectClass}>
                  <option value={0}>A është e saktë</option>
                  <option value={1}>B është e saktë</option>
                  <option value={2}>C është e saktë</option>
                  <option value={3}>D është e saktë</option>
                </select>
                <select value={newQuestion.module_id}
                  onChange={(e) => setNewQuestion({...newQuestion, module_id: e.target.value})}
                  className={selectClass}>
                    <option value="">-- Zgjidh Modulin --</option>
                  {modules.map(mod => (
                    <option key={mod.id} value={mod.id}>{mod.name}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleAddQuestion} className="mt-3 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                Shto Pyetje
              </button>
            </div>

            {/* Bulk Upload */}
            <div className={`mb-6 p-4 rounded ${isModern ? 'bg-white/5' : 'bg-blue-50'}`}>
              <h3 className={`text-lg font-semibold mb-3 ${isModern ? 'text-white' : ''}`}>Ngarko Pyetje në Masë</h3>
              <p className={`text-sm mb-3 ${isModern ? 'text-white/70' : 'text-gray-600'}`}>
                Formati: pyetja|opsioniA|opsioniB|opsioniC|opsioniD|saktë|moduli_id<br/>
                Shembull: Sa është 2+2?|2|3|4|5|0|1<br/>
                Saktë: 0=A, 1=B, 2=C, 3=D | moduli_id është numri i modulit nga skeda Modules
              </p>
              <textarea placeholder="Shkruani pyetjet në formatin e mësipërm, një për rresht..."
                value={bulkUploadText} onChange={(e) => setBulkUploadText(e.target.value)}
                className={`w-full p-2 border rounded h-32 ${isModern ? 'bg-white/20 text-white border-white/30' : ''}`} />
              <button onClick={handleBulkUpload} className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Ngarko Pyetje
              </button>
            </div>

            {/* Edit Question Modal */}
            {editingQuestion && (
              <div className="mb-6 p-4 rounded border-2 border-yellow-200 bg-yellow-50">
                <h3 className="text-lg font-semibold mb-3">Ndrysho Pyetjen</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <input type="text" placeholder="Pyetja" value={editingQuestion.question}
                      onChange={(e) => setEditingQuestion({...editingQuestion, question: e.target.value})}
                      className="w-full p-2 border rounded" />
                  </div>
                  <input type="text" placeholder="Opsioni A" value={editingQuestion.optionA}
                    onChange={(e) => setEditingQuestion({...editingQuestion, optionA: e.target.value})}
                    className="p-2 border rounded" />
                  <input type="text" placeholder="Opsioni B" value={editingQuestion.optionB}
                    onChange={(e) => setEditingQuestion({...editingQuestion, optionB: e.target.value})}
                    className="p-2 border rounded" />
                  <input type="text" placeholder="Opsioni C" value={editingQuestion.optionC}
                    onChange={(e) => setEditingQuestion({...editingQuestion, optionC: e.target.value})}
                    className="p-2 border rounded" />
                  <input type="text" placeholder="Opsioni D" value={editingQuestion.optionD}
                    onChange={(e) => setEditingQuestion({...editingQuestion, optionD: e.target.value})}
                    className="p-2 border rounded" />
                  <select value={editingQuestion.correct}
                    onChange={(e) => setEditingQuestion({...editingQuestion, correct: parseInt(e.target.value)})}
                    className="p-2 border rounded">
                    <option value={0}>A është e saktë</option>
                    <option value={1}>B është e saktë</option>
                    <option value={2}>C është e saktë</option>
                    <option value={3}>D është e saktë</option>
                  </select>
                  <select value={editingQuestion.module_id}
                    onChange={(e) => setEditingQuestion({...editingQuestion, module_id: e.target.value})}
                    className="p-2 border rounded">
                  <option value="">-- Zgjidh Modulin --</option>
                    {modules.map(mod => (
                      <option key={mod.id} value={mod.id}>{mod.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 space-x-2">
                  <button onClick={handleUpdateQuestion} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                    Përditëso Pyetjen
                  </button>
                  <button onClick={() => setEditingQuestion(null)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                    Anulo
                  </button>
                </div>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-3">
              {questions.map(question => (
                <div key={question.id} className={`border p-4 rounded ${isModern ? 'border-white/20' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className={`font-medium ${isModern ? 'text-white' : ''}`}>{question.question}</p>
                      <p className={`text-sm mt-1 ${isModern ? 'text-white/70' : 'text-gray-600'}`}>
                        Moduli: {question.module_name || 'Asnjë'} | Saktë: {String.fromCharCode(65 + question.correct)}
                      </p>
                      {question.options && (
                        <div className="mt-2 text-sm">
                          {JSON.parse(question.options).map((option, idx) => (
                            <span key={idx} className={`mr-4 ${isModern ? 'text-white/80' : ''}`}>
                              {String.fromCharCode(65 + idx)}: {option}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-x-2">
                      <button onClick={() => handleEditQuestion(question)} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                        Ndrysho
                      </button>
                      <button onClick={() => handleDeleteQuestion(question.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                        Fshij
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== NOTES TAB ==================== */}
        {activeTab === "notes" && (
          <div className={`rounded-lg shadow-md p-6 ${cardClass}`}>
            <h2 className={`text-2xl font-semibold mb-4 ${isModern ? 'text-white' : ''}`}>Menaxhimi i Shënimeve</h2>
            
            <div className={`mb-6 p-4 rounded ${isModern ? 'bg-white/5' : 'bg-gray-50'}`}>
              <h3 className={`text-lg font-semibold mb-3 ${isModern ? 'text-white' : ''}`}>Shto Shënim të Ri</h3>
              <div className="space-y-3">
                <input type="text" placeholder="Titulli i Shënimit" value={newNote.title}
                  onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                  className={inputClass} />
                <textarea placeholder="Përmbajtja e Shënimit" value={newNote.content}
                  onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                  className={`w-full p-2 border rounded h-32 ${isModern ? 'bg-white/20 text-white border-white/30' : ''}`} />
                <select value={newNote.type} onChange={(e) => setNewNote({...newNote, type: e.target.value})}
                  className={selectClass}>
                  <option value="text">Text</option>
                  <option value="pdf">PDF</option>
                </select>
                <button onClick={handleAddNote} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                  Shto Shënim
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {notes.map(note => (
                <div key={note.id} className={`border p-4 rounded ${isModern ? 'border-white/20' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className={`font-medium ${isModern ? 'text-white' : ''}`}>{note.title}</h4>
                      <p className={`text-sm mt-1 ${isModern ? 'text-white/70' : 'text-gray-600'}`}>Tipi: {note.type}</p>
                      <p className={`mt-2 ${isModern ? 'text-white/80' : ''}`}>{note.content.substring(0, 100)}...</p>
                    </div>
                    <button onClick={() => handleDeleteNote(note.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                      Fshij
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

