const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// GET all notes (read-only for users)
router.get("/notes", authMiddleware, (req, res) => {
  db.all(`SELECT * FROM notes ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Failed to load notes." });
    }
    res.json(rows);
  });
});

// GET a specific note by ID
router.get("/notes/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  
  db.get(`SELECT * FROM notes WHERE id = ?`, [id], (err, note) => {
    if (err) {
      return res.status(500).json({ message: "Failed to load note." });
    }
    if (!note) {
      return res.status(404).json({ message: "Note not found." });
    }
    res.json(note);
  });
});

module.exports = router;

