const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db, collection, query, where, getDocs, setDoc, doc, getDoc, updateDoc } = require('../config/firebase');
const { getLocalDateTime } = require('../utils/time');

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

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return res.status(409).json({ error: 'Username sudah digunakan.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userRole = 'user'; // Pendaftaran publik hanya untuk akun pelapor / user biasa
    const now = getLocalDateTime();
    const userId = uuidv4();

    const newUser = {
      id: userId,
      username,
      password: hashedPassword,
      full_name,
      role: userRole,
      photo_url: null,
      created_at: now
    };

    await setDoc(doc(db, 'users', String(userId)), newUser);

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ token, user: userWithoutPassword });
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

    const username = email.split('@')[0];
    const usersRef = collection(db, 'users');
    
    let user = null;
    const qEmail = query(usersRef, where('username', '==', email));
    const snapEmail = await getDocs(qEmail);
    if (!snapEmail.empty) {
      user = snapEmail.docs[0].data();
    } else {
      const qUsername = query(usersRef, where('username', '==', username));
      const snapUsername = await getDocs(qUsername);
      if (!snapUsername.empty) {
        user = snapUsername.docs[0].data();
      }
    }

    if (!user) {
      // Auto-register
      const hashedPassword = bcrypt.hashSync(uid, 10); 
      const now = getLocalDateTime();
      const userId = uuidv4();
      
      user = {
        id: userId,
        username: email,
        password: hashedPassword,
        full_name: displayName || username,
        role: 'user',
        photo_url: photoURL || null,
        created_at: now
      };
      
      await setDoc(doc(db, 'users', String(userId)), user);
    } else if (photoURL && user.photo_url !== photoURL) {
      user.photo_url = photoURL;
      await updateDoc(doc(db, 'users', String(user.id)), { photo_url: photoURL });
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
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi.' });
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(401).json({ error: 'Username atau password salah.' });
    }

    const user = querySnapshot.docs[0].data();
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
exports.getMe = async (req, res) => {
  try {
    const userRef = doc(db, 'users', String(req.user.id));
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }

    const user = userSnap.data();
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
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

    const userRef = doc(db, 'users', String(userId));
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }

    const user = userSnap.data();
    let updates = {};

    if (full_name && full_name.trim() !== '') {
      updates.full_name = full_name.trim();
    }

    if (photo_url !== undefined) {
      updates.photo_url = photo_url;
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
      updates.password = bcrypt.hashSync(new_password, 10);
    }

    if (Object.keys(updates).length === 0) {
      return res.json({ message: 'Tidak ada data yang diubah.' });
    }

    await updateDoc(userRef, updates);
    const updatedSnap = await getDoc(userRef);
    const updatedUser = updatedSnap.data();

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json({ message: 'Profil berhasil diperbarui.', user: userWithoutPassword });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server saat memperbarui profil.' });
  }
};
