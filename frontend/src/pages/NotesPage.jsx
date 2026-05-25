import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../config";

function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load notes:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Duke ngarkuar shënimet...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Shënime Studimi</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notes List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-4">Shënime të Disponueshme</h2>
              {notes.length === 0 ? (
                <p className="text-gray-500">Nuk ka shënime</p>
              ) : (
                <div className="space-y-2">
                  {notes.map(note => (
                    <button
                      key={note.id}
                      onClick={() => setSelectedNote(note)}
                      className={`w-full text-left p-3 rounded border transition-all ${
                        selectedNote?.id === note.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-medium">{note.title}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Tipi: {note.type.toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(note.created_at).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Note Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              {selectedNote ? (
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-semibold">{selectedNote.title}</h2>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      selectedNote.type === 'pdf' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedNote.type.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-500 mb-4">
                    Krijuar më: {new Date(selectedNote.created_at).toLocaleString()}
                  </div>

                  <div className="prose max-w-none">
                    {selectedNote.type === 'pdf' ? (
                      <div className="bg-gray-50 p-4 rounded border">
                        <p className="text-gray-600 mb-2">Përmbajtja PDF:</p>
                        <div className="whitespace-pre-wrap font-mono text-sm">
                          {selectedNote.content}
                        </div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">
                        {selectedNote.content}
                      </div>
                    )}
                  </div>

                  {selectedNote.type === 'pdf' && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-yellow-800 text-sm">
                        📄 Ky është një dokument PDF. Përmbajtja më sipër tregon përmbajtjen tekstuale të PDF.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-xl font-medium mb-2">Zgjidhni një shënim për ta parë</h3>
                  <p>Zgjidhni një shënim nga lista në të majtë për të lexuar përmbajtjen.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center mt-6">
          <button
            onClick={() => window.history.back()}
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
          >
            Kthehu në Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotesPage;

