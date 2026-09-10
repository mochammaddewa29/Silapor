import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from './date';

export const exportReportsToPDF = (reports = [], filters = {}) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Helper for autoTable invocation compatibility
  const runAutoTable = (options) => {
    if (typeof autoTable === 'function') {
      autoTable(doc, options);
    } else if (autoTable && typeof autoTable.default === 'function') {
      autoTable.default(doc, options);
    } else if (typeof doc.autoTable === 'function') {
      doc.autoTable(options);
    }
  };

  // Header decorative bar
  doc.setFillColor(11, 30, 63); // #0B1E3F
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Brand Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(11, 30, 63);
  doc.text('SISTEM PENGADUAN MAINTENANCE & FASILITAS', 14, 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 136, 229); // #1E88E5
  doc.text('REKAPITULASI LAPORAN DATA PENGADUAN FASILITAS', 14, 20);

  // Divider line
  doc.setDrawColor(30, 136, 229);
  doc.setLineWidth(0.6);
  doc.line(14, 23, pageWidth - 14, 23);

  // Metadata / Filter Summary Box
  const now = new Date();
  const formattedNow = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600

  const col1X = 14;
  const col2X = 85;
  const col3X = 155;
  const col4X = 220;

  // Row 1
  doc.text(`Tanggal Cetak: ${formattedNow} WIB`, col1X, 29);
  doc.text(`Filter Status: ${filters.status || 'Semua Status'}`, col2X, 29);
  doc.text(`Filter Kategori: ${filters.category || 'Semua Kategori'}`, col3X, 29);
  doc.text(`Total Laporan: ${reports.length} Data`, col4X, 29);

  // Row 2
  const periodeText = (filters.startDate && filters.endDate)
    ? `${filters.startDate} s/d ${filters.endDate}`
    : (filters.startDate ? `Mulai ${filters.startDate}` : (filters.endDate ? `Sampai ${filters.endDate}` : 'Semua Tanggal'));
  doc.text(`Periode Data: ${periodeText}`, col1X, 34);
  doc.text(`Filter Prioritas: ${filters.priority || 'Semua Prioritas'}`, col2X, 34);
  if (filters.search) {
    doc.text(`Pencarian: "${filters.search}"`, col3X, 34);
  }

  // Table Columns
  const tableHeaders = [
    'No',
    'No. Tiket',
    'Tanggal',
    'Pelapor',
    'Lokasi',
    'Kategori',
    'Nama Barang',
    'Deskripsi Kerusakan',
    'Prioritas',
    'Status',
    'Teknisi'
  ];

  // Table Body Rows
  const tableRows = reports.map((r, idx) => {
    const ticketId = `#TKT-${String(r.id || '').padStart(5, '0')}`;
    const dateStr = r.created_at ? formatDate(r.created_at) : '-';
    return [
      idx + 1,
      ticketId,
      dateStr,
      r.reporter_name || '-',
      r.location || '-',
      r.category || '-',
      r.item_name || '-',
      (r.description || '-').replace(/\r?\n|\r/g, ' '),
      r.priority || 'Sedang',
      r.status || 'Menunggu',
      r.technician || '-'
    ];
  });

  runAutoTable({
    startY: 38,
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [11, 30, 63],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    styles: {
      fontSize: 7.5,
      textColor: [30, 41, 59], // slate-800
      cellPadding: 2,
      overflow: 'linebreak',
      valign: 'middle',
      lineColor: [226, 232, 240], // slate-200
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },  // No
      1: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },  // No. Tiket
      2: { halign: 'center', cellWidth: 22 },  // Tanggal
      3: { cellWidth: 26 },                    // Pelapor
      4: { cellWidth: 26 },                    // Lokasi
      5: { cellWidth: 24 },                    // Kategori
      6: { cellWidth: 28 },                    // Nama Barang
      7: { cellWidth: 47 },                    // Deskripsi Kerusakan
      8: { halign: 'center', cellWidth: 18 },  // Prioritas
      9: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },  // Status
      10: { cellWidth: 26 },                   // Teknisi
    },
    didParseCell: (data) => {
      // Colorize Prioritas
      if (data.section === 'body' && data.column.index === 8) {
        const val = String(data.cell.raw).trim();
        if (val === 'Tinggi') {
          data.cell.styles.textColor = [190, 18, 60]; // rose-700
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'Sedang') {
          data.cell.styles.textColor = [180, 83, 9]; // amber-700
        } else if (val === 'Rendah') {
          data.cell.styles.textColor = [4, 120, 87]; // emerald-700
        }
      }

      // Colorize Status
      if (data.section === 'body' && data.column.index === 9) {
        const val = String(data.cell.raw).trim();
        if (val === 'Selesai') {
          data.cell.styles.textColor = [5, 150, 105]; // emerald-600
        } else if (val === 'Diproses') {
          data.cell.styles.textColor = [37, 99, 235]; // blue-600
        } else if (val === 'Menunggu') {
          data.cell.styles.textColor = [217, 119, 6]; // amber-600
        } else if (val === 'Ditolak') {
          data.cell.styles.textColor = [225, 29, 72]; // rose-600
        }
      }
    },
    didDrawPage: (data) => {
      // Footer page numbering and copyright
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400

      // Thin footer line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);

      doc.text(
        'Sistem Pengaduan Maintenance & Fasilitas • Dokumen Resmi Internal Perusahaan',
        14,
        pageHeight - 6
      );

      const pageStr = `Halaman ${data.pageNumber}`;
      doc.text(pageStr, pageWidth - 14 - doc.getTextWidth(pageStr), pageHeight - 6);
    },
    margin: { top: 38, bottom: 16, left: 14, right: 14 },
  });

  // Calculate final Y position for signature block
  let finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 40) + 10;
  
  // If not enough room for signature block on current page, add new page
  if (finalY + 35 > pageHeight - 16) {
    doc.addPage();
    finalY = 20;
  }

  // Signature Block at the bottom right
  const sigX = pageWidth - 70;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  const dateNowStr = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  doc.text(`Dicetak pada: ${dateNowStr}`, sigX, finalY);
  doc.text('Mengetahui / Penanggung Jawab,', sigX, finalY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text('Admin Operasional Maintenance', sigX, finalY + 10);

  // Line for signature
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(sigX, finalY + 28, sigX + 50, finalY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('( Tanda Tangan & Nama Terang )', sigX + 5, finalY + 32);

  // Save the PDF
  const today = now.toISOString().slice(0, 10);
  doc.save(`rekap-pengaduan-maintenance-${today}.pdf`);
};
