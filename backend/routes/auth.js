const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// POST /login - supports login with email OR username
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email/username and password are required' });
  }

  try {
    // Try to find user by email first, then by username
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Kredencialet e gabuara' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Kredencialet e gabuara' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      'quiz_app_secret_key_2024',
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Signup is disabled - only admin can create users via the admin panel
router.post('/signup', async (req, res) => {
  res.status(403).json({ message: 'Regjistrimi është i çaktivizuar. Kontaktoni adminin.' });
});

module.exports = router;
