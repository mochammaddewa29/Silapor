const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db, collection, query, where, getDocs, setDoc, doc, getDoc, updateDoc, deleteDoc, orderBy } = require('../config/firebase');
const { uploadToBlob, deleteFromBlob } = require('../services/blobService');
const ExcelJS = require('exceljs');

const JWT_SECRET = process.env.JWT_SECRET || 'maintenance-system-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const { getLocalDateTime } = require('../utils/time');

// Helper to generate random ticket number
const generateTicketNumber = () => {
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TKT-${randomStr}`;
};

// Log activity helper
const createLog = async (reportId, userId, userName, role, action, now) => {
  const logId = uuidv4();
  const log = {
    id: logId,
    report_id: reportId,
    user_id: userId,
    user_name: userName,
    role,
    action,
    created_at: now
  };
  await setDoc(doc(db, `reports/${reportId}/logs`, logId), log);
  return log;
};

// Direct Report (creates user on the fly, creates report, returns JWT + report)
exports.directReport = async (req, res) => {
  try {
    const { 
      reporter_name, division, location, category, item_name, description, priority, username, password 
    } = req.body;

    if (!reporter_name || !location || !item_name || !description) {
      return res.status(400).json({ error: 'Nama pelapor, lokasi/ruangan, nama barang, dan deskripsi kerusakan wajib diisi.' });
    }

    const reportCategory = category || 'Elektronik';
    const validPriorities = ['Rendah', 'Sedang', 'Tinggi'];
    const reportPriority = validPriorities.includes(priority) ? priority : 'Sedang';

    let userHandle = username ? username.trim().toLowerCase() : '';
    if (!userHandle) {
      const baseHandle = reporter_name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      userHandle = `${baseHandle || 'pelapor'}_${randomSuffix}`;
    }

    const usersRef = collection(db, 'users');
    const qUser = query(usersRef, where('username', '==', userHandle));
    const userSnap = await getDocs(qUser);
    
    let user;
    const now = getLocalDateTime();

    if (userSnap.empty) {
      const rawPassword = password && password.length >= 6 ? password : 'user123';
      const hashedPassword = bcrypt.hashSync(rawPassword, 10);
      const userId = uuidv4();
      
      user = {
        id: userId,
        username: userHandle,
        password: hashedPassword,
        full_name: reporter_name,
        role: 'user',
        photo_url: null,
        created_at: now
      };
      await setDoc(doc(db, 'users', userId), user);
    } else {
      user = userSnap.docs[0].data();
    }

    let photo_url = null;
    if (req.file) {
      const blobUrl = await uploadToBlob(req.file.path, 'maintenance_reports');
      photo_url = blobUrl || `/uploads/${req.file.filename}`;
    }

    const ticketNumber = generateTicketNumber();
    const reportId = uuidv4();
    
    const report = {
      id: reportId,
      ticket_number: ticketNumber,
      user_id: user.id,
      reporter_name,
      division: division || 'Umum',
      location,
      category: reportCategory,
      item_name,
      description,
      photo_url,
      priority: reportPriority,
      status: 'Menunggu',
      technician: null,
      repair_notes: null,
      created_at: now,
      updated_at: now
    };

    await setDoc(doc(db, 'reports', reportId), report);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({
      token,
      user: userWithoutPassword,
      report,
      message: 'Pengaduan berhasil dikirim dan akun Anda aktif!'
    });
  } catch (err) {
    console.error('Direct report error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server saat memproses aduan.' });
  }
};

// Add comment to a report
exports.addComment = async (req, res) => {
  try {
    const reportId = req.params.id;
    const { message } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
    }

    const reportRef = doc(db, 'reports', String(reportId));
    const reportSnap = await getDoc(reportRef);
    if (!reportSnap.exists()) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
    }

    const userRef = doc(db, 'users', String(req.user.id));
    const userSnap = await getDoc(userRef);
    const user = userSnap.exists() ? userSnap.data() : null;
    const senderName = user ? (user.full_name || user.username) : 'Unknown';

    const now = getLocalDateTime();
    const commentId = uuidv4();
    
    const comment = {
      id: commentId,
      report_id: reportId,
      user_id: req.user.id,
      sender_name: senderName,
      role: req.user.role,
      message,
      created_at: now
    };

    await setDoc(doc(db, `reports/${reportId}/comments`, commentId), comment);
    res.status(201).json(comment);
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server saat menambah komentar.' });
  }
};

// Get comments for a report
exports.getComments = async (req, res) => {
  try {
    const reportId = req.params.id;
    const commentsRef = collection(db, `reports/${reportId}/comments`);
    // orderBy created_at asc
    const q = query(commentsRef, orderBy('created_at', 'asc'));
    const snap = await getDocs(q);
    
    const comments = snap.docs.map(d => d.data());
    res.json(comments);
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server saat mengambil komentar.' });
  }
};

// Public Comments
exports.getPublicComments = async (req, res) => {
  try {
    const ticketId = req.params.ticketId; // this is the report document ID for public, since frontend passes report.id
    const reportSnap = await getDoc(doc(db, 'reports', ticketId));
    if (!reportSnap.exists()) return res.status(404).json({ error: 'Tiket tidak ditemukan' });

    const commentsRef = collection(db, `reports/${ticketId}/comments`);
    const q = query(commentsRef, orderBy('created_at', 'asc'));
    const snap = await getDocs(q);
    
    const comments = snap.docs.map(d => d.data());
    res.json(comments);
  } catch (err) {
    console.error('Get public comments error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.addPublicComment = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;
    const { message } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
    }

    const reportSnap = await getDoc(doc(db, 'reports', ticketId));
    if (!reportSnap.exists()) return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
    
    const report = reportSnap.data();
    const now = getLocalDateTime();
    const commentId = uuidv4();
    
    const comment = {
      id: commentId,
      report_id: ticketId,
      user_id: report.user_id,
      sender_name: report.reporter_name + " (Pelapor)",
      role: "user",
      message,
      created_at: now
    };

    await setDoc(doc(db, `reports/${ticketId}/comments`, commentId), comment);
    res.status(201).json(comment);
  } catch (err) {
    console.error('Add public comment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create a new report (authenticated)
exports.createReport = async (req, res) => {
  try {
    const { reporter_name, division, location, category, item_name, description, priority } = req.body;

    if (!reporter_name || !location || !category || !item_name || !description) {
      return res.status(400).json({ error: 'Semua field wajib diisi (nama, lokasi, kategori, nama barang, deskripsi).' });
    }

    const validCategories = ['Elektronik', 'Infrastruktur', 'Furniture', 'Jaringan', 'Lainnya'];
    const isCategoryValid = validCategories.includes(category) || 
                            category.startsWith('Lainnya') || 
                            (typeof category === 'string' && category.trim().length > 0);
    if (!isCategoryValid) {
      return res.status(400).json({ error: 'Kategori tidak valid.' });
    }

    const validPriorities = ['Rendah', 'Sedang', 'Tinggi'];
    const reportPriority = validPriorities.includes(priority) ? priority : 'Sedang';

    let photo_url = null;
    if (req.file) {
      const blobUrl = await uploadToBlob(req.file.path, 'maintenance_reports');
      photo_url = blobUrl || `/uploads/${req.file.filename}`;
    }

    const now = getLocalDateTime();
    const ticketNumber = generateTicketNumber();
    const reportId = uuidv4();

    const report = {
      id: reportId,
      ticket_number: ticketNumber,
      user_id: req.user.id,
      reporter_name,
      division: division || '',
      location,
      category,
      item_name,
      description,
      photo_url,
      priority: reportPriority,
      status: 'Menunggu',
      technician: null,
      repair_notes: null,
      created_at: now,
      updated_at: now
    };

    await setDoc(doc(db, 'reports', reportId), report);
    res.status(201).json(report);
  } catch (err) {
    console.error('Create report error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// Get reports (admin sees all, user sees own)
exports.getReports = async (req, res) => {
  try {
    const { status, category, priority, search, start_date, end_date, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let reportsRef = collection(db, 'reports');
    // For Firestore, we fetch data and do some filtering in memory if complex, 
    // but we can use index for simple ones. To avoid complex indexing requirement:
    // We fetch all matching base constraints, then sort & paginate in memory.
    // If not admin, filter by user_id
    
    let constraints = [];
    if (req.user.role !== 'admin') {
      constraints.push(where('user_id', '==', req.user.id));
    }
    if (status) constraints.push(where('status', '==', status));
    if (priority) constraints.push(where('priority', '==', priority));
    
    // Note: 'Lainnya%' wildcard isn't directly supported in Firestore in a simple way without '>=', '<='
    // We'll filter category and dates in memory to keep it simple and avoid missing index errors.
    
    let q = query(reportsRef, ...constraints);
    const snap = await getDocs(q);
    
    let reports = snap.docs.map(d => d.data());

    // In-memory filtering for what Firestore can't do easily without composite indexes
    if (category) {
      reports = reports.filter(r => {
        if (category === 'Lainnya') return r.category === 'Lainnya' || r.category.startsWith('Lainnya:');
        return r.category === category;
      });
    }
    
    if (start_date) {
      reports = reports.filter(r => r.created_at.split('T')[0] >= start_date);
    }
    
    if (end_date) {
      reports = reports.filter(r => r.created_at.split('T')[0] <= end_date);
    }
    
    if (search) {
      const s = search.toLowerCase();
      reports = reports.filter(r => 
        (r.reporter_name && r.reporter_name.toLowerCase().includes(s)) ||
        (r.item_name && r.item_name.toLowerCase().includes(s)) ||
        (r.description && r.description.toLowerCase().includes(s)) ||
        (r.location && r.location.toLowerCase().includes(s))
      );
    }

    // Sort descending by created_at
    reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Get unique user IDs to fetch their details
    const userIds = [...new Set(reports.map(r => r.user_id))];
    const usersMap = {};
    if (userIds.length > 0) {
      // Fetch users in chunks if necessary, but assuming < 30 per page
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.forEach(d => {
        const u = d.data();
        usersMap[u.id] = u;
      });
    }

    reports = reports.map(r => ({
      ...r,
      username: usersMap[r.user_id]?.username,
      user_full_name: usersMap[r.user_id]?.full_name
    }));

    const total = reports.length;
    // Paginate in memory
    const paginatedReports = reports.slice(offset, offset + parseInt(limit));

    res.json({
      reports: paginatedReports,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// Get single report
exports.getReport = async (req, res) => {
  try {
    const { id } = req.params;
    const reportSnap = await getDoc(doc(db, 'reports', String(id)));

    if (!reportSnap.exists()) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
    }
    
    const report = reportSnap.data();

    if (req.user.role !== 'admin' && report.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Akses ditolak.' });
    }

    const userSnap = await getDoc(doc(db, 'users', String(report.user_id)));
    if (userSnap.exists()) {
      const u = userSnap.data();
      report.username = u.username;
      report.user_full_name = u.full_name;
    }

    res.json(report);
  } catch (err) {
    console.error('Get report error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// Public ticket tracker
exports.trackReport = async (req, res) => {
  try {
    const { ticketId } = req.params;
    if (!ticketId) {
      return res.status(400).json({ error: 'Nomor tiket wajib diisi.' });
    }

    let report = null;
    
    // Search by ticket_number first
    const reportsRef = collection(db, 'reports');
    // Try exact matches (TKT-XXXX)
    const upperTicketId = ticketId.toUpperCase();
    let q = query(reportsRef, where('ticket_number', '==', upperTicketId));
    let snap = await getDocs(q);
    
    if (snap.empty) {
      // Try with 'TKT-' prefix if user forgot it
      q = query(reportsRef, where('ticket_number', '==', `TKT-${upperTicketId}`));
      snap = await getDocs(q);
    }

    if (!snap.empty) {
      report = snap.docs[0].data();
    } else {
      // Try fetching by document ID just in case
      const docSnap = await getDoc(doc(db, 'reports', ticketId));
      if (docSnap.exists()) {
        report = docSnap.data();
      }
    }

    if (!report) {
      return res.status(404).json({ 
        error: `Tiket #${ticketId} tidak ditemukan. Silakan periksa kembali nomor tiket Anda.` 
      });
    }

    res.json(report);
  } catch (err) {
    console.error('Track report error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server saat melacak tiket.' });
  }
};

// Update report status (admin only)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Menunggu', 'Diproses', 'Selesai', 'Ditolak'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid. Gunakan: Menunggu, Diproses, Selesai, atau Ditolak.' });
    }

    const reportRef = doc(db, 'reports', String(id));
    const reportSnap = await getDoc(reportRef);
    if (!reportSnap.exists()) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
    }

    const now = getLocalDateTime();
    await updateDoc(reportRef, { status, updated_at: now });
    const updated = (await getDoc(reportRef)).data();

    await createLog(id, req.user.id, req.user.username, req.user.role, `Mengubah status menjadi ${status}`, now);

    res.json(updated);
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// Update report priority (admin only)
exports.updatePriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    const validPriorities = ['Rendah', 'Sedang', 'Tinggi'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Prioritas tidak valid. Gunakan: Rendah, Sedang, atau Tinggi.' });
    }

    const reportRef = doc(db, 'reports', String(id));
    const reportSnap = await getDoc(reportRef);
    if (!reportSnap.exists()) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
    }

    const now = getLocalDateTime();
    await updateDoc(reportRef, { priority, updated_at: now });
    const updated = (await getDoc(reportRef)).data();

    await createLog(id, req.user.id, req.user.username, req.user.role, `Mengubah prioritas menjadi ${priority}`, now);

    res.json(updated);
  } catch (err) {
    console.error('Update priority error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// Assign technician (admin only)
exports.assignTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const { technician } = req.body;

    const reportRef = doc(db, 'reports', String(id));
    const reportSnap = await getDoc(reportRef);
    if (!reportSnap.exists()) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
    }

    const techValue = (technician && typeof technician === 'string' && technician.trim()) ? technician.trim() : null;
    const now = getLocalDateTime();
    await updateDoc(reportRef, { technician: techValue, updated_at: now });
    const updated = (await getDoc(reportRef)).data();

    const actionText = techValue ? `Menugaskan teknisi: ${techValue}` : 'Menghapus penugasan teknisi';
    await createLog(id, req.user.id, req.user.username, req.user.role, actionText, now);

    res.json(updated);
  } catch (err) {
    console.error('Assign technician error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// Get activity logs
exports.getLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const logsRef = collection(db, `reports/${id}/logs`);
    const q = query(logsRef, orderBy('created_at', 'asc'));
    const snap = await getDocs(q);
    
    const logs = snap.docs.map(d => d.data());
    res.json(logs);
  } catch (err) {
    console.error('Get logs error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server saat mengambil riwayat aktivitas.' });
  }
};

// Add repair notes (admin only)
exports.addRepairNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { repair_notes } = req.body;

    const reportRef = doc(db, 'reports', String(id));
    const reportSnap = await getDoc(reportRef);
    if (!reportSnap.exists()) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
    }

    const notesValue = (repair_notes && typeof repair_notes === 'string' && repair_notes.trim()) ? repair_notes.trim() : null;
    const now = getLocalDateTime();
    await updateDoc(reportRef, { repair_notes: notesValue, updated_at: now });
    const updated = (await getDoc(reportRef)).data();

    res.json(updated);
  } catch (err) {
    console.error('Add repair notes error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// Delete report (admin only)
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    
    const reportRef = doc(db, 'reports', String(id));
    const reportSnap = await getDoc(reportRef);
    if (!reportSnap.exists()) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
    }

    const report = reportSnap.data();
    const userId = report.user_id;

    // Delete subcollections first (comments, logs) to prevent ghosts
    const commentsRef = collection(db, `reports/${id}/comments`);
    const commentsSnap = await getDocs(commentsRef);
    for (const c of commentsSnap.docs) await deleteDoc(c.ref);

    const logsRef = collection(db, `reports/${id}/logs`);
    const logsSnap = await getDocs(logsRef);
    for (const l of logsSnap.docs) await deleteDoc(l.ref);

    await deleteDoc(reportRef);

    // Auto-cleanup user if they have no other reports
    let userCleanedUp = false;
    if (userId) {
      const userSnap = await getDoc(doc(db, 'users', String(userId)));
      if (userSnap.exists()) {
        const user = userSnap.data();
        if (user.role !== 'admin' && user.username !== 'admin') {
          // Check if they have other reports
          const qOther = query(collection(db, 'reports'), where('user_id', '==', userId));
          const snapOther = await getDocs(qOther);
          if (snapOther.empty) {
            await deleteDoc(doc(db, 'users', String(userId)));
            userCleanedUp = true;
          }
        }
      }
    }

    res.json({ 
      message: `Laporan #${id} berhasil dihapus.` + (userCleanedUp ? ' Akun pelapor juga otomatis dibersihkan karena tidak memiliki laporan lain.' : '')
    });
  } catch (err) {
    console.error('Delete report error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server saat menghapus laporan.' });
  }
};

// Dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const isUser = req.user && req.user.role !== 'admin';

    let constraints = [];
    if (isUser) constraints.push(where('user_id', '==', req.user.id));
    
    let q = query(collection(db, 'reports'), ...constraints);
    const snap = await getDocs(q);
    let allReports = snap.docs.map(d => d.data());

    // In-memory filter for dates
    if (start_date) allReports = allReports.filter(r => r.created_at.split('T')[0] >= start_date);
    if (end_date) allReports = allReports.filter(r => r.created_at.split('T')[0] <= end_date);

    // Calc summary
    let pending = 0, processing = 0, completed = 0, rejected = 0;
    let totalResolutionHours = 0;
    let categoryMap = {}, locationMap = {}, monthMap = {}, priorityMap = {}, statusMap = {};

    allReports.forEach(r => {
      if (r.status === 'Menunggu') pending++;
      else if (r.status === 'Diproses') processing++;
      else if (r.status === 'Selesai') {
        completed++;
        const dCreated = new Date(r.created_at);
        const dUpdated = new Date(r.updated_at);
        const diffHours = (dUpdated - dCreated) / (1000 * 60 * 60);
        totalResolutionHours += diffHours;
      }
      else if (r.status === 'Ditolak') rejected++;

      // Category
      categoryMap[r.category] = (categoryMap[r.category] || 0) + 1;
      // Location
      locationMap[r.location] = (locationMap[r.location] || 0) + 1;
      // Priority
      priorityMap[r.priority] = (priorityMap[r.priority] || 0) + 1;
      // Status
      statusMap[r.status] = (statusMap[r.status] || 0) + 1;
      // Month
      const monthStr = r.created_at.substring(0, 7); // YYYY-MM
      monthMap[monthStr] = (monthMap[monthStr] || 0) + 1;
    });

    const byCategory = Object.keys(categoryMap).map(k => ({ category: k, count: categoryMap[k] })).sort((a,b)=>b.count-a.count);
    const byLocation = Object.keys(locationMap).map(k => ({ location: k, count: locationMap[k] })).sort((a,b)=>b.count-a.count).slice(0, 10);
    const byPriority = Object.keys(priorityMap).map(k => ({ priority: k, count: priorityMap[k] }));
    const byStatus = Object.keys(statusMap).map(k => ({ status: k, count: statusMap[k] }));
    const byMonth = Object.keys(monthMap).map(k => ({ month: k, count: monthMap[k] })).sort((a,b)=>a.month.localeCompare(b.month));

    const avgResolutionHours = completed > 0 ? (totalResolutionHours / completed) : 0;

    // Recent reports
    allReports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const recentReports = allReports.slice(0, 5);

    // Fetch user details for recent reports
    const usersSnap = await getDocs(collection(db, 'users'));
    const usersMap = {};
    usersSnap.forEach(d => { usersMap[d.data().id] = d.data(); });
    
    recentReports.forEach(r => {
      r.user_full_name = usersMap[r.user_id]?.full_name || 'Unknown';
    });

    res.json({
      summary: {
        total: allReports.length,
        pending,
        processing,
        completed,
        rejected,
        avgResolutionHours: Math.round(avgResolutionHours * 10) / 10
      },
      byCategory,
      byLocation,
      byMonth,
      byPriority,
      byStatus,
      recentReports
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// Export CSV (ExcelJS)
exports.exportCSV = async (req, res) => {
  try {
    const { status, category, priority, start_date, end_date } = req.query;
    
    const snap = await getDocs(collection(db, 'reports'));
    let reports = snap.docs.map(d => d.data());

    if (status) reports = reports.filter(r => r.status === status);
    if (priority) reports = reports.filter(r => r.priority === priority);
    if (category) {
      reports = reports.filter(r => {
        if (category === 'Lainnya') return r.category === 'Lainnya' || r.category.startsWith('Lainnya:');
        return r.category === category;
      });
    }
    if (start_date) reports = reports.filter(r => r.created_at.split('T')[0] >= start_date);
    if (end_date) reports = reports.filter(r => r.created_at.split('T')[0] <= end_date);

    reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Maintenance');

    worksheet.columns = [
      { header: 'No. Tiket', key: 'ticket_number', width: 15 },
      { header: 'Tanggal Laporan', key: 'created_at', width: 25 },
      { header: 'Nama Pelapor', key: 'reporter_name', width: 25 },
      { header: 'Divisi', key: 'division', width: 20 },
      { header: 'Lokasi/Ruangan', key: 'location', width: 20 },
      { header: 'Kategori', key: 'category', width: 15 },
      { header: 'Nama Barang', key: 'item_name', width: 25 },
      { header: 'Deskripsi Masalah', key: 'description', width: 40 },
      { header: 'Prioritas', key: 'priority', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Teknisi', key: 'technician', width: 20 },
      { header: 'Catatan Perbaikan', key: 'repair_notes', width: 40 },
    ];

    reports.forEach(r => {
      worksheet.addRow({
        ticket_number: r.ticket_number,
        created_at: new Date(r.created_at).toLocaleString('id-ID'),
        reporter_name: r.reporter_name,
        division: r.division || '-',
        location: r.location,
        category: r.category,
        item_name: r.item_name,
        description: r.description,
        priority: r.priority,
        status: r.status,
        technician: r.technician || '-',
        repair_notes: r.repair_notes || '-'
      });
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=laporan-maintenance.csv');
    
    await workbook.csv.write(res);
    res.end();
  } catch (err) {
    console.error('Export CSV error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan saat export CSV.' });
  }
};

// Export Excel
exports.exportExcel = async (req, res) => {
  try {
    const { status, category, priority, start_date, end_date } = req.query;
    
    const snap = await getDocs(collection(db, 'reports'));
    let reports = snap.docs.map(d => d.data());

    if (status) reports = reports.filter(r => r.status === status);
    if (priority) reports = reports.filter(r => r.priority === priority);
    if (category) {
      reports = reports.filter(r => {
        if (category === 'Lainnya') return r.category === 'Lainnya' || r.category.startsWith('Lainnya:');
        return r.category === category;
      });
    }
    if (start_date) reports = reports.filter(r => r.created_at.split('T')[0] >= start_date);
    if (end_date) reports = reports.filter(r => r.created_at.split('T')[0] <= end_date);

    reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Maintenance');

    worksheet.columns = [
      { header: 'No. Tiket', key: 'ticket_number', width: 15 },
      { header: 'Tanggal Laporan', key: 'created_at', width: 20 },
      { header: 'Nama Pelapor', key: 'reporter_name', width: 25 },
      { header: 'Divisi', key: 'division', width: 20 },
      { header: 'Lokasi/Ruangan', key: 'location', width: 20 },
      { header: 'Kategori', key: 'category', width: 15 },
      { header: 'Nama Barang', key: 'item_name', width: 25 },
      { header: 'Deskripsi Masalah', key: 'description', width: 40 },
      { header: 'Prioritas', key: 'priority', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Teknisi', key: 'technician', width: 20 },
      { header: 'Catatan Perbaikan', key: 'repair_notes', width: 40 },
      { header: 'URL Foto', key: 'photo_url', width: 30 }
    ];

    reports.forEach((r, index) => {
      worksheet.addRow({
        ticket_number: r.ticket_number,
        created_at: new Date(r.created_at).toLocaleString('id-ID'),
        reporter_name: r.reporter_name,
        division: r.division || '-',
        location: r.location,
        category: r.category,
        item_name: r.item_name,
        description: r.description,
        priority: r.priority,
        status: r.status,
        technician: r.technician || '-',
        repair_notes: r.repair_notes || '-',
        photo_url: r.photo_url || '-'
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=laporan-maintenance.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export Excel error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan saat export Excel.' });
  }
};

// Delete report (admin only) - also deletes photo from Vercel Blob
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const reportRef = doc(db, 'reports', String(id));
    const reportSnap = await getDoc(reportRef);

    if (!reportSnap.exists()) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
    }

    const report = reportSnap.data();

    // Hapus foto dari Vercel Blob jika ada
    if (report.photo_url) {
      const deleted = await deleteFromBlob(report.photo_url);
      if (deleted) {
        console.log('[Delete Report] Foto berhasil dihapus dari Vercel Blob:', report.photo_url);
      } else {
        console.warn('[Delete Report] Foto tidak dihapus (mungkin bukan Vercel Blob URL):', report.photo_url);
      }
    }

    // Hapus dokumen laporan dari Firestore
    await deleteDoc(reportRef);

    res.json({ message: 'Laporan berhasil dihapus.' });
  } catch (err) {
    console.error('Delete report error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan saat menghapus laporan.' });
  }
};

