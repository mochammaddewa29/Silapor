const bcrypt = require('bcryptjs');
const { queryOne, runQuery } = require('./config/database');

function seed() {
  // Hanya pastikan akun admin sistem tersedia agar tetap bisa login
  const admin = queryOne('SELECT id FROM users WHERE username = ?', ['admin']);
  if (!admin) {
    const hashedAdmin = bcrypt.hashSync('admin123', 10);
    runQuery(
      'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)',
      ['admin', hashedAdmin, 'Administrator Sistem', 'admin']
    );
    console.log('Admin account created: admin / admin123');
  }
}

module.exports = seed;
