const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryAll, queryOne, runQuery, getDb, syncFromCloud } = require('../config/database');
const { syncReportToFirebase, syncUserToFirebase, syncCommentToFirebase, getCommentsFromFirebase } = require('../services/firebaseService');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const ExcelJS = require('exceljs');

const JWT_SECRET = process.env.JWT_SECRET || 'maintenance-system-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const { getLocalDateTime } = require('../utils/time');

// Direct Report (creates user on the fly, creates report, returns JWT + report)
exports.directReport = async (req, res) => {
  try {
    const { 
      reporter_name, 
      division, 
      location, 
      category, 
      item_name, 
      description, 
      priority,
      username,
      password 
    } = req.body;

    if (!reporter_name || !location || !item_name || !description) {
      return res.status(400).json({ error: 'Nama pelapor, lokasi/ruangan, nama barang, dan deskripsi kerusakan wajib diisi.' });
    }

    const reportCategory = category || 'Elektronik';
    const validPriorities = ['Rendah', 'Sedang', 'Tinggi'];
    const reportPriority = validPriorities.includes(priority) ? priority : 'Sedang';

    // Generate or use username
    let userHandle = username ? username.trim().toLowerCase() : '';
    if (!userHandle) {
      const baseHandle = reporter_name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      userHandle = `${baseHandle || 'pelapor'}_${randomSuffix}`;
    }

    // Check if user already exists
    let user = queryOne('SELECT * FROM users WHERE username = ?', [userHandle]);

    if (!user) {
      const rawPassword = password && password.length >= 6 ? password : 'user123';
      const hashedPassword = bcrypt.hashSync(rawPassword, 10);
      const userRes = runQuery(
        'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)',
        [userHandle, hashedPassword, reporter_name, 'user']
      );
      user = queryOne('SELECT id, username, full_name, role, created_at FROM users WHERE id = ?', [userRes.lastInsertRowid]);
    }

    let photo_url = null;
    if (req.file) {
      const cloudinaryUrl = await uploadToCloudinary(req.file.path);
      photo_url = cloudinaryUrl || `/uploads/${req.file.filename}`;
    }

    const now = getLocalDateTime();
    const result = runQuery(
      `INSERT INTO reports (user_id, reporter_name, division, location, category, item_name, description, photo_url, priority, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Menunggu', ?, ?)`,
      [user.id, reporter_name, division || 'Umum', location, reportCategory, item_name, description, photo_url, reportPriority, now, now]
    );

    const report = queryOne('SELECT * FROM reports WHERE id = ?', [result.lastInsertRowid]);

    // Sinkronkan akun dan laporan ke Firebase Realtime Database
    await Promise.allSettled([
      syncUserToFirebase(user),
      syncReportToFirebase(report)
    ]);

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

    // Verify report exists
    const report = queryOne('SELECT id FROM reports WHERE id = ?', [reportId]);
    if (!report) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
    }

    // Fetch sender_name since full_name is not in JWT payload
    const user = queryOne('SELECT full_name, username FROM users WHERE id = ?', [req.user.id]);
    const senderName = user ? (user.full_name || user.username) : 'Unknown';

    const { getLocalDateTime } = require('../utils/time');
    const now = getLocalDateTime();
    
    const result = runQuery(
      'INSERT INTO report_comments (report_id, user_id, sender_name, role, message, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [reportId, req.user.id, senderName, req.user.role, message, now]
    );

    const comment = queryOne('SELECT * FROM report_comments WHERE id = ?', [result.lastInsertRowid]);
    
    // Sync to Firebase
    await syncCommentToFirebase(comment, reportId);

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
    
    // First try from SQLite
    let comments = queryAll('SELECT * FROM report_comments WHERE report_id = ? ORDER BY created_at ASC', [reportId]);
    
    // If empty in SQLite, maybe try from Firebase (for backward compatibility if needed)
    if (comments.length === 0) {
      comments = await getCommentsFromFirebase(reportId);
      // Sort them by created_at
      comments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }
    
    res.json(comments);
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server saat mengambil komentar.' });
  }
};

// Public Comments (for non-logged in users tracking their tickets)
exports.getPublicComments = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;
    const report = queryOne('SELECT id FROM reports WHERE id = ?', [ticketId]);
    if (!report) return res.status(404).json({ error: 'Tiket tidak ditemukan' });

    let comments = queryAll('SELECT * FROM report_comments WHERE report_id = ? ORDER BY created_at ASC', [ticketId]);
    if (comments.length === 0) {
      const { getCommentsFromFirebase } = require('../services/firebaseService');
      comments = await getCommentsFromFirebase(ticketId);
      comments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }
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

    const report = queryOne('SELECT id, user_id, reporter_name FROM reports WHERE id = ?', [ticketId]);
    if (!report) return res.status(404).json({ error: 'Laporan tidak ditemukan.' });

    const { getLocalDateTime } = require('../utils/time');
    const now = getLocalDateTime();
    
    const result = runQuery(
      'INSERT INTO report_comments (report_id, user_id, sender_name, role, message, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [ticketId, report.user_id, report.reporter_name + " (Pelapor)", "user", message, now]
    );

    const comment = queryOne('SELECT * FROM report_comments WHERE id = ?', [result.lastInsertRowid]);
    
    const { syncCommentToFirebase } = require('../services/firebaseService');
    await syncCommentToFirebase(comment, ticketId);

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

    const validCategories = ['Elektronik', 'ATK', 'Infrastruktur', 'Furniture', 'Jaringan', 'Lainnya'];
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
      const cloudinaryUrl = await uploadToCloudinary(req.file.path);
      photo_url = cloudinaryUrl || `/uploads/${req.file.filename}`;
    }

    const now = getLocalDateTime();
    const result = runQuery(
      `INSERT INTO reports (user_id, reporter_name, division, location, category, item_name, description, photo_url, priority, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Menunggu', ?, ?)`,
      [req.user.id, reporter_name, division || '', location, category, item_name, description, photo_url, reportPriority, now, now]
    );

    const report = queryOne('SELECT * FROM reports WHERE id = ?', [result.lastInsertRowid]);
    
    // Sinkronkan laporan ke Firebase Realtime Database
    await syncReportToFirebase(report);
    res.status(201).json(report);
  } catch (err) {
    console.error('Create report error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// Get reports (admin sees all, user sees own)
exports.getReports = async (req, res) => {
  try {
    await syncFromCloud();

    const { status, category, priority, search, start_date, end_date, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = [];
    let params = [];

    if (req.user.role !== 'admin') {
      conditions.push('r.user_id = ?');
      params.push(req.user.id);
    }

    if (status) {
      conditions.push('r.status = ?');
      params.push(status);
    }
    if (category) {
      if (category === 'Lainnya') {
        conditions.push("(r.category = 'Lainnya' OR r.category LIKE 'Lainnya:%')");
      } else {
        conditions.push('r.category = ?');
        params.push(category);
      }
    }
    if (priority) {
      conditions.push('r.priority = ?');
      params.push(priority);
    }
    if (search) {
      conditions.push("(r.reporter_name LIKE ? OR r.item_name LIKE ? OR r.description LIKE ? OR r.location LIKE ?)");
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    if (start_date) {
      conditions.push('DATE(r.created_at) >= ?');
      params.push(start_date);
    }
    if (end_date) {
      conditions.push('DATE(r.created_at) <= ?');
      params.push(end_date);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Count total
    const countRow = queryOne(`SELECT COUNT(*) as total FROM reports r ${whereClause}`, params);
    const total = countRow ? countRow.total : 0;

    // Get reports with user join
    const allParams = [...params, parseInt(limit), offset];
    const reports = queryAll(
      `SELECT r.*, u.username, u.full_name as user_full_name
       FROM reports r
       LEFT JOIN users u ON r.user_id = u.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      allParams
    );

    res.json({
      reports,
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
    await syncFromCloud();

    const { id } = req.params;
    const report = queryOne(
      `SELECT r.*, u.username, u.full_name as user_full_name
       FROM reports r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [parseInt(id)]
    );

    if (!report) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
    }

    if (req.user.role !== 'admin' && report.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Akses ditolak.' });
    }

    res.json(report);
  } catch (err) {
    console.error('Get report error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// Public ticket tracker (no authentication required)
exports.trackReport = async (req, res) => {
  try {
    await syncFromCloud();

    const { ticketId } = req.params;
    if (!ticketId) {
      return res.status(400).json({ error: 'Nomor tiket wajib diisi.' });
    }

    // Extract numerical ID from string (e.g. "TKT-00012" -> 12, or "12" -> 12)
    const cleanId = parseInt(String(ticketId).replace(/\D/g, ''), 10);
    if (isNaN(cleanId) || cleanId <= 0) {
      return res.status(400).json({ error: 'Format nomor tiket tidak valid. Contoh: #TKT-00012 atau 12.' });
    }

    const report = queryOne(
      `SELECT r.id, r.reporter_name, r.division, r.location, r.category, r.item_name, 
              r.description, r.photo_url, r.priority, r.status, r.technician, 
              r.repair_notes, r.created_at, r.updated_at
       FROM reports r
       WHERE r.id = ?`,
      [cleanId]
    );

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

    const report = queryOne('SELECT * FROM reports WHERE id = ?', [parseInt(id)]);
    if (!report) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
    }

    const now = getLocalDateTime();
    runQuery('UPDATE reports SET status = ?, updated_at = ? WHERE id = ?', [status, now, parseInt(id)]);
    const updated = queryOne('SELECT * FROM reports WHERE id = ?', [parseInt(id)]);

    // Sinkronkan status baru ke Firebase Cloud Firestore
    await syncReportToFirebase(updated);

    res.json(updated);
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// Assign technician (admin only - can assign or reset/clear)
exports.assignTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const { technician } = req.body;

    const report = queryOne('SELECT * FROM reports WHERE id = ?', [parseInt(id)]);
    if (!report) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
    }

    const techValue = (technician && typeof technician === 'string' && technician.trim()) ? technician.trim() : null;
    const now = getLocalDateTime();
    runQuery('UPDATE reports SET technician = ?, updated_at = ? WHERE id = ?', [techValue, now, parseInt(id)]);
    const updated = queryOne('SELECT * FROM reports WHERE id = ?', [parseInt(id)]);

    // Sinkronkan penugasan teknisi ke Firebase Cloud Firestore
    await syncReportToFirebase(updated);

    res.json(updated);
  } catch (err) {
    console.error('Assign technician error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// Add repair notes (admin only - can update or reset/clear)
exports.addRepairNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { repair_notes } = req.body;

    const report = queryOne('SELECT * FROM reports WHERE id = ?', [parseInt(id)]);
    if (!report) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
    }

    const notesValue = (repair_notes && typeof repair_notes === 'string' && repair_notes.trim()) ? repair_notes.trim() : null;
    const now = getLocalDateTime();
    runQuery('UPDATE reports SET repair_notes = ?, updated_at = ? WHERE id = ?', [notesValue, now, parseInt(id)]);
    const updated = queryOne('SELECT * FROM reports WHERE id = ?', [parseInt(id)]);

    // Sinkronkan catatan perbaikan ke Firebase Cloud Firestore
    await syncReportToFirebase(updated);

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
    const reportId = parseInt(id, 10);
    const report = queryOne('SELECT * FROM reports WHERE id = ?', [reportId]);
    if (!report) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
    }

    const userId = report.user_id;

    runQuery('DELETE FROM reports WHERE id = ?', [reportId]);
    const { deleteReportFromFirebase, deleteUserFromFirebase } = require('../services/firebaseService');
    await deleteReportFromFirebase(reportId);

    // Opsi 1: Otomatis bersihkan akun user jika bukan admin dan sudah tidak memiliki laporan lain
    let userCleanedUp = false;
    if (userId) {
      const user = queryOne('SELECT id, role, username FROM users WHERE id = ?', [userId]);
      if (user && user.role !== 'admin' && user.username !== 'admin') {
        const remaining = queryOne('SELECT COUNT(*) as count FROM reports WHERE user_id = ?', [userId]);
        if (!remaining || remaining.count === 0) {
          runQuery('DELETE FROM users WHERE id = ?', [userId]);
          await deleteUserFromFirebase(userId);
          userCleanedUp = true;
          console.log(`[Auto-cleanup] User #${userId} (${user.username}) berhasil dihapus otomatis karena tidak memiliki laporan lain.`);
        }
      }
    }

    res.json({ 
      message: `Laporan #${reportId} berhasil dihapus.` + (userCleanedUp ? ' Akun pelapor juga otomatis dibersihkan karena tidak memiliki laporan lain.' : '')
    });
  } catch (err) {
    console.error('Delete report error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server saat menghapus laporan.' });
  }
};

// Dashboard statistics (admin sees all, regular user sees their own, supports date range filtering)
exports.getDashboardStats = async (req, res) => {
  try {
    await syncFromCloud();

    const { start_date, end_date } = req.query;
    const isUser = req.user && req.user.role !== 'admin';

    // Build conditions for reports table
    let baseConditions = [];
    let baseParams = [];

    if (isUser) {
      baseConditions.push('user_id = ?');
      baseParams.push(req.user.id);
    }
    if (start_date) {
      baseConditions.push('DATE(created_at) >= ?');
      baseParams.push(start_date);
    }
    if (end_date) {
      baseConditions.push('DATE(created_at) <= ?');
      baseParams.push(end_date);
    }

    const buildWhere = (extraCondition = '', extraParams = []) => {
      const allConds = extraCondition ? [...baseConditions, extraCondition] : [...baseConditions];
      const whereStr = allConds.length > 0 ? 'WHERE ' + allConds.join(' AND ') : '';
      return { whereStr, params: [...baseParams, ...extraParams] };
    };

    const totalQuery = buildWhere();
    const totalRow = queryOne(`SELECT COUNT(*) as count FROM reports ${totalQuery.whereStr}`, totalQuery.params);

    const pendingQuery = buildWhere("status = 'Menunggu'");
    const pendingRow = queryOne(`SELECT COUNT(*) as count FROM reports ${pendingQuery.whereStr}`, pendingQuery.params);

    const processingQuery = buildWhere("status = 'Diproses'");
    const processingRow = queryOne(`SELECT COUNT(*) as count FROM reports ${processingQuery.whereStr}`, processingQuery.params);

    const completedQuery = buildWhere("status = 'Selesai'");
    const completedRow = queryOne(`SELECT COUNT(*) as count FROM reports ${completedQuery.whereStr}`, completedQuery.params);

    const rejectedQuery = buildWhere("status = 'Ditolak'");
    const rejectedRow = queryOne(`SELECT COUNT(*) as count FROM reports ${rejectedQuery.whereStr}`, rejectedQuery.params);

    const catQuery = buildWhere();
    const byCategory = queryAll(`
      SELECT category, COUNT(*) as count
      FROM reports
      ${catQuery.whereStr}
      GROUP BY category
      ORDER BY count DESC
    `, catQuery.params);

    const monthQuery = (start_date || end_date)
      ? buildWhere()
      : buildWhere("created_at >= date('now', '-6 months')");

    const byMonth = queryAll(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM reports
      ${monthQuery.whereStr}
      GROUP BY month
      ORDER BY month ASC
    `, monthQuery.params);

    const prioQuery = buildWhere();
    const byPriority = queryAll(`
      SELECT priority, COUNT(*) as count
      FROM reports
      ${prioQuery.whereStr}
      GROUP BY priority
    `, prioQuery.params);

    const statusQuery = buildWhere();
    const byStatus = queryAll(`
      SELECT status, COUNT(*) as count
      FROM reports
      ${statusQuery.whereStr}
      GROUP BY status
    `, statusQuery.params);

    const locationQuery = buildWhere();
    const byLocation = queryAll(`
      SELECT location, COUNT(*) as count
      FROM reports
      ${locationQuery.whereStr}
      GROUP BY location
      ORDER BY count DESC
      LIMIT 10
    `, locationQuery.params);

    // Recent reports with joined user
    let recentConds = [];
    let recentParams = [];
    if (isUser) {
      recentConds.push('r.user_id = ?');
      recentParams.push(req.user.id);
    }
    if (start_date) {
      recentConds.push('DATE(r.created_at) >= ?');
      recentParams.push(start_date);
    }
    if (end_date) {
      recentConds.push('DATE(r.created_at) <= ?');
      recentParams.push(end_date);
    }
    const recentWhere = recentConds.length > 0 ? 'WHERE ' + recentConds.join(' AND ') : '';

    const recentReports = queryAll(`
      SELECT r.*, u.full_name as user_full_name
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      ${recentWhere}
      ORDER BY r.created_at DESC
      LIMIT 5
    `, recentParams);

    res.json({
      summary: {
        total: totalRow?.count || 0,
        pending: pendingRow?.count || 0,
        processing: processingRow?.count || 0,
        completed: completedRow?.count || 0,
        rejected: rejectedRow?.count || 0
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

// Export to CSV
exports.exportCSV = (req, res) => {
  try {
    const { status, category, priority, start_date, end_date } = req.query;
    let conditions = [];
    let params = [];

    if (status) {
      conditions.push('r.status = ?');
      params.push(status);
    }
    if (category) {
      if (category === 'Lainnya') {
        conditions.push("(r.category = 'Lainnya' OR r.category LIKE 'Lainnya:%')");
      } else {
        conditions.push('r.category = ?');
        params.push(category);
      }
    }
    if (priority) {
      conditions.push('r.priority = ?');
      params.push(priority);
    }
    if (start_date) {
      conditions.push('DATE(r.created_at) >= ?');
      params.push(start_date);
    }
    if (end_date) {
      conditions.push('DATE(r.created_at) <= ?');
      params.push(end_date);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const reports = queryAll(`
      SELECT r.id, r.reporter_name, r.division, r.location, r.category, r.item_name,
             r.description, r.priority, r.status, r.technician, r.repair_notes,
             r.created_at, r.updated_at, u.full_name as pelapor_akun
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      ${whereClause}
      ORDER BY r.created_at DESC
    `, params);

    const headers = ['No', 'ID Tiket / No. Invoice', 'ID Database', 'Nama Pelapor', 'Divisi', 'Lokasi / Kerusakan', 'Kategori', 'Nama Barang', 'Deskripsi', 'Prioritas', 'Status', 'Teknisi', 'Catatan Perbaikan', 'Tanggal Laporan', 'Terakhir Update', 'Akun Pelapor'];
    const csvRows = [headers.join(',')];

    let no = 1;
    for (const r of reports) {
      const ticketId = `#TKT-${String(r.id).padStart(5, '0')}`;
      const row = [
        no++,
        `"${ticketId}"`,
        r.id,
        `"${(r.reporter_name || '').replace(/"/g, '""')}"`,
        `"${(r.division || '-').replace(/"/g, '""')}"`,
        `"${(r.location || '').replace(/"/g, '""')}"`,
        r.category,
        `"${(r.item_name || '').replace(/"/g, '""')}"`,
        `"${(r.description || '').replace(/"/g, '""')}"`,
        r.priority,
        r.status,
        `"${(r.technician || '').replace(/"/g, '""')}"`,
        `"${(r.repair_notes || '').replace(/"/g, '""')}"`,
        r.created_at,
        r.updated_at,
        `"${(r.pelapor_akun || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    }

    // sep=, tells Excel to split columns by comma even on Indonesian / European regional settings!
    const csv = 'sep=,\r\n' + csvRows.join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=laporan-pengaduan-${new Date().toISOString().slice(0,10)}.csv`);
    res.send('\uFEFF' + csv);
  } catch (err) {
    console.error('Export CSV error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// Export to Excel (.xlsx) with clean layout, styling, and column widths
exports.exportExcel = async (req, res) => {
  try {
    const { status, category, priority, start_date, end_date } = req.query;
    let conditions = [];
    let params = [];

    if (status) {
      conditions.push('r.status = ?');
      params.push(status);
    }
    if (category) {
      if (category === 'Lainnya') {
        conditions.push("(r.category = 'Lainnya' OR r.category LIKE 'Lainnya:%')");
      } else {
        conditions.push('r.category = ?');
        params.push(category);
      }
    }
    if (priority) {
      conditions.push('r.priority = ?');
      params.push(priority);
    }
    if (start_date) {
      conditions.push('DATE(r.created_at) >= ?');
      params.push(start_date);
    }
    if (end_date) {
      conditions.push('DATE(r.created_at) <= ?');
      params.push(end_date);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const reports = queryAll(`
      SELECT r.id, r.reporter_name, r.division, r.location, r.category, r.item_name,
             r.description, r.priority, r.status, r.technician, r.repair_notes,
             r.created_at, r.updated_at, u.full_name as pelapor_akun
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      ${whereClause}
      ORDER BY r.created_at DESC
    `, params);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistem Pengaduan Maintenance';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Rekap Pengaduan', {
      views: [{ showGridLines: true }]
    });

    // 1. Title Banner (A1:O1)
    worksheet.mergeCells('A1:O1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'REKAPITULASI LAPORAN PENGADUAN & PERBAIKAN FASILITAS';
    titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F2C59' } // Elegant Deep PLN Blue
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 36;

    // 2. Info / Filter subtitle (A2:O2)
    worksheet.mergeCells('A2:O2');
    const subCell = worksheet.getCell('A2');
    const filterInfo = [
      `Waktu Unduh: ${new Date().toLocaleString('id-ID')}`,
      status ? `Status: ${status}` : 'Status: Semua Status',
      category ? `Kategori: ${category}` : 'Kategori: Semua Kategori',
      priority ? `Prioritas: ${priority}` : 'Prioritas: Semua Prioritas',
      (start_date || end_date) ? `Periode: ${start_date || '...'} s/d ${end_date || '...'}` : 'Periode: Semua Data',
      `Total Data: ${reports.length} Laporan`
    ].join('   |   ');
    subCell.value = filterInfo;
    subCell.font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: 'FF334155' } };
    subCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' }
    };
    subCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 24;

    // Spacer row
    worksheet.getRow(3).height = 10;

    // 3. Table Column Headers
    const columnDefinitions = [
      { key: 'no', header: 'NO', width: 6 },
      { key: 'ticket_id', header: 'NO. INVOICE / TIKET', width: 22 },
      { key: 'created_at', header: 'TANGGAL LAPORAN', width: 20 },
      { key: 'reporter_name', header: 'NAMA PELAPOR', width: 22 },
      { key: 'pelapor_akun', header: 'AKUN PELAPOR', width: 18 },
      { key: 'division', header: 'DIVISI', width: 16 },
      { key: 'location', header: 'LOKASI KERUSAKAN', width: 24 },
      { key: 'category', header: 'KATEGORI', width: 18 },
      { key: 'item_name', header: 'NAMA BARANG', width: 22 },
      { key: 'description', header: 'DESKRIPSI KELUHAN', width: 36 },
      { key: 'priority', header: 'PRIORITAS', width: 14 },
      { key: 'status', header: 'STATUS', width: 16 },
      { key: 'technician', header: 'TEKNISI', width: 20 },
      { key: 'repair_notes', header: 'CATATAN PERBAIKAN', width: 34 },
      { key: 'updated_at', header: 'TERAKHIR UPDATE', width: 20 },
    ];

    const headerRow = worksheet.getRow(4);
    headerRow.height = 28;

    columnDefinitions.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' } // Dark Blue
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF334155' } },
        bottom: { style: 'medium', color: { argb: 'FF334155' } },
        left: { style: 'thin', color: { argb: 'FF475569' } },
        right: { style: 'thin', color: { argb: 'FF475569' } },
      };
      worksheet.getColumn(idx + 1).width = col.width;
    });

    // 4. Data Rows
    reports.forEach((r, idx) => {
      const rowNum = 5 + idx;
      const dataRow = worksheet.getRow(rowNum);
      dataRow.height = 26;

      const ticketId = `#TKT-${String(r.id).padStart(5, '0')}`;
      const isEven = idx % 2 === 0;
      const rowBgColor = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

      const values = [
        idx + 1,
        ticketId,
        r.created_at || '-',
        r.reporter_name || '-',
        r.pelapor_akun || '-',
        r.division || '-',
        r.location || '-',
        r.category || '-',
        r.item_name || '-',
        r.description || '-',
        r.priority || '-',
        r.status || '-',
        r.technician || '-',
        r.repair_notes || '-',
        r.updated_at || '-',
      ];

      values.forEach((val, colIdx) => {
        const cell = dataRow.getCell(colIdx + 1);
        cell.value = val;
        cell.font = { name: 'Segoe UI', size: 9.5 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: rowBgColor }
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };

        // Alignments and highlights
        if (colIdx === 0) { // NO
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colIdx === 1) { // Ticket ID
          cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF1E40AF' } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colIdx === 2 || colIdx === 14) { // Dates
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colIdx === 10) { // Priority
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          if (r.priority === 'Darurat' || r.priority === 'Tinggi') {
            cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF991B1B' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          } else if (r.priority === 'Sedang') {
            cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF854D0E' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
          } else {
            cell.font = { name: 'Segoe UI', size: 9.5, color: { argb: 'FF166534' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
          }
        } else if (colIdx === 11) { // Status
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          if (r.status === 'Selesai') {
            cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF166534' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
          } else if (r.status === 'Diproses') {
            cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF1E40AF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
          } else if (r.status === 'Ditolak') {
            cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF991B1B' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          } else {
            cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF854D0E' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } };
          }
        } else if (colIdx === 9 || colIdx === 13) { // Description & Notes
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });
    });

    // Auto-filter on header row (row 4)
    worksheet.autoFilter = {
      from: 'A4',
      to: 'O4'
    };

    const filename = `laporan-pengaduan-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export Excel error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server saat membuat file Excel.' });
  }
};
