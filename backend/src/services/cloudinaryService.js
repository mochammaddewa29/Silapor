const cloudinary = require('../config/cloudinary');
const fs = require('fs');

/**
 * Mengunggah file gambar ke Cloudinary
 * @param {string} filePath - Path file lokal dari multer
 * @param {string} folder - Nama folder di Cloudinary
 * @returns {Promise<string|null>} Secure HTTPS URL dari Cloudinary
 */
async function uploadToCloudinary(filePath, folder = 'maintenance_reports') {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('[Cloudinary Notice] Kredensial Cloudinary belum diatur. Menggunakan foto lokal.');
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'image'
    });

    console.log('[Cloudinary] Gambar berhasil diunggah ke Cloudinary:', result.secure_url);

    // Hapus file sementara di disk server lokal setelah berhasil diunggah ke Cloudinary
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {}

    return result.secure_url;
  } catch (err) {
    console.error('[Cloudinary Upload Error]:', err.message);
    return null;
  }
}

module.exports = {
  uploadToCloudinary
};
