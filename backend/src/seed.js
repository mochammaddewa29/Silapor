const bcrypt = require('bcryptjs');
const { queryOne, runQuery } = require('./config/database');

function seed() {
  // Pastikan akun admin sistem selalu tersedia dengan password yang benar
  const admin = queryOne('SELECT id, password FROM users WHERE username = ?', ['admin']);
  const hashedAdmin = bcrypt.hashSync('admin123', 10);
  
  if (!admin) {
    runQuery(
      'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)',
      ['admin', hashedAdmin, 'Administrator Sistem', 'admin']
    );
    console.log('Admin account created: admin / admin123');
  } else {
    // Jika admin ada tapi passwordnya placeholder dari Firebase, timpa ulang!
    if (admin.password === '$2a$10$defaultPasswordPlaceholderHash' || !bcrypt.compareSync('admin123', admin.password)) {
      runQuery('UPDATE users SET password = ? WHERE username = ?', [hashedAdmin, 'admin']);
      console.log('Admin password forcefully reset to: admin123');
    }
  }
}

module.exports = seed;
