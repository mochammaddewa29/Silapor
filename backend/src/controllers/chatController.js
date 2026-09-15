const { queryAll, queryOne, runQuery } = require('../config/database');
const { syncDirectChatToFirebase } = require('../services/firebaseService');
const { getLocalDateTime } = require('../utils/time');

// Get all users who have chat history or just all regular users (Admin only)
exports.getChatUsers = async (req, res) => {
  try {
    // Return all users with role = 'user' along with their latest message if any
    const users = queryAll(`
      SELECT 
        u.id, u.username, u.full_name, u.photo_url,
        (SELECT message FROM direct_chats dc WHERE dc.user_id = u.id ORDER BY created_at DESC LIMIT 1) as latest_message,
        (SELECT created_at FROM direct_chats dc WHERE dc.user_id = u.id ORDER BY created_at DESC LIMIT 1) as latest_message_time
      FROM users u
      WHERE u.role != 'admin'
      ORDER BY latest_message_time DESC NULLS LAST, u.full_name ASC
    `);
    
    res.json(users);
  } catch (err) {
    console.error('getChatUsers error:', err);
    res.status(500).json({ error: 'Gagal memuat daftar pengguna chat.' });
  }
};

// Send a direct message
exports.sendDirectMessage = async (req, res) => {
  try {
    const { userId } = req.params; // this is the regular user's ID
    const { message } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
    }

    // Verify user exists
    const user = queryOne('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    // If sender is a regular user, ensure they can only send to their own chat room
    if (req.user.role !== 'admin' && String(req.user.id) !== String(userId)) {
      return res.status(403).json({ error: 'Akses ditolak.' });
    }

    // Fetch sender details
    const sender = queryOne('SELECT full_name, username FROM users WHERE id = ?', [req.user.id]);
    const senderName = sender ? (sender.full_name || sender.username) : 'Unknown';
    const now = getLocalDateTime();
    
    const result = runQuery(
      'INSERT INTO direct_chats (user_id, sender_id, sender_name, role, message, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, req.user.id, senderName, req.user.role, message, now]
    );

    const chatMsg = queryOne('SELECT * FROM direct_chats WHERE id = ?', [result.lastInsertRowid]);
    
    // Sync to Firebase
    await syncDirectChatToFirebase(chatMsg, userId);

    res.status(201).json(chatMsg);
  } catch (err) {
    console.error('sendDirectMessage error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server saat mengirim pesan.' });
  }
};
