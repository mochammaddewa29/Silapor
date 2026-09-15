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

    const user = queryOne('SELECT id, username, full_name, role, photo_url, created_at FROM users WHERE id = ?', [result.lastInsertRowid]);
    
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

// Google Login / Register
exports.googleLogin = async (req, res) => {
  try {
    const { email, displayName, photoURL, uid } = req.body;

    if (!email || !uid) {
      return res.status(400).json({ error: 'Data otentikasi Google tidak lengkap.' });
    }

    // Gunakan email sebagai username
    const username = email.split('@')[0];

    // Cek apakah user sudah ada berdasarkan email atau username
    let user = queryOne('SELECT * FROM users WHERE username = ?', [email]);
    if (!user) {
      user = queryOne('SELECT * FROM users WHERE username = ?', [username]);
    }

    if (!user) {
      // Auto-register
      const hashedPassword = bcrypt.hashSync(uid, 10); // Gunakan uid sebagai dummy password yang kuat
      const { getLocalDateTime } = require('../utils/time');
      const now = getLocalDateTime();
      
      const result = runQuery(
        'INSERT INTO users (username, password, full_name, role, photo_url, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [email, hashedPassword, displayName || username, 'user', photoURL, now]
      );
      user = queryOne('SELECT id, username, full_name, role, photo_url, created_at FROM users WHERE id = ?', [result.lastInsertRowid]);
      
      // Sinkronkan user baru ke Firebase Firestore
      const { syncUserToFirebase } = require('../services/firebaseService');
      await syncUserToFirebase(user);
    } else if (photoURL && user.photo_url !== photoURL) {
      // Update photo URL jika berubah di profil Google
      runQuery('UPDATE users SET photo_url = ? WHERE id = ?', [photoURL, user.id]);
      user.photo_url = photoURL;
      const { syncUserToFirebase } = require('../services/firebaseService');
      await syncUserToFirebase(user);
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error('Google Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server saat login Google.' });
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
    const user = queryOne('SELECT id, username, full_name, role, photo_url, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }
    res.json(user);
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, current_password, new_password, photo_url } = req.body;
    const userId = req.user.id;

    const user = queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }

    let updates = [];
    let params = [];

    if (full_name && full_name.trim() !== '') {
      updates.push('full_name = ?');
      params.push(full_name.trim());
    }

    if (photo_url !== undefined) {
      updates.push('photo_url = ?');
      params.push(photo_url);
    }

    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ error: 'Password saat ini harus diisi untuk mengubah password.' });
      }
      const validPassword = bcrypt.compareSync(current_password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Password saat ini salah.' });
      }
      if (new_password.length < 6) {
        return res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
      }
      const hashedPassword = bcrypt.hashSync(new_password, 10);
      updates.push('password = ?');
      params.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.json({ message: 'Tidak ada data yang diubah.' });
    }

    params.push(userId);
    runQuery(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    const updatedUser = queryOne('SELECT id, username, full_name, role, photo_url, created_at FROM users WHERE id = ?', [userId]);
    
    // Sync to Firebase
    const { syncUserToFirebase } = require('../services/firebaseService');
    await syncUserToFirebase(updatedUser);

    res.json({ message: 'Profil berhasil diperbarui.', user: updatedUser });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server saat memperbarui profil.' });
  }
};
