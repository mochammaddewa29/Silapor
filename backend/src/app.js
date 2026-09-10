const path = require('path');
require('dotenv').config();
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (e) {}
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./config/database');
const seed = require('./seed');

const app = express();

// Permissive CORS so Vercel and local both work effortlessly
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (from local uploads folder and OS temp upload directory)
const os = require('os');
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/uploads', express.static(path.join(os.tmpdir(), 'maintenance_uploads')));

// Lazy init DB for both local server and Vercel serverless functions
let initialized = false;
let initPromise = null;

async function ensureInitialized() {
  if (initialized) return;
  if (!initPromise) {
    initPromise = (async () => {
      await initDatabase();
      seed();
      initialized = true;
    })();
  }
  await initPromise;
}

app.use(async (req, res, next) => {
  try {
    await ensureInitialized();
    next();
  } catch (err) {
    console.error('Failed to initialize database:', err);
    next(err);
  }
});

// API Routes (mounted on both /api/... and root /... for maximum compatibility)
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');

const authMiddleware = (authRoutes && authRoutes.default) ? authRoutes.default : authRoutes;
const reportMiddleware = (reportRoutes && reportRoutes.default) ? reportRoutes.default : reportRoutes;

app.use('/api/auth', authMiddleware);
app.use('/auth', authMiddleware);

app.use('/api/reports', reportMiddleware);
app.use('/reports', reportMiddleware);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Sistem Pengaduan Maintenance API berjalan' });
});
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Sistem Pengaduan Maintenance API berjalan' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Ukuran file maksimal 5MB.' });
  }
  if (err.message && err.message.includes('Format file')) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Terjadi kesalahan internal server.' });
});

app.app = app;
app.ensureInitialized = ensureInitialized;
module.exports = app;
