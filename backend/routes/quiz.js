const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// GET quiz questions with random selection based on categories
router.get("/quiz", authMiddleware, (req, res) => {
  // Get questions by category
  const getQuestionsByCategory = (category, limit) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM questions WHERE category = ? ORDER BY RANDOM() LIMIT ?`,
        [category, limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  };

  Promise.all([
    getQuestionsByCategory('historical', 30), // 30% historical/grammatical
    getQuestionsByCategory('math', 30),       // 30% math
    getQuestionsByCategory('logical', 40)     // 40% logical
  ])
  .then(([historical, math, logical]) => {
    // Combine all questions and shuffle them
    const allQuestions = [...historical, ...math, ...logical];
    
    // Shuffle the combined array
    for (let i = allQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }

    // Format questions (parse options JSON)
    const formatted = allQuestions.map((q) => ({
      ...q,
      options: JSON.parse(q.options),
    }));

    res.json(formatted);
  })
  .catch(err => {
    console.error("Error selecting questions:", err);
    res.status(500).json({ message: "Failed to load questions." });
  });
});

// POST submit quiz
router.post("/quiz/submit", authMiddleware, (req, res) => {
  const { answers, questions, timeTaken } = req.body;
  const userId = req.user.id;

  if (!answers || !questions) {
    return res.status(400).json({ message: "Missing answers or questions data." });
  }

  let score = 0;
  const totalQuestions = questions.length;
  
  // Calculate score - 1 point per correct answer
  for (let i = 0; i < totalQuestions; i++) {
    if (answers[i] !== -1 && parseInt(questions[i].correct) === parseInt(answers[i])) {
      score++;
    }
  }

  const percentage = Math.round((score / totalQuestions) * 100);
  const passed = percentage >= 70; // 70% threshold to pass
  const timeUsed = timeTaken || 0;

  // Save result to database
  db.run(
    `INSERT INTO results (user_id, answers, score, total_questions, percentage, passed, time_taken, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [userId, JSON.stringify(answers), score, totalQuestions, percentage, passed ? 1 : 0, timeUsed],
    function (err) {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Failed to save results." });
      }

      // Return detailed results
      res.json({ 
        resultId: this.lastID,
        score,
        totalQuestions,
        percentage,
        passed,
        timeTaken: timeUsed,
        message: passed ? "Urime! Ju kaluat testin!" : "Nuk arritët të kaloni testin këtë herë. Vazhdoni të studijoni!",
        answers,
        questions
      });
    }
  );
});

// GET latest quiz result
router.get("/results", authMiddleware, (req, res) => {
  const userId = req.user.id;

  db.get(
    `SELECT * FROM results WHERE user_id = ? ORDER BY id DESC LIMIT 1`, 
    [userId], 
    (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Failed to load results." });
      }

      if (!result) {
        return res.status(404).json({ message: "No results found." });
      }

      // Parse the stored answers
      const parsedAnswers = JSON.parse(result.answers);
      
      res.json({
        resultId: result.id,
        score: result.score,
        totalQuestions: result.total_questions,
        percentage: result.percentage,
        passed: result.passed === 1,
        timeTaken: result.time_taken,
        answers: parsedAnswers,
        createdAt: result.created_at,
        message: result.passed === 1 ? "Urime! Ju kaluat testin!" : "Nuk arritët të kaloni testin këtë herë. Vazhdoni të studijoni!"
      });
    }
  );
});

// GET all results history for current user
router.get("/results/history", authMiddleware, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT id, score, total_questions, percentage, passed, time_taken, created_at 
     FROM results WHERE user_id = ? ORDER BY id DESC`,
    [userId],
    (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Failed to load results history." });
      }

      const formattedResults = results.map(result => ({
        ...result,
        passed: result.passed === 1,
        message: result.passed === 1 ? "PASSED" : "FAILED"
      }));

      res.json(formattedResults);
    }
  );
});

// GET specific result details
router.get("/results/:resultId", authMiddleware, (req, res) => {
  const { resultId } = req.params;
  const userId = req.user.id;

  db.get(
    `SELECT * FROM results WHERE id = ? AND user_id = ?`, 
    [resultId, userId], 
    (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Failed to load result details." });
      }

      if (!result) {
        return res.status(404).json({ message: "Result not found." });
      }

      const parsedAnswers = JSON.parse(result.answers);
      
      res.json({
        resultId: result.id,
        score: result.score,
        totalQuestions: result.total_questions,
        percentage: result.percentage,
        passed: result.passed === 1,
        timeTaken: result.time_taken,
        answers: parsedAnswers,
        createdAt: result.created_at,
        message: result.passed === 1 ? "Urime! Ju kaluat testin!" : "Nuk arritët të kaloni testin këtë herë. Vazhdoni të studijoni!"
      });
    }
  );
});

// GET all results for a user (for admin to view user history)
router.get("/results/user/:userId", authMiddleware, (req, res) => {
  const { userId } = req.params;
  
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }

  db.all(
    `SELECT r.*, u.name, u.email FROM results r 
     JOIN users u ON r.user_id = u.id 
     WHERE r.user_id = ? ORDER BY r.id DESC`,
    [userId],
    (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Failed to load user results." });
      }

      const formattedResults = results.map(result => ({
        ...result,
        passed: result.passed === 1
      }));

      res.json(formattedResults);
    }
  );
});

module.exports = router;

