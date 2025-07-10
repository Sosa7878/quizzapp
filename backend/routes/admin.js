const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Middleware to require admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  next();
};

router.use(authMiddleware, requireAdmin);

// GET all users
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, name, email, role FROM users`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load users' });
  }
});

// POST add a new user
router.post('/users', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password, and role are required' });
  }

  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id`,
      [name, email, hashedPassword, role]
    );
    res.status(201).json({ message: 'User created', id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// DELETE a user by ID
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const userCheck = await pool.query(`SELECT role FROM users WHERE id = $1`, [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (userCheck.rows[0].role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    const result = await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// GET all questions
router.get('/questions', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM questions ORDER BY category, id`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load questions' });
  }
});

// POST add question
router.post('/questions', async (req, res) => {
  const { question, options, correct, category } = req.body;

  if (!question || !options || correct === undefined || !category) {
    return res.status(400).json({ message: 'All fields required' });
  }

  if (!['historical', 'math', 'logical'].includes(category)) {
    return res.status(400).json({ message: 'Invalid category' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO questions (question, options, correct, category) VALUES ($1, $2, $3, $4) RETURNING id`,
      [question, JSON.stringify(options), correct, category]
    );
    res.status(201).json({ message: 'Question added', id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add question' });
  }
});

// PUT update question
router.put('/questions/:id', async (req, res) => {
  const { id } = req.params;
  const { question, options, correct, category } = req.body;

  if (!question || !options || correct === undefined || !category) {
    return res.status(400).json({ message: 'All fields required' });
  }

  if (!['historical', 'math', 'logical'].includes(category)) {
    return res.status(400).json({ message: 'Invalid category' });
  }

  try {
    const result = await pool.query(
      `UPDATE questions SET question = $1, options = $2, correct = $3, category = $4 WHERE id = $5`,
      [question, JSON.stringify(options), correct, category, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json({ message: 'Question updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update question' });
  }
});

// POST bulk upload
router.post('/questions/bulk', async (req, res) => {
  const { questions } = req.body;

  if (!questions || !Array.isArray(questions)) {
    return res.status(400).json({ message: 'Questions array is required' });
  }

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const { question, optionA, optionB, optionC, optionD, correct, category } = q;

    if (!question || !optionA || !optionB || !optionC || !optionD || correct === undefined || !category) {
      errors.push(`Row ${i + 1}: Missing required fields`);
      errorCount++;
      continue;
    }

    if (!['historical', 'math', 'logical'].includes(category)) {
      errors.push(`Row ${i + 1}: Invalid category '${category}'`);
      errorCount++;
      continue;
    }

    if (![0, 1, 2, 3].includes(parseInt(correct))) {
      errors.push(`Row ${i + 1}: Invalid co
