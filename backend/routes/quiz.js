const express = require('express');
const pool = require('../db'); // PostgreSQL pool
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET quiz questions with random selection based on categories
router.get('/quiz', authMiddleware, async (req, res) => {
  try {
    const getQuestionsByCategory = async (category, limit) => {
      const result = await pool.query(
        'SELECT * FROM questions WHERE category = $1 ORDER BY RANDOM() LIMIT $2',
        [category, limit]
      );
      return result.rows;
    };

    const [historical, math, logical] = await Promise.all([
      getQuestionsByCategory('historical', 30),
      getQuestionsByCategory('math', 30),
      getQuestionsByCategory('logical', 40),
    ]);

    const allQuestions = [...historical, ...math, ...logical];

    // Shuffle
    for (let i = allQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }

    const formatted = allQuestions.map((q) => ({
      ...q,
      options: JSON.parse(q.options),
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error selecting questions:', err);
    res.status(500).json({ message: 'Failed to load questions.' });
  }
});

// POST submit quiz
router.post('/quiz/submit', authMiddleware, async (req, res) => {
  const { answers, questions, timeTaken } = req.body;
  const userId = req.user.id;

  if (!answers || !questions) {
    return res.status(400).json({ message: 'Missing answers or questions data.' });
  }

  let score = 0;
  const totalQuestions = questions.length;

  for (let i = 0; i < totalQuestions; i++) {
    if (answers[i] !== -1 && parseInt(questions[i].correct) === parseInt(answers[i])) {
      score++;
    }
  }

  const percentage = Math.round((score / totalQuestions) * 100);
  const passed = percentage >= 70;
  const timeUsed = timeTaken || 0;

  try {
    const result = await pool.query(
      `INSERT INTO results (user_id, answers, score, total_questions, percentage, passed, time_taken, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id`,
      [userId, JSON.stringify(answers), score, totalQuestions, percentage, passed, timeUsed]
    );

    res.json({
      resultId: result.rows[0].id,
      score,
      totalQuestions,
      percentage,
      passed,
      timeTaken: timeUsed,
      message: passed
        ? 'Urime! Ju kaluat testin!'
        : 'Nuk arritët të kaloni testin këtë herë. Vazhdoni të studijoni!',
      answers,
      questions,
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Failed to save results.' });
  }
});

// GET latest quiz result
router.get('/results', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT * FROM results WHERE user_id = $1 ORDER BY id DESC LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No results found.' });
    }

    const r = result.rows[0];
    res.json({
      resultId: r.id,
      score: r.score,
      totalQuestions: r.total_questions,
      percentage: r.percentage,
      passed: r.passed,
      timeTaken: r.time_taken,
      answers: JSON.parse(r.answers),
      createdAt: r.created_at,
      message: r.passed
        ? 'Urime! Ju kaluat testin!'
        : 'Nuk arritët të kaloni testin këtë herë. Vazhdoni të studijoni!',
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Failed to load results.' });
  }
});

// GET all results history for current user
router.get('/results/history', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT id, score, total_questions, percentage, passed, time_taken, created_at 
       FROM results WHERE user_id = $1 ORDER BY id DESC`,
      [userId]
    );

    const formatted = result.rows.map((r) => ({
      ...r,
      message: r.passed ? 'PASSED' : 'FAILED',
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Failed to load results history.' });
  }
});

// GET specific result details
router.get('/results/:resultId', authMiddleware, async (req, res) => {
  const { resultId } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT * FROM results WHERE id = $1 AND user_id = $2`,
      [resultId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Result not found.' });
    }

    const r = result.rows[0];

    res.json({
      resultId: r.id,
      score: r.score,
      totalQuestions: r.total_questions,
      percentage: r.percentage,
      passed: r.passed,
      timeTaken: r.time_taken,
      answers: JSON.parse(r.answers),
      createdAt: r.created_at,
      message: r.passed
        ? 'Urime! Ju kaluat testin!'
        : 'Nuk arritët të kaloni testin këtë herë. Vazhdoni të studijoni!',
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Failed to load result details.' });
  }
});

// GET all results for a user (admin only)
router.get('/results/user/:userId', authMiddleware, async (req, res) => {
  const { userId } = req.params;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  try {
    const result = await pool.query(
      `SELECT r.*, u.username FROM results r
       JOIN users u ON r.user_id = u.id
       WHERE r.user_id = $1 ORDER BY r.id DESC`,
      [userId]
    );

    const formatted = result.rows.map((r) => ({
      ...r,
      passed: r.passed,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Failed to load user results.' });
  }
});

module.exports = router;
