// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, 'quiz_app_secret_key_2024', { expiresIn: '1h' });
    res.json({ token });
  });
});

router.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Name, email, and password required" });
  const userRole = role || "user";
  if (!["admin", "user"].includes(userRole)) return res.status(400).json({ message: "Invalid role" });
  const hashedPassword = await bcrypt.hash(password, 10);
  db.run(
    `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
    [name, email, hashedPassword, userRole],
    function (err) {
      if (err) return res.status(500).json({ message: 'Failed to create user' });
      res.status(201).json({ message: 'User created', id: this.lastID });
    }
  );
});

module.exports = router;