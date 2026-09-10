const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { initDatabase, getDb, saveDatabase } = require('./src/config/database');
const { db, collection, getDocs, doc, deleteDoc, setDoc } = require('./src/config/firebase');

async function resetAllData() {
  console.log('=== Memulai Pembersihan Total Database ===');
  await initDatabase();
  const sqlite = getDb();

  // 1. Kosongkan seluruh laporan di SQLite
  sqlite.run("DELETE FROM reports;");
  try {
    sqlite.run("DELETE FROM sqlite_sequence WHERE name='reports';");
  } catch (e) {}
  console.log('✔ Seluruh data laporan berhasil dihapus dari SQLite.');

  // 2. Bersihkan seluruh user dan sisakan hanya akun master admin di SQLite
  sqlite.run("DELETE FROM users WHERE username != 'admin';");
  
  // Pastikan admin ada
  const checkAdmin = sqlite.exec("SELECT id FROM users WHERE username = 'admin'");
  if (!checkAdmin.length || !checkAdmin[0].values.length) {
    const hashed = bcrypt.hashSync('admin123', 10);
    sqlite.run("INSERT INTO users (id, username, password, full_name, role) VALUES (1, 'admin', ?, 'Administrator Sistem', 'admin')", [hashed]);
  } else {
    sqlite.run("UPDATE users SET id = 1 WHERE username = 'admin'");
  }
  try {
    sqlite.run("DELETE FROM sqlite_sequence WHERE name='users';");
    sqlite.run("INSERT INTO sqlite_sequence (name, seq) VALUES ('users', 1);");
  } catch (e) {}
  console.log('✔ Seluruh akun guest dibersihkan. Hanya akun Admin yang tersisa.');

  // 3. Simpan perubahan ke file database.sqlite
  saveDatabase();
  console.log('✔ File database.sqlite berhasil diperbarui.');

  // 4. Bersihkan file foto di folder uploads
  const uploadsDir = path.join(__dirname, 'uploads');
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    for (const f of files) {
      if (f !== '.gitkeep') {
        try {
          fs.unlinkSync(path.join(uploadsDir, f));
          console.log(`✔ File unggahan dihapus: ${f}`);
        } catch (e) {}
      }
    }
  }

  // 5. Kosongkan data di Cloud Firestore
  try {
    console.log('Mengosongkan koleksi di Cloud Firestore...');
    const reportsSnap = await getDocs(collection(db, 'reports'));
    for (const d of reportsSnap.docs) {
      await deleteDoc(d.ref);
    }
    const usersSnap = await getDocs(collection(db, 'users'));
    for (const d of usersSnap.docs) {
      await deleteDoc(d.ref);
    }

    // Buat ulang dokumen admin di Firestore
    await setDoc(doc(db, 'users', '1'), {
      id: 1,
      username: 'admin',
      full_name: 'Administrator Sistem',
      role: 'admin',
      created_at: new Date().toISOString()
    });
    console.log('✔ Cloud Firestore berhasil dibersihkan dan siap digunakan.');
  } catch (err) {
    console.warn('Notice Cloud Firestore:', err.message);
  }

  console.log('=== Pembersihan Database Selesai 100% ===');
  process.exit(0);
}

resetAllData().catch(err => {
  console.error('Gagal membersihkan database:', err);
  process.exit(1);
});
