// Utility for formatting dates in Indonesian Western Time (WIB / GMT+7)

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const FULL_MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Format date and time with explicit WIB timezone indicator
 * Example output: "09 Sep 2026, 00:12:50 WIB"
 */
export function formatDateTime(dateStr, includeSeconds = true) {
  if (!dateStr) return '-';
  try {
    const cleanStr = String(dateStr).trim();
    // Match "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DDTHH:mm:ss"
    const match = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
      const [_, year, month, day, hours, minutes, seconds] = match;
      const monthIdx = parseInt(month, 10) - 1;
      const monthName = MONTH_NAMES[monthIdx] || month;
      const secStr = includeSeconds && seconds !== undefined ? `:${seconds}` : '';
      return `${day} ${monthName} ${year}, ${hours}:${minutes}${secStr} WIB`;
    }

    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: false
    }).format(d).replace(/\./g, ':') + ' WIB';
  } catch (e) {
    return dateStr;
  }
}

/**
 * Format date only
 * Example output: "09 Sep 2026"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const cleanStr = String(dateStr).trim();
    const match = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [_, year, month, day] = match;
      const monthIdx = parseInt(month, 10) - 1;
      const monthName = MONTH_NAMES[monthIdx] || month;
      return `${day} ${monthName} ${year}`;
    }

    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch (e) {
    return dateStr;
  }
}
