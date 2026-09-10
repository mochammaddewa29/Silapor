// Helper to get current Indonesian Western Time (WIB / Asia/Jakarta)
// formatted as YYYY-MM-DD HH:mm:ss
function getLocalDateTime() {
  try {
    const fmt = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    return fmt.format(new Date()).replace(/,/g, '').trim();
  } catch (e) {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
}

module.exports = {
  getLocalDateTime
};
