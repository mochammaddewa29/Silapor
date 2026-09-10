import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Eye, 
  MapPin, 
  Calendar, 
  RefreshCw,
  AlertCircle,
  FileQuestion,
  Filter,
  ImageIcon,
  Printer,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { reportsAPI, getImageUrl } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import ReportInvoiceModal from '../components/ReportInvoiceModal';
import { formatDate } from '../utils/date';
import { useAuth } from '../context/AuthContext';

export const ReportHistoryPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected report for invoice / detail modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (searchQuery) params.search = searchQuery;

      const data = await reportsAPI.getAll(params);
      setReports(data.reports || []);
    } catch (err) {
      console.error('Fetch reports error:', err);
      setError('Gagal memuat riwayat pengaduan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const handleOpenInvoice = (report) => {
    setSelectedReport(report);
    setIsInvoiceOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Riwayat Laporan Saya
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pantau status penanganan dan hasil perbaikan fasilitas yang Anda ajukan.
          </p>
        </div>

        <button
          onClick={() => navigate('/lapor')}
          className="w-full sm:w-auto justify-center inline-flex items-center gap-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white px-4 py-2.5 text-xs font-bold shadow-sm shadow-blue-500/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>+ Buat Laporan Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { label: 'Semua Status', value: '' },
              { label: 'Menunggu', value: 'Menunggu' },
              { label: 'Diproses', value: 'Diproses' },
              { label: 'Selesai', value: 'Selesai' },
              { label: 'Ditolak', value: 'Ditolak' },
            ].map((pill) => (
              <button
                key={pill.value}
                onClick={() => setStatusFilter(pill.value)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  statusFilter === pill.value
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari barang atau lokasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 py-2 pl-9 pr-3 text-base sm:text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/40"
              />
            </form>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-auto rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-base sm:text-xs text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Semua Kategori</option>
              <option value="Elektronik">Elektronik</option>
              <option value="ATK">ATK</option>
              <option value="Infrastruktur">Infrastruktur</option>
              <option value="Furniture">Furniture</option>
              <option value="Jaringan">Jaringan</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 p-4 text-xs font-semibold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Reports Card Grid (Clean & Spacious Card View) */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2.5">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-amber-400"></div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Memuat riwayat pengaduan Anda...
            </p>
          </div>
        </div>
      ) : reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map((report) => {
            const photoUrl = report.photo_url ? getImageUrl(report.photo_url) : null;
            const ticketNumber = `TKT-${String(report.id || '').padStart(5, '0')}`;

            return (
              <div
                key={report.id}
                className="group rounded-2xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Card Header: Ticket No & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200/60 dark:border-blue-800/60">
                      #{ticketNumber}
                    </span>
                    <StatusBadge status={report.status} size="sm" />
                  </div>

                  {/* Item Name & Category */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {report.item_name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-block rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        {report.category}
                      </span>
                      <PriorityBadge priority={report.priority} size="sm" />
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {report.description}
                  </p>

                  {/* Optional Photo Thumbnail */}
                  {photoUrl && (
                    <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 h-28 w-full">
                      <img 
                        src={photoUrl} 
                        alt="Bukti Kerusakan" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  {/* Location & Date */}
                  <div className="pt-2 border-t border-slate-100 dark:border-[#334155] space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{report.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{formatDate(report.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#334155]">
                  <button
                    type="button"
                    onClick={() => handleOpenInvoice(report)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-[#2563EB] text-slate-700 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-[#2563EB] dark:hover:text-white py-2 text-xs font-bold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Lihat Bukti Tanda Terima / Invoice</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#2563EB] dark:text-blue-400 mb-3.5">
            <FileQuestion className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Belum Ada Laporan
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            {searchQuery || statusFilter || categoryFilter
              ? 'Tidak ada pengaduan yang sesuai dengan filter yang Anda tentukan.'
              : 'Anda belum memiliki riwayat pengaduan. Buat laporan jika menemukan kerusakan fasilitas.'}
          </p>
          <button
            onClick={() => navigate('/lapor')}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Buat Laporan Sekarang</span>
          </button>
        </div>
      )}

      {/* Official Printable Invoice Modal */}
      {selectedReport && (
        <ReportInvoiceModal
          report={selectedReport}
          user={user}
          isOpen={isInvoiceOpen}
          onClose={() => {
            setIsInvoiceOpen(false);
            setSelectedReport(null);
          }}
        />
      )}
    </div>
  );
};

export default ReportHistoryPage;
