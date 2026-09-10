import React from 'react';
import { 
  Printer, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Building, 
  User, 
  Tag, 
  AlertTriangle, 
  FileText, 
  X, 
  Zap, 
  RotateCcw,
  ShieldCheck,
  Check
} from 'lucide-react';
import { formatDateTime } from '../utils/date';
import { getImageUrl } from '../services/api';

export const ReportInvoiceModal = ({ report, user, isOpen, onClose, onResetForm }) => {
  if (!isOpen || !report) return null;

  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [report?.id, report?.photo_url]);

  const ticketNumber = `TKT-${String(report.id || '').padStart(5, '0')}`;
  const photoFullUrl = report.photo_url ? getImageUrl(report.photo_url) : null;

  const handlePrint = () => {
    window.print();
  };

  const getPriorityStyle = (p) => {
    switch (p) {
      case 'Tinggi':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800';
      case 'Sedang':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-md transition-opacity">
      <div className="relative w-full max-w-2xl my-auto rounded-2xl sm:rounded-3xl bg-white shadow-2xl transition-all dark:bg-gray-900 dark:border dark:border-gray-700 max-h-[94vh] flex flex-col overflow-hidden">
        
        {/* Top Notification Bar (no-print) */}
        <div className="no-print bg-emerald-600 px-4 py-2 sm:px-6 sm:py-2.5 text-white text-xs font-semibold flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-200 shrink-0" />
            <span className="truncate sm:whitespace-normal">Laporan Terkirim! Tanda Terima (Invoice) siap.</span>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-white/80 hover:text-white p-1 rounded-full transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Printable Invoice Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 sm:space-y-6" id="invoice-print-area">
          
          {/* Invoice Header */}
          <div className="border-b-2 border-dashed border-gray-200 dark:border-gray-700 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-amber-400 text-blue-950 shadow-md font-black shrink-0">
                <Zap className="h-6 w-6 sm:h-7 sm:w-7 fill-blue-950 text-blue-950" />
              </div>
              <div>
                <h2 className="text-sm sm:text-lg font-black tracking-tight text-gray-900 dark:text-white uppercase">
                  Sistem Pengaduan Maintenance
                </h2>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Tanda Terima Permintaan Perbaikan Fasilitas
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono text-xs font-bold tracking-wider mb-1">
                #{ticketNumber}
              </span>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center sm:justify-end gap-1">
                <Calendar className="h-3 w-3" />
                {formatDateTime(report.created_at || new Date().toISOString())}
              </p>
            </div>
          </div>

          {/* Status & Priority Badge Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div>
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Status Tiket</span>
              <span className="inline-flex items-center gap-1.5 mt-0.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                {report.status || 'Menunggu Konfirmasi'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Prioritas Perbaikan</span>
              <span className={`inline-flex items-center gap-1 mt-0.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${getPriorityStyle(report.priority)}`}>
                <AlertTriangle className="h-3.5 w-3.5" />
                {report.priority || 'Sedang'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Kategori</span>
              <span className="inline-flex items-center gap-1 mt-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-600">
                <Tag className="h-3.5 w-3.5 text-blue-600" />
                {report.category}
              </span>
            </div>
          </div>

          {/* Details Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Rincian Pengaduan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/40">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <User className="h-3.5 w-3.5 text-blue-600" />
                  <span>Nama Pelapor</span>
                </div>
                <p className="font-bold text-gray-900 dark:text-white">{report.reporter_name}</p>
              </div>

              <div className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/40">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Building className="h-3.5 w-3.5 text-blue-600" />
                  <span>Divisi / Unit Kerja</span>
                </div>
                <p className="font-bold text-gray-900 dark:text-white">{report.division || '-'}</p>
              </div>

              <div className="sm:col-span-2 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/40">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <MapPin className="h-3.5 w-3.5 text-red-500" />
                  <span>Lokasi / Ruangan Kerusakan</span>
                </div>
                <p className="font-bold text-gray-900 dark:text-white">{report.location}</p>
              </div>

              <div className="sm:col-span-2 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/40">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <FileText className="h-3.5 w-3.5 text-amber-500" />
                  <span>Barang & Kerusakan</span>
                </div>
                <p className="font-bold text-gray-900 dark:text-white text-base mb-1">{report.item_name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {report.description}
                </p>
              </div>
            </div>
          </div>

          {/* Photo attachment if available */}
          {photoFullUrl && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Foto Lampiran Kerusakan
              </span>
              <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 max-w-sm">
                {imgError ? (
                  <div className="w-full h-32 flex flex-col items-center justify-center text-gray-400 bg-gray-100 dark:bg-gray-800/80 rounded-xl gap-1">
                    <FileText className="h-6 w-6 opacity-60" />
                    <span className="text-xs font-medium">Foto tidak dapat dimuat</span>
                  </div>
                ) : (
                  <img 
                    src={photoFullUrl} 
                    alt="Lampiran Kerusakan" 
                    onError={() => setImgError(true)}
                    className="w-full h-44 object-cover rounded-xl"
                  />
                )}
              </div>
            </div>
          )}

          {/* Account Tracking Note */}
          {user && (
            <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200 mb-1">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>ID Pelacakan Status Anda</span>
              </div>
              <p className="text-xs text-blue-800 dark:text-blue-300">
                Akun pelapor Anda telah dibuat dengan username: <span className="font-mono font-bold bg-white dark:bg-blue-900 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">{user.username}</span>. Anda dapat menggunakan nomor tiket atau akun ini untuk memeriksa progres perbaikan.
              </p>
            </div>
          )}

          {/* Footer Notice */}
          <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4 text-center">
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              Dokumen ini adalah tanda terima sah dari Sistem Informasi Pengaduan Maintenance & Fasilitas.
              <br />
              Waktu cetak: {new Date().toLocaleString('id-ID')}
            </p>
          </div>

        </div>

        {/* Action Bottom Bar (no-print) */}
        <div className="no-print border-t border-gray-100 bg-gray-50 px-4 py-3 sm:px-6 sm:py-4 dark:border-gray-800 dark:bg-gray-800/80 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onResetForm}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Buat Pengaduan Lain</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak Bukti (Print / PDF)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-gray-200 px-4 py-2.5 text-xs font-bold text-gray-800 hover:bg-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 transition-all"
            >
              <Check className="h-4 w-4" />
              <span>Selesai</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReportInvoiceModal;
