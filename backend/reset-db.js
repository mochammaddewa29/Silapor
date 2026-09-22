const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { db, collection, getDocs, doc, deleteDoc, setDoc } = require('./src/config/firebase');

async function resetAllData() {
  console.log('=== Memulai Pembersihan Total Database ===');

  // 1. Bersihkan file foto di folder uploads
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
    const adminPassword = bcrypt.hashSync('admin123', 10);
    await setDoc(doc(db, 'users', '1'), {
      id: 1,
      username: 'admin',
      password: adminPassword,
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
