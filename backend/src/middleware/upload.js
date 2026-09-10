const multerRaw = require('multer');
const multer = multerRaw.default || multerRaw;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const os = require('os');

// Ensure uploads directory exists in writable temp dir (works on Windows, Linux, and Vercel serverless)
const uploadDir = path.join(os.tmpdir(), 'maintenance_uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

module.exports = upload;
