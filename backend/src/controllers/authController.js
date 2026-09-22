const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db, collection, query, where, getDocs, setDoc, doc, getDoc, updateDoc, deleteDoc } = require('../config/firebase');
const { getLocalDateTime } = require('../utils/time');
const { uploadToBlob } = require('../services/blobService');
const { sendOTPEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'maintenance-system-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Send OTP for registration
exports.sendOTP = async (req, res) => {
  try {
    const { email, full_name, password } = req.body;

    if (!email || !full_name || !password) {
      return res.status(400).json({ error: 'Email, nama lengkap, dan password wajib diisi.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Format email tidak valid.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter.' });
    }
    if (full_name.trim().length < 2) {
      return res.status(400).json({ error: 'Nama lengkap minimal 2 karakter.' });
    }

    // Cek apakah email sudah terdaftar
    const usersRef = collection(db, 'users');
    const qEmail = query(usersRef, where('username', '==', email));
    const snapEmail = await getDocs(qEmail);
    if (!snapEmail.empty) {
      return res.status(409).json({ error: 'Email sudah terdaftar. Silakan login.' });
    }

    // Generate OTP 6 digit
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 menit

    // Simpan OTP ke Firestore (koleksi otps)
    const otpId = `otp_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    await setDoc(doc(db, 'otps', otpId), {
      email,
      full_name: full_name.trim(),
      password, // plain, akan di-hash setelah OTP diverifikasi
      otp,
      expires_at: expiresAt.toISOString(),
      created_at: getLocalDateTime(),
    });

    // Kirim OTP ke email
    await sendOTPEmail(email, otp, full_name.trim());

    res.json({ message: 'OTP berhasil dikirim ke email Anda. Berlaku 5 menit.' });
  } catch (err) {
    console.error('Send OTP error:', err);
    // Brevo API error (invalid API key, sender not verified, dll)
    if (err.response?.status === 401 || err.response?.status === 403) {
      return res.status(500).json({ error: 'Konfigurasi email server bermasalah. Hubungi administrator.' });
    }
    res.status(500).json({ error: 'Gagal mengirim OTP. Coba lagi.' });
  }
};

// Verify OTP and create account
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email dan OTP wajib diisi.' });
    }

    const otpId = `otp_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const otpRef = doc(db, 'otps', otpId);
    const otpSnap = await getDoc(otpRef);

    if (!otpSnap.exists()) {
      return res.status(404).json({ error: 'Kode OTP tidak ditemukan. Silakan minta OTP baru.' });
    }

    const otpData = otpSnap.data();

    // Cek expired
    if (new Date() > new Date(otpData.expires_at)) {
      await deleteDoc(otpRef);
      return res.status(410).json({ error: 'Kode OTP sudah kedaluwarsa. Silakan minta OTP baru.' });
    }

    // Cek OTP cocok
    if (otpData.otp !== otp.trim()) {
      return res.status(401).json({ error: 'Kode OTP salah. Periksa kembali email Anda.' });
    }

    // Cek sekali lagi apakah email sudah terdaftar (race condition)
    const usersRef = collection(db, 'users');
    const qEmail = query(usersRef, where('username', '==', email));
    const snapEmail = await getDocs(qEmail);
    if (!snapEmail.empty) {
      await deleteDoc(otpRef);
      return res.status(409).json({ error: 'Email sudah terdaftar. Silakan login.' });
    }

    // Buat akun user
    const hashedPassword = bcrypt.hashSync(otpData.password, 10);
    const now = getLocalDateTime();
    const userId = uuidv4();

    const newUser = {
      id: userId,
      username: email,
      password: hashedPassword,
      full_name: otpData.full_name,
      role: 'user',
      photo_url: null,
      created_at: now,
    };

    await setDoc(doc(db, 'users', String(userId)), newUser);

    // Hapus OTP setelah berhasil
    await deleteDoc(otpRef);

    // Generate token dan auto-login
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

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

// Upload user profile photo / avatar
exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!req.file) {
      return res.status(400).json({ error: 'File foto profil tidak ditemukan.' });
    }

    let photoUrl = null;
    try {
      photoUrl = await uploadToBlob(req.file.path, 'user_avatars');
    } catch (e) {
      console.warn('Vercel Blob avatar upload notice:', e);
    }

    if (!photoUrl) {
      photoUrl = `/uploads/${req.file.filename}`;
    }

    const userRef = doc(db, 'users', String(userId));
    await updateDoc(userRef, { photo_url: photoUrl });

    const updatedSnap = await getDoc(userRef);
    const updatedUser = updatedSnap.data();
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({
      message: 'Foto profil berhasil diperbarui.',
      photo_url: photoUrl,
      user: userWithoutPassword
    });
  } catch (err) {
    console.error('Upload avatar error:', err);
    res.status(500).json({ error: 'Gagal mengunggah foto profil.' });
  }
};
