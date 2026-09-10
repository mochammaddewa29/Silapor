const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryOne, runQuery } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'maintenance-system-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Register new user
exports.register = async (req, res) => {
  try {
    const { username, password, full_name, role } = req.body;

    if (!username || !password || !full_name) {
      return res.status(400).json({ error: 'Username, password, dan nama lengkap wajib diisi.' });
    }
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username minimal 3 karakter.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter.' });
    }

    const existing = queryOne('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(409).json({ error: 'Username sudah digunakan.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userRole = 'user'; // Pendaftaran publik hanya untuk akun pelapor / user biasa

    const { getLocalDateTime } = require('../utils/time');
    const now = getLocalDateTime();
    const result = runQuery(
      'INSERT INTO users (username, password, full_name, role, created_at) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, full_name, userRole, now]
    );

    const user = queryOne('SELECT id, username, full_name, role, created_at FROM users WHERE id = ?', [result.lastInsertRowid]);
    
    // Sinkronkan data user ke Firebase Cloud Firestore
    const { syncUserToFirebase } = require('../services/firebaseService');
    await syncUserToFirebase(user);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// Login
exports.login = (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi.' });
    }

    const user = queryOne('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ error: 'Username atau password salah.' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Username atau password salah.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// Get current user profile
exports.getMe = (req, res) => {
  try {
    const user = queryOne('SELECT id, username, full_name, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }
    res.json(user);
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};
