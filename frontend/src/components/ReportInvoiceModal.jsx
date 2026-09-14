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
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Inisialisasi font bawaan (Roboto) untuk pdfMake di browser
if (pdfFonts && pdfFonts.pdfMake) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
}

// Helper untuk convert gambar URL (Cloudinary/Lokal) menjadi Base64 melalui Canvas
const getBase64ImageFromUrl = async (imageUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      // Mencegah memory crash di HP jika gambar terlalu besar
      const MAX_WIDTH = 800;
      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) {
         height = Math.round((height * MAX_WIDTH) / width);
         width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.7)); 
    };
    img.onerror = () => {
      console.warn("Gagal meload gambar untuk PDF, dilanjutkan tanpa gambar");
      resolve(null);
    };
    img.src = imageUrl;
  });
};

export const ReportInvoiceModal = ({ report, user, isOpen, onClose, onResetForm }) => {
  if (!isOpen || !report) return null;

  const [imgError, setImgError] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [pdfReadyData, setPdfReadyData] = React.useState(null);

  React.useEffect(() => {
    setImgError(false);
    setPdfReadyData(null);
  }, [report?.id, report?.photo_url, isOpen]);

  const ticketNumber = report?.ticket_number || `TKT-${String(report?.id || '').padStart(5, '0')}`;
  const photoFullUrl = report.photo_url ? getImageUrl(report.photo_url) : null;

  const handlePreparePDF = async () => {
    try {
      setIsExporting(true);
      
      let photoBase64 = null;
      if (photoFullUrl) {
         photoBase64 = await getBase64ImageFromUrl(photoFullUrl);
      }

      const docDefinition = {
        pageSize: 'A4',
        pageMargins: [ 40, 40, 40, 80 ],
        defaultStyle: { fontSize: 10, color: '#333333' },
        content: [
          // Header
          {
            columns: [
              {
                width: '*',
                stack: [
                  { text: 'SISTEM PENGADUAN MAINTENANCE', fontSize: 16, bold: true, color: '#1e3a8a' },
                  { text: 'Tanda Terima Permintaan Perbaikan Fasilitas', fontSize: 10, color: '#64748b', margin: [0, 4, 0, 0] }
                ]
              },
              {
                width: 'auto',
                stack: [
                  { text: 'INVOICE', fontSize: 24, bold: true, color: '#e2e8f0', alignment: 'right', characterSpacing: 2 },
                  { text: `#${ticketNumber}`, fontSize: 12, bold: true, color: '#1e40af', alignment: 'right', margin: [0, 4, 0, 0] },
                  { text: formatDateTime(report.created_at || new Date().toISOString()), fontSize: 9, color: '#94a3b8', alignment: 'right', margin: [0, 2, 0, 0] }
                ]
              }
            ],
            margin: [0, 0, 0, 20]
          },
          
          // Line separator
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: '#1e293b' }], margin: [0, 0, 0, 20] },

          // Status Board
          {
            table: {
              widths: ['*', '*', '*'],
              body: [
                [
                  { text: 'STATUS TIKET', fontSize: 9, bold: true, color: '#64748b', alignment: 'center', border: [false, false, true, false] },
                  { text: 'PRIORITAS', fontSize: 9, bold: true, color: '#64748b', alignment: 'center', border: [false, false, true, false] },
                  { text: 'KATEGORI', fontSize: 9, bold: true, color: '#64748b', alignment: 'center', border: [false, false, false, false] }
                ],
                [
                  { text: (report.status || 'Menunggu').toUpperCase(), fontSize: 11, bold: true, color: '#b45309', alignment: 'center', border: [false, false, true, false], margin: [0, 5, 0, 0] },
                  { text: (report.priority || 'Sedang').toUpperCase(), fontSize: 11, bold: true, color: report.priority === 'Tinggi' ? '#b91c1c' : (report.priority === 'Rendah' ? '#15803d' : '#b45309'), alignment: 'center', border: [false, false, true, false], margin: [0, 5, 0, 0] },
                  { text: report.category, fontSize: 11, bold: true, color: '#1e293b', alignment: 'center', border: [false, false, false, false], margin: [0, 5, 0, 0] }
                ]
              ]
            },
            layout: {
               hLineWidth: () => 0,
               vLineWidth: (i) => (i === 1 || i === 2) ? 1 : 0,
               vLineColor: () => '#e2e8f0',
               paddingLeft: () => 10,
               paddingRight: () => 10,
               paddingTop: () => 10,
               paddingBottom: () => 10
            },
            fillColor: '#f8fafc',
            margin: [0, 0, 0, 25]
          },

          { text: 'RINCIAN PELAPOR & KERUSAKAN', fontSize: 10, bold: true, color: '#0f172a', characterSpacing: 1, margin: [0, 0, 0, 10] },
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e2e8f0' }], margin: [0, 0, 0, 15] },

          {
            columns: [
              {
                width: '50%',
                stack: [
                  { text: 'Nama Pelapor', fontSize: 9, bold: true, color: '#64748b' },
                  { text: report.reporter_name || '-', fontSize: 12, bold: true, color: '#0f172a', margin: [0, 2, 0, 15] },
                  { text: 'Divisi / Unit Kerja', fontSize: 9, bold: true, color: '#64748b' },
                  { text: report.division || '-', fontSize: 12, bold: true, color: '#0f172a', margin: [0, 2, 0, 0] }
                ]
              },
              {
                width: '50%',
                stack: [
                  { text: 'Lokasi / Ruangan', fontSize: 9, bold: true, color: '#64748b' },
                  { text: report.location || '-', fontSize: 12, bold: true, color: '#0f172a', margin: [0, 2, 0, 0] }
                ]
              }
            ],
            margin: [0, 0, 0, 15]
          },
          
          // Details Box
          {
            table: {
              widths: ['*'],
              body: [
                [
                  {
                    stack: [
                      { text: 'Barang & Detail Kerusakan', fontSize: 9, bold: true, color: '#64748b', margin: [0, 0, 0, 5] },
                      { text: report.item_name || '-', fontSize: 12, bold: true, color: '#0f172a', margin: [0, 0, 0, 8] },
                      { text: report.description || '-', fontSize: 10, color: '#334155', lineHeight: 1.3 }
                    ],
                    border: [false, false, false, false],
                    fillColor: '#f8fafc',
                    margin: [15, 15, 15, 15]
                  }
                ]
              ]
            },
            layout: {
              defaultBorder: false,
            },
            margin: [0, 0, 0, 20]
          }
        ],
        
        footer: function(currentPage, pageCount) {
          return {
            margin: [40, 20, 40, 0],
            columns: [
              {
                stack: [
                  { text: 'Waktu Cetak Dokumen:', fontSize: 8, bold: true, color: '#94a3b8' },
                  { text: new Date().toLocaleString('id-ID'), fontSize: 9, color: '#0f172a', margin: [0, 2, 0, 4] },
                  { text: 'Dokumen ini dihasilkan secara otomatis oleh Sistem Informasi Pengaduan Maintenance & Fasilitas. Dokumen ini sah dan dapat digunakan sebagai tanda terima permohonan perbaikan.', fontSize: 7, color: '#94a3b8' }
                ],
                width: '70%'
              },
              {
                stack: [
                  { text: 'Petugas / Sistem', fontSize: 8, bold: true, color: '#94a3b8', alignment: 'right' },
                  { text: 'Auto-Generated', fontSize: 10, bold: true, color: '#0f172a', alignment: 'right', margin: [0, 20, 0, 0] }
                ],
                width: '30%'
              }
            ]
          };
        }
      };

      if (photoBase64) {
        docDefinition.content.push({ text: 'FOTO LAMPIRAN', fontSize: 10, bold: true, color: '#0f172a', characterSpacing: 1, margin: [0, 15, 0, 10] });
        docDefinition.content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e2e8f0' }], margin: [0, 0, 0, 15] });
        docDefinition.content.push({
          image: photoBase64,
          fit: [250, 250],
          alignment: 'center',
          margin: [0, 10, 0, 20]
        });
      }

      const fileName = `Invoice_Laporan_${ticketNumber}.pdf`;
      const pdfGenerator = pdfMake.createPdf(docDefinition);
      
      const isMobile = navigator.userAgent.match(/(iPod|iPhone|iPad|Android)/i);
      
      if (!isMobile) {
        pdfGenerator.download(fileName);
      } else {
        // Untuk safari / mobile, kita simpan blob URL ke state untuk diklik
        pdfGenerator.getBlob((blob) => {
           const blobUrl = URL.createObjectURL(blob);
           setPdfReadyData({ file: new File([blob], fileName, { type: 'application/pdf' }), blobUrl, fileName });
        });
      }
      
    } catch (err) {
      console.error('Gagal membuat PDF:', err);
      alert('Gagal menyusun PDF di browser: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleMobileDownload = async () => {
    if (!pdfReadyData) return;
    const { file, blobUrl, fileName } = pdfReadyData;

    try {
      // 1. Coba gunakan Web Share API (Sangat handal di HP Android/iOS)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Invoice Laporan Maintenance',
          text: 'Tanda Terima Laporan Maintenance'
        });
        setPdfReadyData(null);
        return;
      }
    } catch (err) {
      console.log('Share API dibatalkan atau gagal:', err);
      // Lanjut ke fallback jika dibatalkan/gagal tapi bukan karena tidak support
    }

    // 2. Fallback untuk browser yang tidak support Web Share
    const isSafari = navigator.userAgent.match(/(iPod|iPhone|iPad|Safari)/i) && !navigator.userAgent.match(/Chrome/i);
    
    if (isSafari) {
      // Safari iOS lebih suka membuka tab baru atau window.location untuk Blob
      window.open(blobUrl, '_blank');
    } else {
      // Browser lain (Android Chrome dll)
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    
    // Reset state agar tombol kembali seperti semula
    setPdfReadyData(null);
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
    <>
      <style type="text/css">
        {`
          @media print {
            body { background: white !important; }
            body * { visibility: hidden; }
            #invoice-print-area, #invoice-print-area * { visibility: visible; }
            #invoice-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 10px;
              overflow: visible !important;
              max-height: none !important;
            }
            .fixed { position: absolute !important; }
          }
        `}
      </style>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-md transition-opacity print:bg-transparent print:p-0">
        <div className="relative w-full max-w-2xl my-auto rounded-2xl sm:rounded-3xl bg-white shadow-2xl transition-all dark:bg-gray-900 dark:border dark:border-gray-700 max-h-[94vh] flex flex-col overflow-hidden print:shadow-none print:border-none print:max-w-none print:rounded-none print:m-0">
        
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

        {/* =========================================================================
            HIDDEN INVOICE TEMPLATE UNTUK PDF EKSPORT SAJA (HTML2CANVAS)
            Memaksa rasio A4 Desktop (w-[800px]) walau dibuka di HP
        ========================================================================== */}
        <div 
          id="pdf-export-template" 
          className="absolute left-[-9999px] top-[-9999px] w-[800px] bg-white p-10 text-black font-sans"
        >
          {/* Header */}
          <div className="flex justify-between items-center border-b-4 border-gray-900 pb-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400 text-blue-950 shadow-md font-black">
                <Zap className="h-10 w-10 fill-blue-950 text-blue-950" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-gray-900 uppercase">
                  Sistem Pengaduan Maintenance
                </h2>
                <p className="text-sm font-semibold text-gray-600">
                  Tanda Terima Permintaan Perbaikan Fasilitas
                </p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-black text-gray-200 uppercase tracking-widest mb-2">INVOICE</h1>
              <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-800 font-mono text-sm font-bold tracking-wider mb-2">
                #{ticketNumber}
              </span>
              <p className="text-xs text-gray-500 flex items-center justify-end gap-1 font-medium">
                <Calendar className="h-3.5 w-3.5" />
                {formatDateTime(report.created_at || new Date().toISOString())}
              </p>
            </div>
          </div>

          {/* Status Row */}
          <div className="flex items-center justify-between bg-gray-50 p-5 rounded-2xl border border-gray-200 mb-8">
            <div className="w-1/3 text-center border-r border-gray-200">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Status Tiket</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                {report.status || 'Menunggu Konfirmasi'}
              </span>
            </div>
            <div className="w-1/3 text-center border-r border-gray-200">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Prioritas Perbaikan</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg border bg-white border-gray-200 text-gray-800">
                <AlertTriangle className="h-4 w-4" />
                {report.priority || 'Sedang'}
              </span>
            </div>
            <div className="w-1/3 text-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Kategori</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-800 bg-white border border-gray-200 px-3 py-1.5 rounded-lg">
                <Tag className="h-4 w-4 text-blue-600" />
                {report.category}
              </span>
            </div>
          </div>

          {/* Content Grid */}
          <div className="mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-800 border-b border-gray-200 pb-2 mb-4">
              Rincian Pelapor & Kerusakan
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                <span className="text-xs font-bold text-gray-500 block mb-1">Nama Pelapor</span>
                <p className="font-black text-gray-900 text-lg">{report.reporter_name}</p>
              </div>
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                <span className="text-xs font-bold text-gray-500 block mb-1">Divisi / Unit Kerja</span>
                <p className="font-black text-gray-900 text-lg">{report.division || '-'}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 mb-4">
              <span className="text-xs font-bold text-gray-500 block mb-1">Lokasi / Ruangan Kerusakan</span>
              <p className="font-black text-gray-900 text-lg">{report.location}</p>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
              <span className="text-xs font-bold text-gray-500 block mb-1">Barang & Detail Kerusakan</span>
              <p className="font-black text-gray-900 text-lg mb-2">{report.item_name}</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{report.description}</p>
            </div>
          </div>

          {/* Photo Section */}
          {photoFullUrl && !imgError && (
            <div className="mb-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-800 border-b border-gray-200 pb-2 mb-4">
                Foto Lampiran Kerusakan
              </h3>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-2 bg-gray-50 max-w-sm">
                <img 
                  src={photoFullUrl} 
                  alt="Lampiran" 
                  crossOrigin="anonymous"
                  onError={() => setImgError(true)}
                  className="w-full h-auto object-contain rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 border-t-2 border-gray-900 pt-6 flex justify-between items-end">
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1">Waktu Cetak Dokumen:</p>
              <p className="text-sm font-mono text-gray-800">{new Date().toLocaleString('id-ID')}</p>
              <p className="text-[10px] text-gray-400 mt-2 max-w-sm">
                Dokumen ini dihasilkan secara otomatis oleh Sistem Informasi Pengaduan Maintenance & Fasilitas. Dokumen ini sah dan dapat digunakan sebagai tanda terima permohonan perbaikan.
              </p>
            </div>
            <div className="text-center">
                <p className="text-xs font-bold text-gray-500 mb-12">Petugas / Sistem</p>
                <p className="text-sm font-black text-gray-900 border-t border-gray-400 pt-2 inline-block px-8">Auto-Generated</p>
            </div>
          </div>
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
            {pdfReadyData ? (
              <button
                type="button"
                onClick={handleMobileDownload}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-green-600/30 hover:bg-green-700 active:scale-95 transition-all animate-pulse"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Simpan / Bagikan PDF Sekarang</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePreparePDF}
                disabled={isExporting}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Memproses PDF...</span>
                  </>
                ) : (
                  <>
                    <Printer className="h-4 w-4" />
                    <span>Unduh PDF / Cetak</span>
                  </>
                )}
              </button>
            )}

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
    </>
  );
};

export default ReportInvoiceModal;
