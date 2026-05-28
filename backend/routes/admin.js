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

// ==================== MODULE ROUTES ====================

// GET all modules
router.get("/modules", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, COUNT(q.id)::int AS question_count
      FROM modules m
      LEFT JOIN questions q ON q.module_id = m.id
      GROUP BY m.id
      ORDER BY m.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load modules" });
  }
});

// POST create a new module
router.post("/modules", async (req, res) => {
  const { name, timer_minutes } = req.body;
  if (!name || !timer_minutes) {
    return res.status(400).json({ message: "Name and timer_minutes are required" });
  }
  try {
    const result = await pool.query(
      `INSERT INTO modules (name, timer_minutes) VALUES ($1, $2) RETURNING *`,
      [name, timer_minutes]
    );
    res.status(201).json({ message: "Module created", module: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create module" });
  }
});

// PUT update a module
router.put("/modules/:id", async (req, res) => {
  const { id } = req.params;
  const { name, timer_minutes } = req.body;
  if (!name || !timer_minutes) {
    return res.status(400).json({ message: "Name and timer_minutes are required" });
  }
  try {
    const result = await pool.query(
      `UPDATE modules SET name = $1, timer_minutes = $2 WHERE id = $3 RETURNING *`,
      [name, timer_minutes, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Module not found" });
    }
    res.json({ message: "Module updated", module: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update module" });
  }
});

// DELETE a module
router.delete("/modules/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Unlink questions from this module first
    await pool.query(`UPDATE questions SET module_id = NULL WHERE module_id = $1`, [id]);
    const result = await pool.query(`DELETE FROM modules WHERE id = $1`, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Module not found" });
    }
    res.json({ message: "Module deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete module" });
  }
});

// GET all users (includes username)
router.get("/users", async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, name, username, email, role FROM users ORDER BY id`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load users" });
  }
});

// POST add a new user (with username support)
router.post("/users", async (req, res) => {
  const { name, username, email, password, role } = req.body;
  if (!name || !password || !role) {
    return res.status(400).json({ message: "Name, password, and role are required" });
  }

  if (!["admin", "user"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, username, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [name, username || null, email || null, hashedPassword, role]
    );
    res.status(201).json({ message: "User created", id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create user" });
  }
});

// PUT update a user (change name, username, email, role, or password)
router.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, username, email, role, password } = req.body;

  try {
    // Build dynamic update query
    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (username !== undefined) { fields.push(`username = $${idx++}`); values.push(username); }
    if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
    if (role !== undefined) { fields.push(`role = $${idx++}`); values.push(role); }
    if (password !== undefined && password !== '') {
      const hashed = await bcrypt.hash(password, 10);
      fields.push(`password = $${idx++}`);
      values.push(hashed);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(id);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, username, email, role`;
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User updated", user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update user" });
  }
});

// DELETE a user by ID
router.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const userCheck = await pool.query(`SELECT role FROM users WHERE id = $1`, [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    if (userCheck.rows[0].role === "admin") {
      return res.status(403).json({ message: "Cannot delete admin users" });
    }

    const result = await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user" });
  }
});

// GET all questions (with module info)
router.get("/questions", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT q.*, COALESCE(m.name, '') AS module_name
      FROM questions q
      LEFT JOIN modules m ON m.id = q.module_id
      ORDER BY q.module_id, q.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load questions" });
  }
});

// POST add question (with module_id support)
router.post("/questions", async (req, res) => {
  const { question, options, correct, category, module_id } = req.body;

  if (!question || !options || correct === undefined) {
    return res.status(400).json({ message: "Question, options, and correct are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO questions (question, options, correct, category, module_id) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [question, options, correct, category || 'general', module_id || null]
    );
    res.status(201).json({ message: "Question added", id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add question" });
  }
});

// PUT update question (with module_id support)
router.put("/questions/:id", async (req, res) => {
  const { id } = req.params;
  const { question, options, correct, category, module_id } = req.body;

  if (!question || !options || correct === undefined) {
    return res.status(400).json({ message: "Question, options, and correct are required" });
  }

  try {
    const result = await pool.query(
      `UPDATE questions SET question = $1, options = $2, correct = $3, category = $4, module_id = $5 WHERE id = $6`,
      [question, options, correct, category || 'general', module_id || null, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.json({ message: "Question updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update question" });
  }
});

// POST bulk upload (with module_id support)
router.post("/questions/bulk", async (req, res) => {
  const { questions } = req.body;

  if (!questions || !Array.isArray(questions)) {
    return res.status(400).json({ message: "Questions array is required" });
  }

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const { question, optionA, optionB, optionC, optionD, correct, category, module_id } = q;

    if (!question || !optionA || !optionB || !optionC || !optionD || correct === undefined) {
      errors.push(`Row ${i + 1}: Missing required fields`);
      errorCount++;
      continue;
    }

    if (![0, 1, 2, 3].includes(parseInt(correct))) {
      errors.push(`Row ${i + 1}: Invalid correct answer '${correct}'`);
      errorCount++;
      continue;
    }

    const options = JSON.stringify([optionA, optionB, optionC, optionD]);

    let resolvedModuleId = module_id;
    // If module_id is a name (not a number), look up the ID
    if (module_id && isNaN(parseInt(module_id))) {
      try {
        const modResult = await pool.query('SELECT id FROM modules WHERE LOWER(name) = LOWER($1)', [module_id]);
        if (modResult.rows.length > 0) {
          resolvedModuleId = modResult.rows[0].id;
        } else {
          errors.push(`Row ${i + 1}: Module "${module_id}" not found`);
          errorCount++;
          continue;
        }
      } catch (e) {
        errors.push(`Row ${i + 1}: Error resolving module: ${e.message}`);
        errorCount++;
        continue;
      }
    }

    try {
      await pool.query(
        `INSERT INTO questions (question, options, correct, category, module_id) VALUES ($1, $2, $3, $4, $5)`,
        [question, options, parseInt(correct), category || 'general', resolvedModuleId || null]
      );
      successCount++;
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err.message}`);
      errorCount++;
    }
  }

  res.json({
    message: `Bulk upload completed. ${successCount} added, ${errorCount} errors.`,
    successCount,
    errorCount,
    errors,
  });
});

// DELETE a question
router.delete("/questions/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`DELETE FROM questions WHERE id = $1`, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.json({ message: "Question deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete question" });
  }
});

// GET all notes
router.get("/notes", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM notes ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to load notes" });
  }
});

// POST add note
router.post("/notes", async (req, res) => {
  const { title, content, type } = req.body;

  if (!title || !content || !["text", "pdf"].includes(type)) {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO notes (title, content, type) VALUES ($1, $2, $3) RETURNING id`,
      [title, content, type]
    );
    res.status(201).json({ message: "Note added", id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ message: "Failed to add note" });
  }
});

// DELETE note
router.delete("/notes/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`DELETE FROM notes WHERE id = $1`, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Note not found" });
    }
    res.json({ message: "Note deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete note" });
  }
});

// GET quiz statistics
router.get("/stats", async (req, res) => {
  const stats = {};
  try {
    const users = await pool.query(`SELECT COUNT(*) FROM users`);
    stats.totalUsers = parseInt(users.rows[0].count);

    const questions = await pool.query(`SELECT COUNT(*) FROM questions`);
    stats.totalQuestions = parseInt(questions.rows[0].count);

    const attempts = await pool.query(`SELECT COUNT(*) FROM results`);
    stats.totalAttempts = parseInt(attempts.rows[0].count);

    const categories = await pool.query(
      `SELECT category, COUNT(*) as count FROM questions GROUP BY category`
    );
    stats.questionsByCategory = categories.rows;

    const modules = await pool.query(`SELECT COUNT(*) FROM modules`);
    stats.totalModules = parseInt(modules.rows[0].count);

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Failed to get statistics" });
  }
});

module.exports = router;
