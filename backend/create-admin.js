const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { db, doc, setDoc } = require('./src/config/firebase');

async function createAdmin() {
  try {
    const adminPassword = bcrypt.hashSync('admin123', 10);
    await setDoc(doc(db, 'users', '1'), {
      id: 1,
      username: 'admin',
      password: adminPassword,
      full_name: 'Administrator Sistem',
      role: 'admin',
      created_at: new Date().toISOString()
    });
    console.log('✔ Akun Admin berhasil dibuat/diperbarui di Firestore.');
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
}

createAdmin();
