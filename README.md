# ⚡ SILAPOR - Sistem Informasi Layanan Pengaduan & Maintenance Fasilitas

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js Express" />
  <img src="https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Vercel-Deployment-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

**SILAPOR** adalah aplikasi web modern terintegrasi untuk pelaporan, pemantauan, dan manajemen perbaikan fasilitas atau barang inventaris kantor. Dirancang dengan antarmuka yang responsif, cepat, elegan, serta mendukung mode gelap/terang.

---

## 🌟 Fitur Utama

### 1. 📋 Layanan Pengaduan Cepat (Public & Authenticated)
* **Lapor Tanpa Ribet:** Karyawan / pelapor dapat langsung mengisi formulir aduan kerusakan tanpa login berbelit-belit.
* **Kategori Dinamis:** Pilihan kategori terstruktur (*Elektronik, ATK, Infrastruktur, Furniture, Jaringan*) serta dukungan **Kategori Lainnya (Custom Input)** secara fleksibel.
* **Tingkat Prioritas:** Klasifikasi aduan (*Rendah, Sedang, Tinggi / Kritis*).
* **Upload Foto Bukti:** Lampirkan foto kondisi fisik kerusakan secara langsung dengan integrasi penyimpanan Cloudinary.
* **Tanda Terima Instan (Invoice Modal):** Pengguna langsung mendapatkan nomor tiket unik (`#TKT-xxxxx`) dan invoice yang dapat langsung dicetak (*Print*).

### 2. 🔍 Tracking Tiket Publik (Cek Status)
* Lacak status penanganan kerusakan secara *real-time* hanya dengan memasukkan nomor tiket aduan.
* Tampilan visual status (*Menunggu, Diproses, Selesai, Ditolak*) beserta nama teknisi dan catatan perbaikan.

### 3. 🛡️ Dashboard & Manajemen Laporan Admin
* **Tinjauan Operasional:** Statistik komprehensif total laporan, status aktif, dan grafik tren kerusakan.
* **Update Status & Penugasan Teknisi:** Admin dapat mengubah status pengerjaan, menugaskan teknisi terkait, serta menambahkan catatan penanganan teknis.
* **Pencarian & Filter Canggih:** Filter berdasarkan status, kategori, skala prioritas, dan rentang tanggal spesifik.
* **Export PDF Resmi:** Cetak rekapitulasi data pengaduan ke dokumen A4 Landscape berformat resmi lengkap dengan kop, status berwarna, dan kolom tanda tangan.
* **Export Excel:** Ekspor seluruh laporan ke spreadsheet `.xlsx` siap olah.

### 4. ☁️ Real-time Cloud Sync & Hybrid Database
* Menggunakan **SQLite (WASM)** untuk performa query lokal yang cepat.
* Tersinkronisasi otomatis dengan **Firebase Cloud Firestore** untuk persistensi data pada lingkungan *serverless deployment* (Vercel).

---

## 🛠️ Arsitektur & Teknologi

| Bagian | Teknologi |
| --- | --- |
| **Frontend Framework** | React 19, Vite, React Router DOM |
| **Styling & UI** | Tailwind CSS v4, Lucide React Icons |
| **Dokumen & Rekap** | jsPDF, jsPDF-AutoTable (PDF Engine) |
| **Backend API** | Node.js, Express.js |
| **Database & Cache** | SQLite (sql.js / WASM Binary), Firebase Firestore |
| **Image Storage** | Cloudinary API |
| **Keamanan** | JSON Web Token (JWT), Bcrypt Password Hashing |
| **Deployment** | Vercel (Serverless Functions) |

---

## 📂 Struktur Direktori

```plaintext
Silapor/
├── api/                    # Serverless entry point untuk deployment Vercel
│   └── index.js
├── backend/                # Source code backend REST API
│   ├── src/
│   │   ├── config/         # Konfigurasi Database, Firebase, dan Cloudinary
│   │   ├── controllers/    # Handler logika endpoint (Laporan, Autentikasi, dll.)
│   │   ├── middleware/     # Auth JWT & Upload Multer
│   │   ├── routes/         # Definisi router API
│   │   ├── services/       # Sinkronisasi Firebase & Cloudinary
│   │   └── server.js       # Express server runner lokal
│   ├── .env.example
│   └── package.json
├── frontend/               # Source code antarmuka React
│   ├── src/
│   │   ├── components/     # Komponen UI (Modal, Badge, Navbar, Sidebar)
│   │   ├── context/        # State global (AuthContext, ThemeContext)
│   │   ├── pages/          # Halaman (Login, Dashboard, AdminReports, History)
│   │   ├── services/       # Axios API client
│   │   └── utils/          # Helper tanggal & generator PDF (exportPdf.js)
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── vercel.json             # Konfigurasi routing & build Vercel
└── README.md
```

---

## 🚀 Panduan Menjalankan Secara Lokal

### 1. Clone Repositori
```bash
git clone https://github.com/mochammaddewa29/Silapor.git
cd Silapor
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Sesuaikan isi .env dengan kredensial Firebase dan Cloudinary Anda
npm run dev
```
> Server backend berjalan di: `http://localhost:5000`

### 3. Setup Frontend
Buka terminal baru:
```bash
cd frontend
npm install
cp .env.example .env
# Pastikan VITE_API_URL=/api
npm run dev
```
> Buka browser di: `http://localhost:5173`

---

## 🔑 Akun Default Admin

Untuk pertama kali login sebagai Administrator:
* **Username:** `admin`
* **Password:** `admin123`

---

## 🌐 Panduan Deployment ke Vercel

Proyek ini telah dikonfigurasi menggunakan file [`vercel.json`](./vercel.json) sehingga dapat langsung dihubungkan ke Vercel:

1. **Push kode ke GitHub** (pastikan file `.env` tidak ikut ter-push).
2. Di Dashboard [Vercel](https://vercel.com), pilih **Add New Project** dan impor repositori `Silapor`.
3. Tambahkan **Environment Variables** berikut di Vercel:
   - `PORT=5000`
   - `JWT_SECRET=your_jwt_secret`
   - `FIREBASE_API_KEY=...`
   - `FIREBASE_AUTH_DOMAIN=...`
   - `FIREBASE_PROJECT_ID=...`
   - `FIREBASE_STORAGE_BUCKET=...`
   - `FIREBASE_MESSAGING_SENDER_ID=...`
   - `FIREBASE_APP_ID=...`
   - `CLOUDINARY_CLOUD_NAME=...`
   - `CLOUDINARY_API_KEY=...`
   - `CLOUDINARY_API_SECRET=...`
4. Klik **Deploy**. Vercel akan otomatis menjalankan `npm run vercel-build` dan meluncurkan aplikasi Anda secara publik!

---

## 📄 Lisensi
Hak Cipta © 2026. Dikembangkan untuk efisiensi dan transparansi operasional pemeliharaan sarana & prasarana.

<!-- trigger redeploy -->
<!-- trigger redeploy 2 -->