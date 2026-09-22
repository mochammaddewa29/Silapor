# 🗺️ Flowchart Sistem Lapor JakBan

Dokumen ini memetakan seluruh alur kerja (*business workflow*) dan proses teknis pada aplikasi **Lapor JakBan**, mulai dari registrasi akun, pembuatan tiket aduan, proses penanganan oleh admin/teknisi, hingga integrasi cloud realtime.

---

## 1. Alur Utama Sistem (Overview End-to-End)

Diagram berikut menggambarkan interaksi antara **Pelapor**, **Sistem Backend / Cloud**, dan **Admin**:

```mermaid
graph TD
    classDef userClass fill:#EFF6FF,stroke:#1D4ED8,stroke-width:2px;
    classDef adminClass fill:#FEF3C7,stroke:#D97706,stroke-width:2px;
    classDef sysClass fill:#F1F5F9,stroke:#475569,stroke-width:2px;

    Start([Mulai]) --> RoleCheck{Sudah Punya Akun?}
    
    %% Alur Auth
    RoleCheck -- Belum --> Register[Registrasi Akun]:::userClass
    Register --> SendOTP[Kirim OTP ke Email via Brevo]:::sysClass
    SendOTP --> VerifyOTP{Verifikasi OTP Valid?}
    VerifyOTP -- Tidak --> Register
    VerifyOTP -- Ya --> Login[Login ke Akun]:::userClass

    RoleCheck -- Sudah --> Login
    Login --> RoleDecision{Role Pengguna?}

    %% Jalur Pelapor
    RoleDecision -- Pelapor / User --> UserDash[Halaman Riwayat / Form Lapor]:::userClass
    UserDash --> CreateReport[Isi Form Pengaduan Fasilitas]:::userClass
    CreateReport --> UploadBlob[Unggah Foto ke Vercel Blob]:::sysClass
    UploadBlob --> SaveFirestore[Simpan Tiket ke Firebase Firestore]:::sysClass
    SaveFirestore --> GetInvoice[Terbit Nomor Tiket TKT-XXXXXX]:::userClass

    %% Jalur Admin
    RoleDecision -- Admin --> AdminDash[Dashboard Statistik & Monitoring]:::adminClass
    SaveFirestore -. Realtime Update .-> AdminList[Panel Daftar Aduan Masuk]:::adminClass
    AdminList --> ReviewReport[Admin Review & Cek Kerusakan]:::adminClass
    ReviewReport --> UpdateStatus[Ubah Status: Diproses / Selesai / Ditolak]:::adminClass
    UpdateStatus --> ChatReport[Komunikasi via Live Chat Realtime]:::sysClass
    ChatReport <--> UserChat[Pelapor Pantau Progres di Riwayat]:::userClass
    
    %% Selesai
    UpdateStatus --> DoneCheck{Status Selesai?}
    DoneCheck -- Ya --> ExportData[Admin Ekspor Laporan PDF / Excel]:::adminClass
    ExportData --> Finish([Selesai])
```

---

## 2. Alur Pelapor: Pembuatan Pengaduan & Tracking

Alur detail saat seorang karyawan/pelapor melaporkan kerusakan fasilitas:

```mermaid
flowchart TD
    A([Mulai]) --> B[Buka Menu 'Buat Laporan']
    B --> C[Isi Identitas & Lokasi: Nama, Divisi, Ruangan]
    C --> D[Pilih Kategori: Elektronik, Infrastruktur, Furniture, Jaringan, Lainnya]
    D --> E[Isi Nama Barang & Deskripsi Kerusakan]
    E --> F[Pilih Tingkat Prioritas: Rendah / Sedang / Tinggi]
    F --> G{Lampirkan Foto Kerusakan?}
    
    G -- Ya --> H[Upload Foto Max 5MB]
    H --> I[Unggah ke Vercel Blob Storage]
    G -- Tidak --> J[Simpan Data Laporan]
    I --> J

    J --> K[Generate Nomor Tiket Otomatis: TKT-XXXXXX]
    K --> L[Simpan ke Firestore Collection 'reports']
    L --> M[Tampilkan Popup Tiket / Tanda Terima Resmi]
    M --> N[Opsi: Cetak Tanda Terima / Download PDF]
    N --> O[Diarahkan ke Halaman Riwayat Saya]
    O --> P[Pelapor dapat memantau Status & Chat dengan Teknisi]
    P --> Q([Selesai])
```

---

## 3. Alur Admin: Penanganan Laporan & Manajemen Data

Alur kerja petugas/admin dalam merespon dan memproses tiket aduan yang masuk:

```mermaid
flowchart TD
    A([Admin Login]) --> B[Buka Panel 'Admin Laporan']
    B --> C{Gunakan Filter?}
    
    C -- Ya --> D[Filter: Status, Kategori, Prioritas, Rentang Tanggal, atau Cari Nama]
    C -- Tidak --> E[Tampilkan Semua Tiket Terurut Terbaru]
    D --> E

    E --> F[Klik Detail Tiket]
    F --> G[Buka Modal Detail: Foto Kerusakan, Log Aktivitas, Riwayat Status]
    
    G --> H{Aksi yang Dipilih?}
    
    H -- Ubah Status --> I[Ubah Status: 'Menunggu' -> 'Diproses' -> 'Selesai' / 'Ditolak']
    H -- Ubah Prioritas --> J[Sesuaikan Prioritas Urgensi]
    H -- Koordinasi --> K[Kirim Pesan Live Chat ke Pelapor]
    H -- Hapus --> L[Konfirmasi Hapus Tiket Permanen]

    I --> M[Catat Log Aktivitas Otomatis di Database]
    J --> M
    K --> M
    L --> M

    M --> N{Butuh Rekap Data?}
    N -- Ya --> O[Pilih 'Ekspor PDF Resmi' atau 'Ekspor Excel (XLSX)']
    O --> P[File Rekapitulasi Terunduh Otomatis]
    N -- Tidak --> Q([Selesai])
    P --> Q
```

---

## 4. Alur Otentikasi & Verifikasi OTP Email

Alur keamanan akun menggunakan OTP 6-Digit via Brevo REST API:

```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna (Pelapor)
    participant Client as Frontend (Vite/React)
    participant Server as Backend (Express.js)
    participant Brevo as Email Gateway (Brevo API)
    participant DB as Cloud Firestore

    %% Registrasi
    User->>Client: Input Nama, Email, Password
    Client->>Server: POST /api/auth/register
    Server->>Server: Generate OTP 6 Digit (Exp: 5 Menit)
    Server->>Brevo: Kirim Email Template Resmi (Logo JakBan)
    Brevo-->>User: Email Masuk berisi Kode OTP 6 Digit
    Server-->>Client: Response Status: Menunggu OTP

    %% Verifikasi OTP
    User->>Client: Input Kode 6 Digit OTP
    Client->>Server: POST /api/auth/verify-otp
    alt OTP Cocok & Belum Kedaluwarsa
        Server->>DB: Simpan User Baru ke Collection 'users'
        Server-->>Client: 200 OK + JWT Token Akses
        Client-->>User: Login Berhasil, Masuk ke Dashboard
    else OTP Salah atau Kedaluwarsa
        Server-->>Client: 400 Error (Kode Tidak Valid)
        Client-->>User: Tampilkan Peringatan & Tombol Kirim Ulang
    end
```

---

## 5. Ringkasan Status & Siklus Hidup Tiket (*Ticket Lifecycle*)

| Status | Badge Warna | Makna & Tindakan |
|---|---|---|
| **Menunggu** | 🟡 Kuning | Laporan baru masuk dari pelapor, menunggu respon/tinjauan admin. |
| **Diproses** | 🔵 Biru | Laporan sudah diterima teknisi dan dalam proses perbaikan di lapangan. |
| **Selesai** | 🟢 Hijau | Kerusakan fasilitas telah berhasil diperbaiki secara tuntas. |
| **Ditolak** | 🔴 Merah | Laporan tidak valid, duplikat, atau di luar tanggung jawab fasilitas kantor. |
