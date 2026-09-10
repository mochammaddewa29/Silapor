import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  UploadCloud, 
  Clock, 
  CheckCircle2, 
  Search, 
  Lock, 
  User, 
  MapPin, 
  FileText, 
  AlertCircle, 
  X, 
  Printer, 
  Sun, 
  Moon,
  ArrowRight,
  ShieldCheck,
  Camera,
  Laptop,
  Building,
  Armchair,
  Wifi,
  HelpCircle,
  Tag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { reportsAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import ReportInvoiceModal from '../components/ReportInvoiceModal';
import { formatDate } from '../utils/date';

export const LoginPage = () => {
  // Tabs: 'create' (Buat Aduan) | 'track' (Cek Status) | 'login' (Login)
  const [activeTab, setActiveTab] = useState('create');

  // Form: Buat Aduan
  const [reporterName, setReporterName] = useState('');
  const [location, setLocation] = useState('');
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Elektronik');
  const [customCategory, setCustomCategory] = useState('');
  const [priority, setPriority] = useState('Sedang');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const categories = [
    { name: 'Elektronik', icon: Laptop },
    { name: 'ATK', icon: FileText },
    { name: 'Infrastruktur', icon: Building },
    { name: 'Furniture', icon: Armchair },
    { name: 'Jaringan', icon: Wifi },
    { name: 'Lainnya', icon: HelpCircle },
  ];

  const priorities = [
    { level: 'Rendah', color: 'border-emerald-400 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-300', desc: 'Bisa ditunda' },
    { level: 'Sedang', color: 'border-amber-400 text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300', desc: 'Dalam 1-2 hari' },
    { level: 'Tinggi', color: 'border-rose-500 text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-300', desc: 'Mendesak / Kritis' },
  ];

  // Form: Cek Status
  const [trackTicketId, setTrackTicketId] = useState('');
  const [trackedReport, setTrackedReport] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');

  // Form: Login
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // General State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Invoice Modal State
  const [submittedReport, setSubmittedReport] = useState(null);
  const [submittedUser, setSubmittedUser] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);

  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Photo change handler
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran foto maksimal 5MB.');
        return;
      }
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
  };

  // Submit Buat Aduan (Direct Report)
  const handleDirectReportSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!reporterName.trim() || !location.trim() || !description.trim()) {
      setError('Mohon lengkapi Nama, Lokasi, dan Deskripsi kerusakan.');
      return;
    }

    if ((category === 'Lainnya' || category.startsWith('Lainnya')) && !customCategory.trim()) {
      setError('Mohon sebutkan nama kategori lainnya.');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('reporter_name', reporterName.trim());
      formData.append('division', 'Umum');
      formData.append('location', location.trim());
      const finalCategory = (category === 'Lainnya' || category.startsWith('Lainnya'))
        ? (customCategory.trim() ? `Lainnya: ${customCategory.trim()}` : 'Lainnya')
        : (category || 'Elektronik');
      formData.append('category', finalCategory);
      formData.append('item_name', itemName.trim() || 'Fasilitas / Peralatan');
      formData.append('description', description.trim());
      formData.append('priority', priority || 'Sedang');
      if (photo) {
        formData.append('photo', photo);
      }

      const res = await reportsAPI.directReport(formData);

      setSubmittedReport({
        ...res.report,
        photo_url: res.report?.photo_url || photoPreview
      });
      setSubmittedUser(res.user);
      setShowInvoice(true);

      // Reset form fields
      setReporterName('');
      setLocation('');
      setItemName('');
      setDescription('');
      setCategory('Elektronik');
      setCustomCategory('');
      setPhoto(null);
      setPhotoPreview(null);
    } catch (err) {
      console.error('Direct report submit error:', err);
      setError(err.response?.data?.error || 'Gagal mengirim pengaduan. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Cek Status
  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    const rawInput = trackTicketId.trim();
    if (!rawInput) {
      setTrackError('Silakan masukkan nomor tiket Anda.');
      return;
    }

    setTrackLoading(true);
    setTrackError('');
    setTrackedReport(null);

    try {
      const cleanInput = rawInput.replace(/^#/, '').replace(/^TKT-/i, '').trim();
      const data = await reportsAPI.trackTicket(cleanInput);
      setTrackedReport(data);
    } catch (err) {
      console.error('Track ticket error:', err);
      setTrackError(err.response?.data?.error || 'Nomor tiket tidak ditemukan. Pastikan nomor tiket Anda benar.');
    } finally {
      setTrackLoading(false);
    }
  };

  // Submit Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(loginUsername, loginPassword);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      if (!err.response) {
        setError('Gagal terhubung ke server backend. Periksa koneksi internet Anda.');
      } else {
        setError(err.response?.data?.error || 'Username atau password salah.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] flex flex-col lg:grid lg:grid-cols-12 transition-colors duration-200">
      
      {/* ─────────────────────────────────────────────────────────────
          BAGIAN KIRI (Branding + Informasi Singkat - PLN Style)
         ───────────────────────────────────────────────────────────── */}
      <div className="lg:col-span-5 xl:col-span-5 bg-gradient-to-br from-[#0B1E3F] via-[#0E2A59] to-[#1E88E5] text-white p-4 sm:p-7 lg:p-12 flex flex-col justify-between relative overflow-hidden">
        
        {/* Subtle decorative glow circles */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-blue-400/15 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#FFC107]/15 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-3.5 sm:space-y-6 lg:space-y-8">
          {/* Logo & Application Name */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-[#FFC107] text-[#0B1E3F] shadow-lg shadow-amber-500/20 font-black">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 fill-[#0B1E3F] text-[#0B1E3F]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg sm:text-xl font-black tracking-wider text-white">SI</span>
                  <span className="rounded bg-[#FFC107] px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase text-[#0B1E3F]">
                    LAPOR
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] font-medium text-blue-200">
                  Maintenance & Kerusakan Fasilitas
                </p>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Mode Terang' : 'Mode Gelap'}
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors duration-200"
            >
              {isDark ? <Sun className="h-4 w-4 text-[#FFC107]" /> : <Moon className="h-4 w-4 text-blue-200" />}
            </button>
          </div>

          {/* Headline & Subtext */}
          <div className="pt-1 sm:pt-4 lg:pt-8 space-y-1.5 sm:space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold text-blue-100 backdrop-blur-sm border border-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFC107] animate-pulse"></span>
              Portal Resmi Pemeliharaan
            </span>
            <h1 className="text-xl sm:text-2xl lg:text-4xl font-black tracking-tight leading-snug sm:leading-tight text-white">
              Layanan Pengaduan Cepat & Terintegrasi
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-md hidden sm:block">
              Laporkan kendala fasilitas kantor dengan mudah, pantau progres penanganan teknisi secara transparan, dan dapatkan bukti invoice instan.
            </p>
          </div>

          {/* 3 Bullet Points: Compact chips on mobile, detailed cards on desktop */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 lg:flex-col lg:space-y-3.5 max-w-md pt-1">
            <div className="flex items-center gap-2 lg:gap-3.5 rounded-xl lg:rounded-2xl bg-white/10 px-2.5 py-1.5 lg:p-3.5 backdrop-blur-xs border border-white/10">
              <div className="flex h-6 w-6 lg:h-10 lg:w-10 items-center justify-center rounded-lg lg:rounded-xl bg-[#FFC107] text-[#0B1E3F] shrink-0 font-bold shadow-sm">
                <Zap className="h-3 w-3 lg:h-5 lg:w-5 fill-[#0B1E3F]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] lg:text-xs font-bold text-white">Lapor Cepat</p>
                <p className="text-[10px] text-blue-100/80 hidden lg:block">Tanpa birokrasi berbelit, langsung ke teknisi.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-3.5 rounded-xl lg:rounded-2xl bg-white/10 px-2.5 py-1.5 lg:p-3.5 backdrop-blur-xs border border-white/10">
              <div className="flex h-6 w-6 lg:h-10 lg:w-10 items-center justify-center rounded-lg lg:rounded-xl bg-sky-400 text-[#0B1E3F] shrink-0 font-bold shadow-sm">
                <Camera className="h-3 w-3 lg:h-5 lg:w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] lg:text-xs font-bold text-white">Upload Foto</p>
                <p className="text-[10px] text-blue-100/80 hidden lg:block">Lampirkan foto visual kerusakan fasilitas.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-3.5 rounded-xl lg:rounded-2xl bg-white/10 px-2.5 py-1.5 lg:p-3.5 backdrop-blur-xs border border-white/10">
              <div className="flex h-6 w-6 lg:h-10 lg:w-10 items-center justify-center rounded-lg lg:rounded-xl bg-emerald-400 text-[#0B1E3F] shrink-0 font-bold shadow-sm">
                <Clock className="h-3 w-3 lg:h-5 lg:w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] lg:text-xs font-bold text-white">Tracking Status</p>
                <p className="text-[10px] text-blue-100/80 hidden lg:block">Pantau tiket real-time hingga selesai.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="relative z-10 pt-4 lg:pt-8 mt-4 lg:mt-6 border-t border-white/10 text-[10px] sm:text-[11px] text-blue-200/80 hidden lg:flex items-center justify-between">
          <span>© 2026 Sistem Pengaduan Maintenance</span>
          <span className="font-semibold text-white">Respon Tanggap 24/7</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BAGIAN KANAN (Form Area: Buat Aduan / Cek Status / Login)
         ───────────────────────────────────────────────────────────── */}
      <div className="lg:col-span-7 xl:col-span-7 p-3 sm:p-6 lg:p-12 flex items-center justify-center">
        <div className="w-full max-w-lg space-y-4 sm:space-y-6">
          
          {/* Card Container */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-[#334155] bg-white dark:bg-[#1E293B] p-4 sm:p-7 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all duration-200">
            
            {/* Tab Header Sederhana */}
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('create');
                  setError('');
                }}
                className={`rounded-lg py-2 text-xs font-bold transition-all duration-200 ${
                  activeTab === 'create'
                    ? 'bg-white dark:bg-[#0B1E3F] text-[#0B1E3F] dark:text-[#FFC107] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Buat Aduan
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('track');
                  setError('');
                }}
                className={`rounded-lg py-2 text-xs font-bold transition-all duration-200 ${
                  activeTab === 'track'
                    ? 'bg-white dark:bg-[#0B1E3F] text-[#0B1E3F] dark:text-[#FFC107] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Cek Status
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setError('');
                }}
                className={`rounded-lg py-2 text-xs font-bold transition-all duration-200 ${
                  activeTab === 'login'
                    ? 'bg-white dark:bg-[#0B1E3F] text-[#0B1E3F] dark:text-[#FFC107] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Login
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ── TAB 1: BUAT ADUAN (Default) ── */}
            {activeTab === 'create' && (
              <form onSubmit={handleDirectReportSubmit} className="space-y-4 animate-fadeIn">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    Form Pengaduan Kerusakan
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Isi informasi berikut untuk mengirim laporan perbaikan langsung ke teknisi.
                  </p>
                </div>

                {/* Nama Pelapor */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Anda *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#1E88E5] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
                  />
                </div>

                {/* Lokasi / Ruangan */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Lokasi / Ruangan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Lantai 2, Ruang Rapat 201"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#1E88E5] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
                  />
                </div>

                {/* Kategori Barang Rusak */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kategori Barang Rusak *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      const isLainnya = cat.name === 'Lainnya';
                      const isSelected = isLainnya
                        ? (category === 'Lainnya' || category.startsWith('Lainnya'))
                        : category === cat.name;
                      return (
                        <button
                          type="button"
                          key={cat.name}
                          onClick={() => setCategory(cat.name)}
                          className={`flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? 'border-[#1E88E5] bg-blue-50 text-[#0B1E3F] shadow-xs ring-2 ring-blue-500/20 dark:bg-blue-950/60 dark:border-blue-500 dark:text-blue-200 font-bold'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-slate-50 dark:border-[#334155] dark:bg-slate-900/60 dark:text-slate-300'
                          }`}
                        >
                          <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${isSelected ? 'text-[#1E88E5] dark:text-[#FFC107]' : 'text-slate-400'}`} />
                          <span className="text-[11px] sm:text-xs truncate">{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Input Kategori Lainnya (Muncul tepat di bawahnya jika Lainnya dipilih) */}
                  {(category === 'Lainnya' || category.startsWith('Lainnya')) && (
                    <div className="mt-2.5 p-3 rounded-2xl border border-blue-200/90 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/30 transition-all duration-200 animate-in fade-in slide-in-from-top-1">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5 text-[#1E88E5] dark:text-amber-400" />
                          Sebutkan Kategori Barang / Fasilitas Lainnya <span className="text-rose-500">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Sanitasi, Pipa Air, Genset, Kendaraan, CCTV..."
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        autoFocus
                        maxLength={50}
                        className="w-full rounded-xl border border-blue-300/80 dark:border-blue-800 bg-white dark:bg-slate-900 px-3 py-2 text-base sm:text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#1E88E5] focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/40"
                      />

                      {/* Quick Chips */}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Pilihan cepat:</span>
                        {['Sanitasi & Plumbing', 'Kelistrikan & Genset', 'Kendaraan Operasional', 'Keamanan / CCTV', 'Kebersihan'].map((rec) => (
                          <button
                            type="button"
                            key={rec}
                            onClick={() => setCustomCategory(rec)}
                            className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                              customCategory === rec
                                ? 'border-blue-500 bg-blue-100 text-blue-800 font-bold dark:bg-blue-900/60 dark:border-blue-400 dark:text-blue-200'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {rec}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Nama Barang */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Barang / Fasilitas
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: AC Split / Monitor Komputer"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#1E88E5] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
                  />
                </div>

                {/* Deskripsi Singkat */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Deskripsi Singkat Kerusakan *
                  </label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Jelaskan kondisi kerusakan atau kendala yang terjadi..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 p-3 text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#1E88E5] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 resize-none"
                  ></textarea>
                </div>

                {/* Tingkat Prioritas */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tingkat Prioritas Penanganan *
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {priorities.map((item) => {
                      const isSelected = priority === item.level;
                      return (
                        <button
                          type="button"
                          key={item.level}
                          onClick={() => setPriority(item.level)}
                          className={`flex flex-col p-2 sm:p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? `${item.color} ring-2 ring-blue-500/20 shadow-xs font-bold`
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-[#334155] dark:bg-slate-900/60 dark:text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] sm:text-xs font-bold">{item.level}</span>
                            {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-current"></span>}
                          </div>
                          <p className="text-[9px] sm:text-[10px] mt-0.5 opacity-80 line-clamp-1">{item.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Upload Foto */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Upload Foto Bukti (Opsional)
                  </label>
                  {photoPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900 h-32 w-full flex items-center justify-center">
                      <img src={photoPreview} alt="Preview Bukti" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute top-2 right-2 rounded-full bg-slate-900/80 p-1 text-white hover:bg-rose-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/80 transition-colors duration-200">
                      <UploadCloud className="h-6 w-6 text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Klik untuk memilih foto kerusakan
                      </span>
                      <span className="text-[10px] text-slate-400">JPG, PNG atau WebP (Maks. 5MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Tombol Utama (Kuning PLN) */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#FFC107] hover:bg-[#FFB300] text-[#0B1E3F] py-3 px-4 text-sm font-black shadow-md shadow-amber-500/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  <Zap className="h-4 w-4 fill-[#0B1E3F]" />
                  <span>{loading ? 'Mengirim Aduan...' : 'Kirim Laporan'}</span>
                </button>
              </form>
            )}

            {/* ── TAB 2: CEK STATUS ── */}
            {activeTab === 'track' && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    Cek Status Pengaduan
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Masukkan nomor tiket untuk melacak progres perbaikan barang Anda.
                  </p>
                </div>

                <form onSubmit={handleTrackSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor Tiket Aduan
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Contoh: #TKT-00001 atau 1"
                        value={trackTicketId}
                        onChange={(e) => setTrackTicketId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 py-2.5 pl-10 pr-3.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#1E88E5] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={trackLoading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E88E5] hover:bg-blue-700 text-white py-2.5 px-4 text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  >
                    <Search className="h-4 w-4" />
                    <span>{trackLoading ? 'Mencari Tiket...' : 'Cek Status'}</span>
                  </button>
                </form>

                {/* Error Box */}
                {trackError && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{trackError}</span>
                  </div>
                )}

                {/* Result Card */}
                {trackedReport && (
                  <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/70 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-[#334155] pb-2.5">
                      <span className="font-mono text-xs font-bold text-[#1E88E5] dark:text-blue-400">
                        #TKT-{String(trackedReport.id || '').padStart(5, '0')}
                      </span>
                      <StatusBadge status={trackedReport.status} size="sm" />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {trackedReport.item_name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {trackedReport.location} • {formatDate(trackedReport.created_at)}
                      </p>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/60 leading-relaxed">
                      {trackedReport.description}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSubmittedReport(trackedReport);
                        setShowInvoice(true);
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-[#1E88E5] hover:text-white text-slate-700 dark:text-slate-300 py-2 text-xs font-bold transition-colors"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Lihat Bukti Tanda Terima / Invoice</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 3: LOGIN ── */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fadeIn">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    Masuk ke Sistem
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Masuk dengan akun Anda untuk memantau seluruh riwayat atau mengelola operasional.
                  </p>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Masukkan username Anda"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 py-2.5 pl-10 pr-3.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#1E88E5] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 py-2.5 pl-10 pr-3.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#1E88E5] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
                    />
                  </div>
                </div>

                {/* Tombol Masuk (Biru Terang PLN) */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E88E5] hover:bg-blue-700 text-white py-3 px-4 text-sm font-bold shadow-md shadow-blue-500/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span>{loading ? 'Memproses...' : 'Masuk'}</span>
                </button>

                {/* Link Kecil */}
                <div className="pt-2 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Belum punya akun?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('create')}
                      className="font-bold text-[#1E88E5] hover:underline dark:text-blue-400"
                    >
                      Langsung Buat Aduan
                    </button>
                  </p>
                </div>
              </form>
            )}

          </div>

          {/* Clean Quick Footer info */}
          <p className="text-center text-xs text-slate-400 dark:text-slate-500">
            Sistem Informasi Pengaduan & Layanan Maintenance Terpadu
          </p>
        </div>
      </div>

      {/* Official Printable Invoice Modal */}
      {submittedReport && (
        <ReportInvoiceModal
          report={submittedReport}
          user={submittedUser}
          isOpen={showInvoice}
          onClose={() => {
            setShowInvoice(false);
            setSubmittedReport(null);
            setSubmittedUser(null);
          }}
        />
      )}
    </div>
  );
};

export default LoginPage;
