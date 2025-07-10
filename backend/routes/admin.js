const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Middleware to require admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  next();
};

// Apply authMiddleware and requireAdmin to all routes
router.use(authMiddleware, requireAdmin);

// GET all users
router.get('/users', (req, res) => {
  db.all(`SELECT id, name, email, role FROM users`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to load users' });
    }
    res.json(rows);
  });
});

// POST add a new user
router.post('/users', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password, and role are required' });
  }
  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role: must be "admin" or "user"' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
      [name, email, hashedPassword, role],
      function (err) {
        if (err) {
          return res.status(500).json({ message: 'Failed to create user' });
        }
        res.status(201).json({ message: 'User created', id: this.lastID });
      }
    );
  } catch (err) {
    res.status(500).json({ message: 'Error hashing password' });
  }
});

// DELETE a user by ID
router.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  
  // Prevent deletion of admin users
  db.get(`SELECT role FROM users WHERE id = ?`, [id], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to check user role' });
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    db.run(`DELETE FROM users WHERE id = ?`, [id], function (err) {
      if (err) {
        return res.status(500).json({ message: 'Failed to delete user' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ message: 'User deleted successfully' });
    });
  });
});

// GET all questions with categories
router.get('/questions', (req, res) => {
  db.all(`SELECT * FROM questions ORDER BY category, id`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to load questions' });
    }
    res.json(rows);
  });
});

// POST add a new question
router.post('/questions', (req, res) => {
  const { question, options, correct, category } = req.body;
  
  if (!question || !options || correct === undefined || !category) {
    return res.status(400).json({ message: 'Question, options, correct answer, and category are required' });
  }

  if (!['historical', 'math', 'logical'].includes(category)) {
    return res.status(400).json({ message: 'Invalid category' });
  }

  db.run(
    `INSERT INTO questions (question, options, correct, category) VALUES (?, ?, ?, ?)`,
    [question, options, correct, category],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'Failed to add question' });
      }
      res.status(201).json({ message: 'Question added', id: this.lastID });
    }
  );
});

// PUT update an existing question
router.put('/questions/:id', (req, res) => {
  const { id } = req.params;
  const { question, options, correct, category } = req.body;
  
  if (!question || !options || correct === undefined || !category) {
    return res.status(400).json({ message: 'Question, options, correct answer, and category are required' });
  }

  if (!['historical', 'math', 'logical'].includes(category)) {
    return res.status(400).json({ message: 'Invalid category' });
  }

  db.run(
    `UPDATE questions SET question = ?, options = ?, correct = ?, category = ? WHERE id = ?`,
    [question, options, correct, category, id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'Failed to update question' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Question not found' });
      }
      res.json({ message: 'Question updated successfully' });
    }
  );
});

// POST bulk upload questions
router.post('/questions/bulk', (req, res) => {
  const { questions } = req.body;
  
  if (!questions || !Array.isArray(questions)) {
    return res.status(400).json({ message: 'Questions array is required' });
  }

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  const processQuestion = (index) => {
    if (index >= questions.length) {
      return res.json({
        message: `Bulk upload completed. ${successCount} questions added, ${errorCount} errors.`,
        successCount,
        errorCount,
        errors
      });
    }

    const q = questions[index];
    const { question, optionA, optionB, optionC, optionD, correct, category } = q;

    // Validate question
    if (!question || !optionA || !optionB || !optionC || !optionD || correct === undefined || !category) {
      errors.push(`Row ${index + 1}: Missing required fields`);
      errorCount++;
      return processQuestion(index + 1);
    }

    if (!['historical', 'math', 'logical'].includes(category)) {
      errors.push(`Row ${index + 1}: Invalid category '${category}'`);
      errorCount++;
      return processQuestion(index + 1);
    }

    if (![0, 1, 2, 3].includes(parseInt(correct))) {
      errors.push(`Row ${index + 1}: Invalid correct answer '${correct}' (must be 0, 1, 2, or 3)`);
      errorCount++;
      return processQuestion(index + 1);
    }

    const options = [optionA, optionB, optionC, optionD];

    db.run(
      `INSERT INTO questions (question, options, correct, category) VALUES (?, ?, ?, ?)`,
      [question, JSON.stringify(options), parseInt(correct), category],
      function (err) {
        if (err) {
          errors.push(`Row ${index + 1}: Database error - ${err.message}`);
          errorCount++;
        } else {
          successCount++;
        }
        processQuestion(index + 1);
      }
    );
  };

  processQuestion(0);
});

// DELETE a question by ID
router.delete('/questions/:id', (req, res) => {
  const { id } = req.params;
  
  db.run(`DELETE FROM questions WHERE id = ?`, [id], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Failed to delete question' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json({ message: 'Question deleted successfully' });
  });
});

// GET all notes
router.get('/notes', (req, res) => {
  db.all(`SELECT * FROM notes ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to load notes' });
    }
    res.json(rows);
  });
});

// POST add a new note
router.post('/notes', (req, res) => {
  const { title, content, type } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  if (!['text', 'pdf'].includes(type)) {
    return res.status(400).json({ message: 'Invalid note type' });
  }

  db.run(
    `INSERT INTO notes (title, content, type) VALUES (?, ?, ?)`,
    [title, content, type || 'text'],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'Failed to add note' });
      }
      res.status(201).json({ message: 'Note added', id: this.lastID });
    }
  );
});

// DELETE a note by ID
router.delete('/notes/:id', (req, res) => {
  const { id } = req.params;
  
  db.run(`DELETE FROM notes WHERE id = ?`, [id], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Failed to delete note' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json({ message: 'Note deleted successfully' });
  });
});

// GET quiz statistics
router.get('/stats', (req, res) => {
  const stats = {};
  
  // Get total users
  db.get(`SELECT COUNT(*) as count FROM users`, [], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to get statistics' });
    }
    stats.totalUsers = result.count;
    
    // Get total questions
    db.get(`SELECT COUNT(*) as count FROM questions`, [], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to get statistics' });
      }
      stats.totalQuestions = result.count;
      
      // Get total quiz attempts
      db.get(`SELECT COUNT(*) as count FROM results`, [], (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Failed to get statistics' });
        }
        stats.totalAttempts = result.count;
        
        // Get questions by category
        db.all(`SELECT category, COUNT(*) as count FROM questions GROUP BY category`, [], (err, rows) => {
          if (err) {
            return res.status(500).json({ message: 'Failed to get statistics' });
          }
          stats.questionsByCategory = rows;
          
          res.json(stats);
        });
      });
    });
  });
});

module.exports = router;

