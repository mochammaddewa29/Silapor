const { db, collection, query, where, getDocs, setDoc, doc, getDoc, updateDoc, orderBy } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');
const { getLocalDateTime } = require('../utils/time');

// Get all users who have chat history or just all regular users (Admin only)
exports.getChatUsers = async (req, res) => {
  try {
    const usersRef = collection(db, 'users');
    const qUsers = query(usersRef, where('role', '==', 'user'));
    const userSnap = await getDocs(qUsers);
    
    let users = [];
    
    // Fetch latest message for each user
    for (const userDoc of userSnap.docs) {
      const u = userDoc.data();
      
      const chatsRef = collection(db, `direct_chats/${u.id}/messages`);
      const qChats = query(chatsRef, orderBy('created_at', 'desc'), require('firebase/firestore').limit(1));
      const chatSnap = await getDocs(qChats);
      
      if (!chatSnap.empty) {
        const latestChat = chatSnap.docs[0].data();
        u.latest_message = latestChat.message;
        u.latest_message_time = latestChat.created_at;
      } else {
        u.latest_message = null;
        u.latest_message_time = null;
      }
      users.push(u);
    }
    
    // Sort by latest_message_time desc, then by full_name asc
    users.sort((a, b) => {
      if (a.latest_message_time && b.latest_message_time) {
        return new Date(b.latest_message_time) - new Date(a.latest_message_time);
      } else if (a.latest_message_time) {
        return -1;
      } else if (b.latest_message_time) {
        return 1;
      } else {
        return a.full_name.localeCompare(b.full_name);
      }
    });

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
    const userRef = doc(db, 'users', String(userId));
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    // If sender is a regular user, ensure they can only send to their own chat room
    if (req.user.role !== 'admin' && String(req.user.id) !== String(userId)) {
      return res.status(403).json({ error: 'Akses ditolak.' });
    }

    // Fetch sender details
    const senderRef = doc(db, 'users', String(req.user.id));
    const senderSnap = await getDoc(senderRef);
    const senderData = senderSnap.exists() ? senderSnap.data() : null;
    const senderName = senderData ? (senderData.full_name || senderData.username) : 'Unknown';
    
    const now = getLocalDateTime();
    const chatId = uuidv4();
    
    const chatMsg = {
      id: chatId,
      user_id: userId,
      sender_id: req.user.id,
      sender_name: senderName,
      role: req.user.role,
      message,
      created_at: now
    };

    const chatDocRef = doc(db, `direct_chats/${userId}/messages`, String(chatId));
    await setDoc(chatDocRef, chatMsg);

    res.status(201).json(chatMsg);
  } catch (err) {
    console.error('sendDirectMessage error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server saat mengirim pesan.' });
  }
};
