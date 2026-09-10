import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  Calendar, 
  User, 
  Wrench, 
  Check, 
  AlertCircle,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Edit3,
  FileText,
  Trash2
} from 'lucide-react';
import { reportsAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import ReportDetailModal from '../components/ReportDetailModal';
import { formatDate } from '../utils/date';
import { exportReportsToPDF } from '../utils/exportPdf';

export const AdminReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal & Edit State
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (searchQuery) params.search = searchQuery;

      const data = await reportsAPI.getAll(params);
      setReports(data.reports || []);
    } catch (err) {
      console.error('Fetch all reports error:', err);
      setError('Gagal memuat data pengaduan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, categoryFilter, priorityFilter, startDate, endDate]);

  // Auto-refresh data laporan setiap 20 detik secara halus
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isModalOpen && !updatingId && document.visibilityState === 'visible') {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (categoryFilter) params.category = categoryFilter;
        if (priorityFilter) params.priority = priorityFilter;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (searchQuery) params.search = searchQuery;
        reportsAPI.getAll(params)
          .then((data) => {
            if (data?.reports) setReports(data.reports);
          })
          .catch(() => {});
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [statusFilter, categoryFilter, priorityFilter, startDate, endDate, searchQuery, isModalOpen, updatingId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setCategoryFilter('');
    setPriorityFilter('');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  const activeFilterCount = [
    statusFilter,
    categoryFilter,
    priorityFilter,
    startDate || endDate,
  ].filter(Boolean).length;

  const handleQuickStatusChange = async (reportId, newStatus) => {
    try {
      setUpdatingId(reportId);
      await reportsAPI.updateStatus(reportId, newStatus);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error('Quick status update error:', err);
      alert('Gagal mengubah status laporan.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExportingPDF(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (searchQuery) params.search = searchQuery;
      params.limit = 1000;

      const data = await reportsAPI.getAll(params);
      const listToExport = (data?.reports && data.reports.length > 0) ? data.reports : reports;

      if (!listToExport || listToExport.length === 0) {
        alert('Tidak ada data laporan yang cocok untuk diekspor ke PDF.');
        return;
      }

      exportReportsToPDF(listToExport, {
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        startDate,
        endDate,
        search: searchQuery
      });
    } catch (err) {
      console.error('Export PDF error:', err);
      alert('Gagal mengekspor data ke format PDF.');
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const blobData = await reportsAPI.exportExcel(params);
      const blob = new Blob([blobData], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `laporan-pengaduan-${today}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export Excel error:', err);
      alert('Gagal mengunduh file Excel.');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleOpenDetail = (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleDeleteReport = async (reportId, itemName) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus laporan "${itemName}" (#TKT-${String(reportId || '').padStart(5, '0')})?\n\nLaporan ini akan dihapus permanen. Jika pelapor tidak memiliki laporan lain, akun pelapor juga akan otomatis dibersihkan.`)) {
      return;
    }
    try {
      const res = await reportsAPI.delete(reportId);
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus laporan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Manajemen Laporan
            </h1>
            <span className="rounded-full bg-blue-100 dark:bg-blue-950/80 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Operasional Admin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola seluruh pengaduan, perbarui status, tugaskan teknisi, dan unduh data rekap.
          </p>
        </div>

        {/* Action Buttons: Export & Refresh */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportPDF}
            disabled={exportingPDF}
            className="flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100 active:scale-95 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 transition-all duration-200 cursor-pointer"
            title="Download Dokumen Rekap PDF"
          >
            <FileText className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <span>{exportingPDF ? 'Menyiapkan...' : 'Export PDF'}</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={exportingExcel}
            className="flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 active:scale-95 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 transition-all duration-200 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>{exportingExcel ? 'Mengunduh...' : 'Export Excel'}</span>
          </button>

          <button
            onClick={fetchReports}
            title="Perbarui Data"
            className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 shrink-0 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 p-4 text-xs font-semibold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar & Collapsible Filter */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Always Visible Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pelapor, barang, ruangan, atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 py-2 pl-10 pr-20 text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/40"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 rounded-lg bg-[#2563EB] px-3 py-1 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
            >
              Cari
            </button>
          </form>

          {/* Collapsible Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold border transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${
              activeFilterCount > 0 || isFilterOpen
                ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300'
                : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-[#334155] dark:text-slate-300'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#2563EB] text-[10px] text-white">
                {activeFilterCount}
              </span>
            )}
            {isFilterOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Collapsible Filter Panel */}
        {isFilterOpen && (
          <div className="pt-3 border-t border-slate-100 dark:border-[#334155] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-fadeIn">
            {/* Filter Status */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Semua Status</option>
                <option value="Menunggu">🟡 Menunggu</option>
                <option value="Diproses">🔵 Diproses</option>
                <option value="Selesai">🟢 Selesai</option>
                <option value="Ditolak">🔴 Ditolak</option>
              </select>
            </div>

            {/* Filter Kategori */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Kategori
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
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

            {/* Filter Prioritas */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Prioritas
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Semua Prioritas</option>
                <option value="Tinggi">🔴 Tinggi</option>
                <option value="Sedang">🟡 Sedang</option>
                <option value="Rendah">🟢 Rendah</option>
              </select>
            </div>

            {/* Date Range & Reset */}
            <div className="flex flex-col justify-end">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Rentang Tanggal
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-1/2 rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 px-2 py-1.5 text-[11px] text-slate-800 dark:text-slate-200"
                  title="Dari Tanggal"
                />
                <span className="text-slate-400 font-bold">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-1/2 rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-slate-900/60 px-2 py-1.5 text-[11px] text-slate-800 dark:text-slate-200"
                  title="Sampai Tanggal"
                />
              </div>
            </div>

            {/* Reset All Filters Button */}
            {activeFilterCount > 0 && (
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset Semua Filter</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Wide Table Layout (Clean & Spacious) */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-2.5">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-amber-400"></div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Memuat data pengaduan...
              </p>
            </div>
          </div>
        ) : reports.length > 0 ? (
          <>
            {/* Desktop Table View (lg screens and up) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#334155] bg-slate-50/70 dark:bg-slate-900/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 pl-5 pr-3">Pelapor</th>
                    <th className="py-3.5 px-3">Barang & Kategori</th>
                    <th className="py-3.5 px-3">Lokasi</th>
                    <th className="py-3.5 px-3">Status</th>
                    <th className="py-3.5 px-3">Prioritas</th>
                    <th className="py-3.5 pl-3 pr-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#334155]">
                  {reports.map((report) => (
                    <tr 
                      key={report.id} 
                      className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors duration-150"
                    >
                      {/* Pelapor */}
                      <td className="py-4 pl-5 pr-3">
                        <p className="font-bold text-slate-900 dark:text-white leading-tight">
                          {report.reporter_name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {report.division || 'Umum'} • {formatDate(report.created_at)}
                        </p>
                      </td>

                      {/* Barang & Kategori */}
                      <td className="py-4 px-3">
                        <p className="font-bold text-slate-900 dark:text-white leading-tight">
                          {report.item_name}
                        </p>
                        <span className="inline-block mt-0.5 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                          {report.category}
                        </span>
                      </td>

                      {/* Lokasi */}
                      <td className="py-4 px-3 text-slate-700 dark:text-slate-300">
                        <p className="truncate max-w-[180px] font-medium text-xs">
                          {report.location}
                        </p>
                        <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">
                          #TKT-{String(report.id || '').padStart(5, '0')}
                        </span>
                      </td>

                      {/* Status (Interactive Quick Selector) */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={report.status}
                            disabled={updatingId === report.id}
                            onChange={(e) => handleQuickStatusChange(report.id, e.target.value)}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-semibold focus:outline-none transition-colors ${
                              report.status === 'Menunggu'
                                ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                                : report.status === 'Diproses'
                                ? 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                                : report.status === 'Ditolak'
                                ? 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                                : 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            }`}
                          >
                            <option value="Menunggu">🟡 Menunggu</option>
                            <option value="Diproses">🔵 Diproses</option>
                            <option value="Selesai">🟢 Selesai</option>
                            <option value="Ditolak">🔴 Ditolak</option>
                          </select>
                        </div>
                      </td>

                      {/* Prioritas */}
                      <td className="py-4 px-3">
                        <PriorityBadge priority={report.priority} size="sm" />
                      </td>

                      {/* Aksi */}
                      <td className="py-4 pl-3 pr-5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(report)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 hover:bg-[#2563EB] text-[#2563EB] hover:text-white dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-[#2563EB] dark:hover:text-white px-3 py-1.5 text-xs font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Kelola</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReport(report.id, report.item_name)}
                            className="inline-flex items-center justify-center rounded-xl p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all duration-150 hover:scale-110"
                            title="Hapus Laporan Permanen"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Card View (< lg screens) */}
            <div className="block lg:hidden divide-y divide-slate-100 dark:divide-[#334155]">
              {reports.map((report) => (
                <div key={report.id} className="p-4 space-y-3">
                  {/* Top row: Ticket ID, Date & Priority */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-900/60">
                        #TKT-{String(report.id || '').padStart(5, '0')}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {formatDate(report.created_at)}
                      </span>
                    </div>
                    <PriorityBadge priority={report.priority} size="sm" />
                  </div>

                  {/* Middle row: Item Name & Category */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {report.item_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                        {report.category}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                        📍 {report.location}
                      </span>
                    </div>
                  </div>

                  {/* Reporter info */}
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{report.reporter_name}</span>
                    <span>•</span>
                    <span>{report.division || 'Umum'}</span>
                  </div>

                  {/* Bottom row: Status selector & Action buttons */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex-1">
                      <select
                        value={report.status}
                        disabled={updatingId === report.id}
                        onChange={(e) => handleQuickStatusChange(report.id, e.target.value)}
                        className={`w-full rounded-xl border px-2.5 py-1.5 text-xs font-bold focus:outline-none transition-colors ${
                          report.status === 'Menunggu'
                            ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                            : report.status === 'Diproses'
                            ? 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                            : report.status === 'Ditolak'
                            ? 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                            : 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        }`}
                      >
                        <option value="Menunggu">🟡 Menunggu</option>
                        <option value="Diproses">🔵 Diproses</option>
                        <option value="Selesai">🟢 Selesai</option>
                        <option value="Ditolak">🔴 Ditolak</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(report)}
                        className="inline-flex items-center gap-1 rounded-xl bg-blue-50 hover:bg-[#2563EB] text-[#2563EB] hover:text-white dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-[#2563EB] dark:hover:text-white px-3 py-1.5 text-xs font-bold transition-all"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Kelola</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteReport(report.id, report.item_name)}
                        className="inline-flex items-center justify-center rounded-xl p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                        title="Hapus Laporan Permanen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Belum Ada Laporan
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Tidak ada pengaduan yang cocok dengan filter pencarian saat ini.
            </p>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Detail & Action Modal (for Admin Edit) */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedReport(null);
          }}
          onUpdated={fetchReports}
        />
      )}
    </div>
  );
};

export default AdminReportsPage;
