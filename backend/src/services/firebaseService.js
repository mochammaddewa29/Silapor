const { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc 
} = require('../config/firebase');

// Helper wrapper untuk menghindari Firebase SDK Web hang pada Vercel Serverless Function
const withTimeout = (promise, ms = 5000, fallback = null) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

/**
 * Menyimpan atau memperbarui data user ke Cloud Firestore
 * Collection: 'users' -> Document ID: String(user.id)
 */
async function syncUserToFirebase(user) {
  if (!user || !user.id) return;
  try {
    const userDocRef = doc(db, 'users', String(user.id));
    const dataToSave = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      created_at: user.created_at || new Date().toISOString()
    };
    await withTimeout(setDoc(userDocRef, dataToSave, { merge: true }), 5000);
    console.log(`[Cloud Firestore] User #${user.id} (${user.username}) berhasil disimpan ke Firestore.`);
  } catch (err) {
    console.warn(`[Firestore Notice] Gagal sinkronisasi user #${user.id} ke Firestore:`, err.message);
  }
}

/**
 * Menyimpan atau memperbarui data laporan ke Cloud Firestore
 * Collection: 'reports' -> Document ID: String(report.id)
 */
async function syncReportToFirebase(report) {
  if (!report || !report.id) return;
  try {
    const reportDocRef = doc(db, 'reports', String(report.id));
    const dataToSave = {
      id: report.id,
      user_id: report.user_id,
      reporter_name: report.reporter_name,
      division: report.division || '',
      location: report.location,
      category: report.category,
      item_name: report.item_name,
      description: report.description,
      photo_url: report.photo_url || null,
      priority: report.priority || 'Sedang',
      status: report.status || 'Menunggu',
      technician: report.technician || null,
      repair_notes: report.repair_notes || null,
      created_at: report.created_at || new Date().toISOString(),
      updated_at: report.updated_at || new Date().toISOString()
    };
    await withTimeout(setDoc(reportDocRef, dataToSave, { merge: true }), 5000);
    console.log(`[Cloud Firestore] Laporan #${report.id} ("${report.item_name}") berhasil disimpan ke Firestore.`);
  } catch (err) {
    console.warn(`[Firestore Notice] Gagal sinkronisasi laporan #${report.id} ke Firestore:`, err.message);
  }
}

/**
 * Menghapus laporan dari Cloud Firestore
 */
async function deleteReportFromFirebase(reportId) {
  if (!reportId) return;
  try {
    const reportDocRef = doc(db, 'reports', String(reportId));
    await withTimeout(deleteDoc(reportDocRef), 5000);
    console.log(`[Cloud Firestore] Laporan #${reportId} dihapus dari Firestore.`);
  } catch (err) {
    console.warn(`[Firestore Notice] Gagal menghapus laporan #${reportId} dari Firestore:`, err.message);
  }
}

/**
 * Menghapus user dari Cloud Firestore
 */
async function deleteUserFromFirebase(userId) {
  if (!userId) return;
  try {
    const userDocRef = doc(db, 'users', String(userId));
    await withTimeout(deleteDoc(userDocRef), 5000);
    console.log(`[Cloud Firestore] User #${userId} dihapus dari Firestore.`);
  } catch (err) {
    console.warn(`[Firestore Notice] Gagal menghapus user #${userId} dari Firestore:`, err.message);
  }
}

/**
 * Sinkronisasi masal seluruh data (users dan reports) ke Cloud Firestore
 */
async function syncAllToFirebase(users = [], reports = []) {
  try {
    console.log(`[Cloud Firestore] Memulai sinkronisasi ${users.length} users & ${reports.length} reports ke Firestore...`);
    
    for (const u of users) {
      await syncUserToFirebase(u);
    }

    for (const r of reports) {
      await syncReportToFirebase(r);
    }

    console.log('[Cloud Firestore] Sinkronisasi seluruh data ke Firestore selesai.');
  } catch (err) {
    console.warn('[Firestore Notice] Gagal sinkronisasi masal ke Firestore:', err.message);
  }
}

/**
 * Mengambil seluruh laporan dari Cloud Firestore
 */
async function getReportsFromFirebase() {
  try {
    const snapshot = await withTimeout(getDocs(collection(db, 'reports')), 5000);
    return snapshot.docs.map(d => d.data());
  } catch (err) {
    console.warn('[Firestore Notice] Gagal mengambil laporan dari Firestore:', err.message);
    return [];
  }
}

/**
 * Mengambil seluruh users dari Cloud Firestore
 */
async function getUsersFromFirebase() {
  try {
    const snapshot = await withTimeout(getDocs(collection(db, 'users')), 5000);
    return snapshot.docs.map(d => d.data());
  } catch (err) {
    console.warn('[Firestore Notice] Gagal mengambil users dari Firestore:', err.message);
    return [];
  }
}

/**
 * Menyimpan komentar ke sub-koleksi laporan di Cloud Firestore
 * Path: 'reports/{reportId}/comments/{commentId}'
 */
async function syncCommentToFirebase(comment, reportId) {
  if (!comment || !comment.id || !reportId) return;
  try {
    const commentDocRef = doc(db, `reports/${reportId}/comments`, String(comment.id));
    const dataToSave = {
      id: comment.id,
      report_id: reportId,
      user_id: comment.user_id,
      sender_name: comment.sender_name,
      role: comment.role,
      message: comment.message,
      created_at: comment.created_at || new Date().toISOString()
    };
    await withTimeout(setDoc(commentDocRef, dataToSave, { merge: true }), 5000);
    console.log(`[Cloud Firestore] Komentar #${comment.id} berhasil disimpan ke laporan #${reportId}.`);
  } catch (err) {
    console.warn(`[Firestore Notice] Gagal sinkronisasi komentar #${comment.id}:`, err.message);
  }
}

/**
 * Mengambil seluruh komentar dari suatu laporan di Cloud Firestore
 */
async function getCommentsFromFirebase(reportId) {
  if (!reportId) return [];
  try {
    const snapshot = await withTimeout(getDocs(collection(db, `reports/${reportId}/comments`)), 5000);
    return snapshot.docs.map(d => d.data());
  } catch (err) {
    console.warn(`[Firestore Notice] Gagal mengambil komentar untuk laporan #${reportId}:`, err.message);
    return [];
  }
}

module.exports = {
  syncUserToFirebase,
  syncReportToFirebase,
  deleteReportFromFirebase,
  deleteUserFromFirebase,
  syncAllToFirebase,
  getReportsFromFirebase,
  getUsersFromFirebase,
  syncCommentToFirebase,
  getCommentsFromFirebase
};
