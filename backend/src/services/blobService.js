const { put, del } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

/**
 * Mengunggah file ke Vercel Blob storage
 * @param {string} filePath - Path file sementara dari multer
 * @param {string} folder - Nama folder/prefix (misal: 'maintenance_reports', 'user_avatars')
 * @returns {Promise<string|null>} Public URL HTTPS dari Vercel Blob
 */
async function uploadToBlob(filePath, folder = 'maintenance_reports') {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  try {
    if (!filePath || !fs.existsSync(filePath)) {
      console.warn('[Vercel Blob] File lokal tidak ditemukan:', filePath);
      return null;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileName = `${folder}/${path.basename(filePath)}`;

    const blobOptions = {
      access: 'public'
    };

    if (token) {
      blobOptions.token = token;
    }

    const blob = await put(fileName, fileBuffer, blobOptions);
    console.log('[Vercel Blob] File berhasil diunggah ke Vercel Blob:', blob.url);

    // Hapus file sementara di disk lokal
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {}

    return blob.url;
  } catch (err) {
    console.error('[Vercel Blob Upload Error]:', err.message);
    return null;
  }
}

/**
 * Menghapus file dari Vercel Blob storage berdasarkan URL
 * @param {string} blobUrl - URL file di Vercel Blob
 * @returns {Promise<boolean>} true jika berhasil, false jika gagal
 */
async function deleteFromBlob(blobUrl) {
  if (!blobUrl) return false;

  // Hanya hapus kalau URL memang dari Vercel Blob
  if (!blobUrl.includes('vercel-storage.com') && !blobUrl.includes('blob.vercel-storage')) {
    console.warn('[Vercel Blob] URL bukan dari Vercel Blob, skip delete:', blobUrl);
    return false;
  }

  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const delOptions = token ? { token } : {};
    await del(blobUrl, delOptions);
    console.log('[Vercel Blob] File berhasil dihapus:', blobUrl);
    return true;
  } catch (err) {
    console.error('[Vercel Blob Delete Error]:', err.message);
    return false;
  }
}

module.exports = {
  uploadToBlob,
  deleteFromBlob
};
