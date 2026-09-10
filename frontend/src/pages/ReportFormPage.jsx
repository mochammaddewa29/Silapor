import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  UploadCloud, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  User, 
  Tag, 
  Laptop, 
  FileText, 
  Building, 
  Armchair, 
  Wifi, 
  HelpCircle,
  AlertTriangle,
  Printer
} from 'lucide-react';
import { reportsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReportInvoiceModal from '../components/ReportInvoiceModal';

export const ReportFormPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reporterName, setReporterName] = useState(user?.full_name || '');
  const [division, setDivision] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Elektronik');
  const [customCategory, setCustomCategory] = useState('');
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Sedang');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const categories = [
    { name: 'Elektronik', icon: Laptop, desc: 'AC, TV, PC, Proyektor' },
    { name: 'ATK', icon: FileText, desc: 'Printer, Kertas, Mesin Tik' },
    { name: 'Infrastruktur', icon: Building, desc: 'Lampu, Kran, Pintu, Atap' },
    { name: 'Furniture', icon: Armchair, desc: 'Meja, Kursi, Lemari' },
    { name: 'Jaringan', icon: Wifi, desc: 'WiFi, Router, Kabel LAN' },
    { name: 'Lainnya', icon: HelpCircle, desc: 'Kerusakan umum lainnya' },
  ];

  const priorities = [
    { level: 'Rendah', color: 'border-emerald-400 text-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 dark:text-emerald-300', desc: 'Bisa ditunda, tidak mengganggu operasional' },
    { level: 'Sedang', color: 'border-amber-400 text-amber-700 bg-amber-50/50 dark:bg-amber-950/20 dark:text-amber-300', desc: 'Perlu diperbaiki segera dalam 1-2 hari' },
    { level: 'Tinggi', color: 'border-rose-500 text-rose-700 bg-rose-50/50 dark:bg-rose-950/20 dark:text-rose-300', desc: 'Kritis! Menghentikan pekerjaan operasional' },
  ];

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!reporterName || !location || !category || !itemName || !description) {
      setError('Mohon lengkapi semua field yang berbintang (*).');
      return;
    }

    if ((category === 'Lainnya' || category.startsWith('Lainnya')) && !customCategory.trim()) {
      setError('Mohon sebutkan nama kategori lainnya.');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('reporter_name', reporterName);
      formData.append('division', division);
      formData.append('location', location);
      const finalCategory = (category === 'Lainnya' || category.startsWith('Lainnya'))
        ? (customCategory.trim() ? `Lainnya: ${customCategory.trim()}` : 'Lainnya')
        : (category || 'Elektronik');
      formData.append('category', finalCategory);
      formData.append('item_name', itemName);
      formData.append('description', description);
      formData.append('priority', priority);
      if (photo) {
        formData.append('photo', photo);
      }

      const createdReport = await reportsAPI.create(formData);
      setSubmittedReport({
        ...createdReport,
        photo_url: createdReport?.photo_url || photoPreview
      });
      setSuccess(true);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.error || 'Gagal mengirim laporan pengaduan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white p-4 sm:p-8 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-black shadow-md shadow-blue-500/30 shrink-0">
            <PlusCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white">
              Form Pengaduan Kerusakan Barang
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Isi data lengkap di bawah ini agar tim teknisi dapat segera menindaklanjuti pengaduan Anda.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Modal Notification */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 text-center shadow-2xl dark:bg-gray-800 dark:border dark:border-gray-700 animate-scaleUp">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-4">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">
              Laporan Berhasil Terkirim!
            </h3>

            {/* Nomor Invoice / Tiket Card */}
            <div className="my-3.5 p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium block">
                Nomor Invoice / Tiket Resmi Anda:
              </span>
              <span className="font-mono text-xl font-black text-blue-700 dark:text-amber-400 tracking-wider">
                #TKT-{String(submittedReport?.id || '').padStart(5, '0')}
              </span>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Pengaduan Anda telah tercatat dengan status <span className="font-bold text-amber-500">Menunggu</span>. Teknisi akan segera memeriksa dan menindaklanjuti.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowInvoiceModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 py-3 text-xs font-black text-blue-950 shadow-md shadow-amber-400/20 active:scale-95 transition-all"
              >
                <Printer className="h-4 w-4" />
                <span>Lihat / Cetak Bukti Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/riwayat')}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-bold text-white shadow-md transition-colors"
              >
                Lihat di Riwayat Laporan
              </button>
              <button
                type="button"
                onClick={() => {
                  setSuccess(false);
                  setSubmittedReport(null);
                  setItemName('');
                  setDescription('');
                  setLocation('');
                  setPhoto(null);
                  setPhotoPreview(null);
                }}
                className="w-full rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-750 transition-colors"
              >
                Buat Laporan Lainnya
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-3xl bg-white p-4 sm:p-8 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 space-y-6">
          {/* Section 1: Pelapor, Divisi & Lokasi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Nama Pelapor <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Nama lengkap Anda"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-base sm:text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Nama Divisi / Unit Kerja <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Divisi IT / Keuangan"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-base sm:text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Kerusakan di Bagian Mana / Lokasi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Lt. 2 Ruang Rapat 204"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-base sm:text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Kategori Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
              Kategori Barang Rusak <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
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
                    className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-md ring-2 ring-blue-500/20 dark:bg-blue-950/60 dark:border-blue-500 dark:text-blue-200'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mb-1.5 ${isSelected ? 'text-blue-600 dark:text-amber-400' : 'text-gray-400'}`} />
                    <span className="text-xs font-bold">{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Input Kategori Lainnya (Muncul tepat di bawahnya jika Lainnya dipilih) */}
            {(category === 'Lainnya' || category.startsWith('Lainnya')) && (
              <div className="mt-3 p-3.5 rounded-2xl border border-blue-200/90 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/30 transition-all duration-200 animate-in fade-in slide-in-from-top-1">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-blue-600 dark:text-amber-400" />
                    Sebutkan Kategori Barang / Fasilitas Lainnya <span className="text-rose-500">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sanitasi, Pipa Air, Genset, Kendaraan Operasional..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  autoFocus
                  maxLength={50}
                  className="w-full rounded-xl border border-blue-300/80 dark:border-blue-800 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-base sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/40"
                />

                {/* Quick Chips */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Pilihan cepat:</span>
                  {['Sanitasi & Plumbing', 'Kelistrikan & Genset', 'Kendaraan Operasional', 'Keamanan / CCTV', 'Kebersihan'].map((rec) => (
                    <button
                      type="button"
                      key={rec}
                      onClick={() => setCustomCategory(rec)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        customCategory === rec
                          ? 'border-blue-500 bg-blue-100 text-blue-800 font-bold dark:bg-blue-900/60 dark:border-blue-400 dark:text-blue-200'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {rec}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Nama Barang & Deskripsi */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Nama / Merk Barang Rusak <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: AC Split Daikin 1.5 PK / Switch TP-Link 16 Port"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white py-2.5 px-4 text-base sm:text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Deskripsi Kerusakan Lengkap <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows="4"
                placeholder="Jelaskan kronologi kerusakan, gejala yang muncul (suara bising, mati total, berasap, bau kabel terbakar), atau tombol yang tidak berfungsi..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 bg-white p-3.5 text-base sm:text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              ></textarea>
            </div>
          </div>

          {/* Section 4: Tingkat Prioritas */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
              Tingkat Prioritas Penanganan <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {priorities.map((item) => {
                const isSelected = priority === item.level;
                return (
                  <button
                    type="button"
                    key={item.level}
                    onClick={() => setPriority(item.level)}
                    className={`flex flex-col p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? `ring-2 ring-blue-500/20 ${item.color} shadow-sm font-bold`
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{item.level}</span>
                      {isSelected && <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-amber-400"></div>}
                    </div>
                    <p className="text-[11px] mt-1 font-normal opacity-80">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Upload Foto */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Upload Foto Kerusakan (Opsional, Maks 5MB)
            </label>
            
            {photoPreview ? (
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 max-w-sm bg-gray-100 dark:bg-gray-900">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="h-48 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-rose-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="p-2 text-center text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
                  {photo?.name} ({(photo?.size / 1024).toFixed(1)} KB)
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed border-gray-300 rounded-3xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/20 dark:border-gray-600 dark:hover:border-blue-400 dark:hover:bg-gray-750 transition-all">
                <UploadCloud className="h-10 w-10 text-blue-600 dark:text-amber-400 mb-2" />
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 text-center">
                  Klik untuk unggah atau seret foto ke sini
                </p>
                <p className="text-[11px] text-gray-400 mt-1 text-center">
                  Format JPG, PNG, atau WebP (Maksimal 5MB)
                </p>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto text-center rounded-2xl border border-gray-300 bg-white px-6 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto justify-center inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-[#1E3A8A] px-8 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-blue-600/30 hover:from-blue-700 hover:to-blue-900 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-amber-400"></div>
                <span>Mengirim...</span>
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4" />
                <span>Kirim Pengaduan Sekarang</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Official Printable Invoice Modal */}
      <ReportInvoiceModal
        report={submittedReport}
        user={user}
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
      />
    </div>
  );
};

export default ReportFormPage;
