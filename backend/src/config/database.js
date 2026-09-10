const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const wasmBinary = require('./wasmBinary');
const { rtdb, firebaseConfig } = require('./firebase');
const firebaseService = require('../services/firebaseService');

const DB_PATH = path.join(__dirname, '..', '..', 'database.sqlite');

let db = null;

async function initDatabase() {
  const SQL = await initSqlJs({ wasmBinary });

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      reporter_name TEXT NOT NULL,
      division TEXT,
      location TEXT NOT NULL,
      category TEXT NOT NULL,
      item_name TEXT NOT NULL,
      description TEXT NOT NULL,
      photo_url TEXT,
      priority TEXT NOT NULL DEFAULT 'Sedang',
      status TEXT NOT NULL DEFAULT 'Menunggu',
      technician TEXT,
      repair_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS report_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      sender_name TEXT NOT NULL,
      role TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  try {
    db.run("ALTER TABLE reports ADD COLUMN division TEXT");
  } catch (e) {
    // Column already exists
  }

  // Hydrate data dari Cloud Firestore jika tersedia (mencegah data hilang saat serverless deploy / restart)
  await syncFromCloud(true);

  try {
    const cloudUsers = await firebaseService.getUsersFromFirebase();
    if (cloudUsers && cloudUsers.length > 0) {
      console.log(`[Cloud Firestore] Mengimpor ${cloudUsers.length} user dari Firestore ke database...`);
      for (const u of cloudUsers) {
        if (!u.id || !u.username) continue;
        db.run(`
          INSERT OR IGNORE INTO users (
            id, username, password, full_name, role, created_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          u.id,
          u.username,
          u.password || '$2a$10$defaultPasswordPlaceholderHash',
          u.full_name || u.username,
          u.role || 'user',
          u.created_at || new Date().toISOString()
        ]);
      }
      const maxUserRow = db.exec("SELECT MAX(id) as max_id FROM users")[0]?.values[0][0] || 0;
      db.run("INSERT OR REPLACE INTO sqlite_sequence (name, seq) VALUES ('users', ?)", [maxUserRow]);
    }
  } catch (err) {
    console.warn('[Cloud Firestore] Tidak dapat mengambil data user saat startup:', err.message);
  }

  // Auto-cleanup akun user non-admin yang sudah tidak memiliki laporan aktif
  try {
    const orphanUsersResult = db.exec(`
      SELECT u.id, u.username 
      FROM users u 
      LEFT JOIN reports r ON u.id = r.user_id 
      WHERE u.role != 'admin' AND u.username != 'admin' AND r.id IS NULL
    `);
    if (orphanUsersResult.length && orphanUsersResult[0].values.length) {
      const orphans = orphanUsersResult[0].values;
      for (const [orphanId, orphanUsername] of orphans) {
        db.run('DELETE FROM users WHERE id = ?', [orphanId]);
        if (firebaseService.deleteUserFromFirebase) {
          await firebaseService.deleteUserFromFirebase(orphanId);
        }
        console.log(`[Auto-cleanup] User #${orphanId} (${orphanUsername}) dibersihkan karena tidak memiliki laporan.`);
      }
    }
  } catch (err) {
    console.warn('[Auto-cleanup Notice] Gagal membersihkan orphan users saat startup:', err.message);
  }

  saveDatabase();
  console.log('Database SQLite initialized');
  console.log(`[Cloud Firestore] Connected to Project: ${firebaseConfig.projectId}`);
  return db;
}

let lastSyncTime = 0;
const SYNC_INTERVAL_MS = 2000; // 2 seconds cache for near instant updates

async function syncFromCloud(force = false) {
  if (!db) return;
  const now = Date.now();
  if (!force && (now - lastSyncTime < SYNC_INTERVAL_MS)) {
    return;
  }
  lastSyncTime = now;
  try {
    const cloudReports = await firebaseService.getReportsFromFirebase();
    if (Array.isArray(cloudReports)) {
      const validCloudIds = cloudReports
        .map(r => parseInt(r.id, 10))
        .filter(id => !isNaN(id) && id > 0);

      if (validCloudIds.length === 0) {
        // Jika di Firebase semua laporan dihapus, kosongkan juga di SQLite
        db.run("DELETE FROM reports;");
      } else {
        // Hapus laporan di SQLite yang sudah dihapus dari Firebase
        const placeholders = validCloudIds.map(() => '?').join(',');
        db.run(`DELETE FROM reports WHERE id NOT IN (${placeholders});`, validCloudIds);
      }

      // Masukkan / perbarui data yang ada di Firebase
      for (const r of cloudReports) {
        if (!r.id) continue;
        db.run(`
          INSERT OR REPLACE INTO reports (
            id, user_id, reporter_name, division, location, category, 
            item_name, description, photo_url, priority, status, 
            technician, repair_notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          r.id, 
          r.user_id || 1, 
          r.reporter_name || 'Anonim', 
          r.division || '', 
          r.location || '', 
          r.category || 'Lainnya', 
          r.item_name || '', 
          r.description || '', 
          r.photo_url || null, 
          r.priority || 'Sedang', 
          r.status || 'Menunggu', 
          r.technician || null, 
          r.repair_notes || null, 
          r.created_at || new Date().toISOString(), 
          r.updated_at || new Date().toISOString()
        ]);
      }

      const maxReportRow = db.exec("SELECT MAX(id) as max_id FROM reports")[0]?.values[0][0] || 0;
      db.run("INSERT OR REPLACE INTO sqlite_sequence (name, seq) VALUES ('reports', ?)", [maxReportRow]);
      
      // Auto-cleanup akun user non-admin yang tidak memiliki laporan
      try {
        const orphanUsersResult = db.exec(`
          SELECT u.id, u.username 
          FROM users u 
          LEFT JOIN reports r ON u.id = r.user_id 
          WHERE u.role != 'admin' AND u.username != 'admin' AND r.id IS NULL
        `);
        if (orphanUsersResult.length && orphanUsersResult[0].values.length) {
          for (const [orphanId, orphanUsername] of orphanUsersResult[0].values) {
            db.run('DELETE FROM users WHERE id = ?', [orphanId]);
            if (firebaseService.deleteUserFromFirebase) {
              await firebaseService.deleteUserFromFirebase(orphanId);
            }
            console.log(`[Auto-cleanup] User #${orphanId} (${orphanUsername}) dibersihkan karena tidak memiliki laporan.`);
          }
        }
      } catch (e) {}

      saveDatabase();
    }
  } catch (err) {
    console.warn('[Cloud Firestore] Gagal sinkronisasi laporan berkala:', err.message);
  }
}

function saveDatabase() {
  if (db) {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, buffer);
    } catch (err) {
      // In serverless environments (e.g. Vercel), disk writes might be read-only
      console.warn('Notice: Disk persistence skipped in read-only environment:', err.message);
    }
  }
}

function getDb() {
  return db;
}

// Helper: run a query and return all rows as array of objects
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// Helper: run a query and return first row as object
function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

// Helper: run an INSERT/UPDATE/DELETE and return changes info
function runQuery(sql, params = []) {
  db.run(sql, params);
  const lastId = db.exec("SELECT last_insert_rowid() as id")[0]?.values[0][0];
  const changes = db.getRowsModified();
  saveDatabase();
  return { lastInsertRowid: lastId, changes };
}

module.exports = { 
  initDatabase, 
  getDb, 
  saveDatabase, 
  queryAll, 
  queryOne, 
  runQuery,
  rtdb,
  firebaseConfig,
  firebaseService,
  syncFromCloud
};
