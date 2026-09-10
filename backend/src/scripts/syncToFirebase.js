const { initDatabase, queryAll } = require('../config/database');
const { syncAllToFirebase } = require('../services/firebaseService');

async function runSync() {
  console.log('=== Sinkronisasi Database ke Firebase Realtime Database ===');
  await initDatabase();
  
  const users = queryAll('SELECT id, username, full_name, role, created_at FROM users');
  const reports = queryAll('SELECT * FROM reports');

  console.log(`Ditemukan ${users.length} pengguna dan ${reports.length} laporan.`);
  await syncAllToFirebase(users, reports);
  console.log('=== Sinkronisasi Berhasil Selesai ===');
  process.exit(0);
}

runSync().catch(err => {
  console.error('Terjadi kesalahan sinkronisasi:', err);
  process.exit(1);
});
