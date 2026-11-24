// Small date / number helpers shared by all screens.

const DAY = 86400000;

// Whole days between two dates (b defaults to now). Returns null if `a` is empty.
export const daysBetween = (a, b = new Date()) => {
  if (!a) return null;
  const d = Math.floor((new Date(b) - new Date(a)) / DAY);
  return Number.isFinite(d) ? Math.max(0, d) : null;
};

export const fmtDate = (v, lang) =>
  v ? new Date(v).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const fmtDateTime = (v, lang) =>
  v ? new Date(v).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

// "today" / "yesterday" / "5 d ago"
export const fmtAgo = (v, t) => {
  const d = daysBetween(v);
  if (d == null) return t('never');
  if (d === 0) return t('today');
  if (d === 1) return t('yesterday');
  return `${d} ${t('days_ago')}`;
};

export const fmtCount = (n) => {
  if (n == null) return '—';
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
};

// Country code -> flag emoji ("tr" -> 🇹🇷)
export const flag = (cc) =>
  cc && cc.length === 2 ? String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 127397 + c.charCodeAt(0))) : '';

export const storeUrl = (country, id) => `https://apps.apple.com/${country}/app/id${id}`;

// Parse an App Store link: https://apps.apple.com/tr/app/some-name/id123 -> { country, appStoreId, slugName }
export function parseStoreLink(raw) {
  const s = String(raw || '').trim();
  const m = s.match(/apps\.apple\.com\/(?:([a-z]{2})\/)?app\/(?:([^/?#]+)\/)?id(\d+)/i);
  if (!m) return null;
  const slug = m[2] && !/^id\d+$/i.test(m[2]) ? decodeURIComponent(m[2]) : null;
  return {
    country: (m[1] || 'us').toLowerCase(),
    appStoreId: m[3],
    slugName: slug ? slug.replace(/-/g, ' ').replace(/\b\p{L}/gu, (c) => c.toUpperCase()) : null,
  };
}
