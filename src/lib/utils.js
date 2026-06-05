/**
 * Format number to Indonesian Rupiah
 * @param {number} amount
 * @returns {string} e.g. "Rp 25.000"
 */
export function formatRupiah(amount) {
  if (amount == null || isNaN(amount)) return 'Rp 0';
  return 'Rp ' + Math.round(Number(amount)).toLocaleString('id-ID');
}

/**
 * Format date to Indonesian locale
 * @param {string|Date} date
 * @param {object} options
 * @returns {string}
 */
export function formatDate(date, options = {}) {
  const d = new Date(date);
  const defaultOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options,
  };
  return d.toLocaleDateString('id-ID', defaultOptions);
}

/**
 * Format date to short format (DD/MM/YYYY)
 */
export function formatDateShort(date) {
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format time only (HH:MM)
 */
export function formatTime(date) {
  const d = new Date(date);
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Generate order number
 * Format: {OUTLET_CODE}-{YYYYMMDD}-{SEQ}
 * @param {string} outletCode - e.g. "OTL01"
 * @param {number} sequence - sequential number
 * @returns {string} e.g. "OTL01-20260604-001"
 */
export function generateOrderNumber(outletCode, sequence) {
  const now = new Date();
  const dateStr =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  const seqStr = sequence.toString().padStart(3, '0');
  return `${outletCode}-${dateStr}-${seqStr}`;
}

/**
 * Parse Rupiah string to number
 */
export function parseRupiah(str) {
  if (typeof str === 'number') return str;
  return parseInt(str.replace(/[^0-9]/g, ''), 10) || 0;
}

/**
 * Debounce function
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Truncate text
 */
export function truncate(str, len = 30) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

/**
 * Get initials from name
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Calculate tax (default 11% PPN)
 */
export function calculateTax(subtotal, taxRate = 0.11) {
  return Math.round(subtotal * taxRate);
}
