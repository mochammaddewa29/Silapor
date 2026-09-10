import React, { useState } from 'react';
import { X, Calendar, MapPin, Tag, User, Wrench, FileText, Check, AlertCircle, Image as ImageIcon, Building, Printer } from 'lucide-react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import ReportInvoiceModal from './ReportInvoiceModal';
import { reportsAPI, getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/date';

export const ReportDetailModal = ({ report, isOpen, onClose, onUpdated }) => {
  const { isAdmin } = useAuth();
  const [status, setStatus] = useState(report?.status || 'Menunggu');
  const [technician, setTechnician] = useState(report?.technician || '');
  const [repairNotes, setRepairNotes] = useState(report?.repair_notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  if (!isOpen || !report) return null;

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      if (status !== report.status) {
        await reportsAPI.updateStatus(report.id, status);
      }
      if (technician !== (report.technician || '')) {
        await reportsAPI.assignTechnician(report.id, technician);
      }
      if (repairNotes !== (report.repair_notes || '')) {
        await reportsAPI.addRepairNotes(report.id, repairNotes);
      }

      setSaveSuccess(true);
      if (onUpdated) {
        onUpdated();
      }
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Update failed:', err);
      setErrorMessage(err.response?.data?.error || 'Gagal menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  const photoFullUrl = getImageUrl(report.photo_url);
  const ticketNumber = `TKT-${String(report.id || '').padStart(5, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="relative w-full max-w-2xl rounded-2xl sm:rounded-3xl bg-white shadow-2xl transition-all dark:bg-gray-800 dark:border dark:border-gray-700 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-amber-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-blue-200/60 dark:border-blue-800/60 shrink-0">
              #{ticketNumber}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
              Detail Pengaduan
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1">
          {/* Main info card */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-3.5 sm:p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Barang Rusak
                </span>
                <span className="font-mono text-[10px] font-bold text-blue-700 dark:text-amber-400 bg-blue-100/70 dark:bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-200/50 dark:border-blue-800/50">
                  No. Invoice: #{ticketNumber}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mt-0.5">
                {report.item_name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-blue-500" />
                  {report.reporter_name}
                </span>
                {report.division && (
                  <span className="flex items-center gap-1">
                    <Building className="h-3.5 w-3.5 text-indigo-500" />
                    {report.division}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-rose-500" />
                  {report.location}
                </span>
                <span className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5 text-amber-500" />
                  {report.category}
                </span>
              </div>
            </div>

            <div className="flex sm:flex-col items-end gap-2">
              <StatusBadge status={report.status} size="md" />
              <PriorityBadge priority={report.priority} size="md" />
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Deskripsi Kerusakan
            </h4>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {report.description}
            </div>
          </div>

          {/* Photo */}
          {photoFullUrl ? (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Foto Bukti Kerusakan
              </h4>
              <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 flex justify-center">
                <img
                  src={photoFullUrl}
                  alt={report.item_name}
                  className="max-h-72 w-full object-contain hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 text-xs text-gray-500 border border-dashed border-gray-200 dark:border-gray-700">
              <ImageIcon className="h-4 w-4" />
              <span>Tidak ada lampiran foto untuk laporan ini.</span>
            </div>
          )}

          {/* Timeline & Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-300">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-blue-500 shrink-0" />
              <div>
                <p className="text-gray-400">Dibuat Pada</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{formatDateTime(report.created_at)}</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-gray-400">Pembaruan Terakhir</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{formatDateTime(report.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* If NOT Admin: Show technician and notes as read-only */}
          {!isAdmin && (
            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Info Penanganan Teknisi
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-400">Teknisi Bertugas</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                    {report.technician || 'Belum ditugaskan'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-400">Catatan Perbaikan</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 mt-0.5">
                    {report.repair_notes || 'Belum ada catatan perbaikan.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN ACTION PANEL */}
          {isAdmin && (
            <form onSubmit={handleSaveChanges} className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-600 animate-ping"></div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Tindakan Manajemen Admin
                  </h4>
                </div>
                {saveSuccess && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200">
                    <Check className="h-3.5 w-3.5" /> Berhasil disimpan!
                  </span>
                )}
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Update Status Laporan
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-base sm:text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="Menunggu">🟡 Menunggu</option>
                    <option value="Diproses">🔵 Diproses</option>
                    <option value="Selesai">🟢 Selesai</option>
                    <option value="Ditolak">🔴 Ditolak</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Assign Teknisi
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pak Joko / Tim Listrik"
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-base sm:text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Catatan Perbaikan / Tindak Lanjut
                </label>
                <textarea
                  rows="2"
                  placeholder="Tambahkan rincian perbaikan atau keterangan penggantian suku cadang..."
                  value={repairNotes}
                  onChange={(e) => setRepairNotes(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white p-3 text-base sm:text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto justify-center inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-4 py-3 sm:px-6 sm:py-3.5 flex flex-wrap items-center justify-between gap-2 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 rounded-b-2xl sm:rounded-b-3xl">
          <button
            type="button"
            onClick={() => setShowInvoiceModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>Lihat / Cetak Invoice</span>
          </button>
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Official Printable Invoice Modal */}
      <ReportInvoiceModal
        report={report}
        user={{ username: report.reporter_name, full_name: report.user_full_name || report.reporter_name }}
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
      />
    </div>
  );
};

export default ReportDetailModal;
