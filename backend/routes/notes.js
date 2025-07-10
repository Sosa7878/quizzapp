const express = require('express');
const pool = require('../db'); // Your PostgreSQL pool
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET all notes (read-only for users)
router.get('/notes', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notes ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notes:', err.message);
    res.status(500).json({ message: 'Failed to load notes.' });
  }
});

// GET a specific note by ID
router.get('/notes/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM notes WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching note:', err.message);
    res.status(500).json({ message: 'Failed to load note.' });
  }
});

module.exports = router;
