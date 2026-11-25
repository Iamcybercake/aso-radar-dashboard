// Demo mode: in-memory fake data shaped exactly like the Supabase tables/views.
// Used when VITE_DEMO=1 or Supabase env vars are missing. Nothing here touches the network.

const DAY = 86400000;
const now = Date.now();
const ago = (d, h = 9) => new Date(now - d * DAY - h * 3600000).toISOString();
const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms));
const clone = (x) => JSON.parse(JSON.stringify(x));

// Placeholder artwork (SVG data URIs) so the demo works offline
const ph = (label, w, h, hue, shade = 0) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},70%,${48 + shade}%)"/>
<stop offset="1" stop-color="hsl(${(hue + 40) % 360},65%,${28 + shade}%)"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>
<text x="50%" y="52%" fill="rgba(255,255,255,.9)" font-family="sans-serif" font-weight="700" font-size="${Math.round(Math.min(w, h) / 5)}" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
const icon = (txt, hue, v = 0) => ph(txt, 256, 256, hue, v * 8);
const shots = (txt, hue, n, v = 0, pad = false) =>
  Array.from({ length: n }, (_, i) => ph(`${txt} ${i + 1}${v ? `·v${v}` : ''}`, pad ? 400 : 300, pad ? 300 : 650, (hue + i * 12) % 360, v * 6));

const APPS = [
  { id: 1, app_store_id: 6834377434, country: 'tr', name: 'Swebble', cat: 'Education', hue: 200, rel: 8, dev: 'Kemal Arslan' },
  { id: 2, app_store_id: 6819642715, country: 'tr', name: 'Candy Roll', cat: 'Games', hue: 320, rel: 24, dev: 'Sweet Pixel Ltd' },
  { id: 3, app_store_id: 6471653432, country: 'tr', name: 'Bowl Sort Bonanza Match Game', cat: 'Games', hue: 30, rel: 1110, dev: 'Bowl Studio' },
  { id: 4, app_store_id: 1445536681, country: 'tr', name: 'Balloon Bonanza!', cat: 'Games', hue: 0, rel: 2902, dev: 'Air Play Games' },
  { id: 5, app_store_id: 904057429, country: 'tr', name: 'Banana Bonanza', cat: 'Games', hue: 50, rel: 4478, dev: 'Monkey Bay' },
  { id: 6, app_store_id: 6736830756, country: 'tr', name: 'Fishing Time: Lucky Catch', cat: 'Games', hue: 180, rel: 772, dev: 'Blue Hook Apps' },
  { id: 7, app_store_id: 6820456950, country: 'it', name: 'CR - Cooking Restaurante Game', cat: 'Games', hue: 15, rel: 8, dev: 'Dapur Ceria Sdn Bhd' },
  { id: 8, app_store_id: 6828888933, country: 'it', name: 'СНlК:R2 Network Path', cat: 'Utilities', hue: 260, rel: 18, dev: 'Netivim Tech' },
  { id: 9, app_store_id: 6798557731, country: 'it', name: 'CraftHearth', cat: 'Lifestyle', hue: 100, rel: 6, dev: 'Hearth Labs', removed: 1 },
];

const db = { apps: [], snapshots: [], changes: [], marks: [], tags: [], assets: [] };
let seq = 1000;

function baseSnap(a, v = 0) {
  const init = a.name.split(/\s|:/)[0].slice(0, 2).toUpperCase();
  return {
    app_id: a.id,
    title: a.name,
    subtitle: a.cat === 'Games' ? 'Spin, match and win big' : 'Smart daily helper',
    promo_text: null,
    description: `${a.name} — ${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(6)}`,
    version: `1.${v}`,
    version_released_at: ago(Math.max(1, Math.round(a.rel / (v + 3)))),
    release_notes: v ? 'Bug fixes and performance improvements.' : null,
    developer_name: a.dev, developer_id: 1700000000 + a.id, seller_name: a.dev,
    developer_website: `https://example.com/${a.id}`, privacy_url: `https://example.com/${a.id}/privacy`,
    icon_url: icon(init, a.hue),
    screenshot_urls: shots(init, a.hue, 5),
    ipad_screenshot_urls: a.cat === 'Games' ? shots(init, a.hue, 3, 0, true) : [],
    preview_videos: [],
    category: a.cat, content_rating: a.cat === 'Games' ? '17+' : '4+', size: '142.3 MB', languages: 'English, Turkish',
    iap: a.cat === 'Games' ? [{ name: 'Coin Pack', price: '₺49,99' }, { name: 'Starter Bundle', price: '₺199,99' }] : [],
    events: [],
    privacy_labels: [{ type: 'DATA_NOT_COLLECTED', categories: [] }],
    chart_category: a.cat === 'Games' ? 'Casino' : null,
    chart_rank: a.cat === 'Games' ? 10 + a.id * 7 : null,
    editors_choice: false,
    rating: 4.1 + (a.id % 8) / 10, rating_count: 120 * a.id * a.id,
    rating_histogram: { 5: 70 * a.id, 4: 25 * a.id, 3: 10 * a.id, 2: 5 * a.id, 1: 10 * a.id },
    featured_in: [], more_by_developer: [], similar_apps: [],
    first_released_at: ago(a.rel),
    changed_fields: [], prev_values: null,
  };
}

function addSnap(s, daysAgo) {
  const row = { ...s, id: ++seq, captured_at: ago(daysAgo, 4) };
  db.snapshots.push(row);
  return row;
}
function addChange(snap, kind = 'update') {
  db.changes.push({ id: ++seq, snapshot_id: snap.id, app_id: snap.app_id, detected_at: snap.captured_at, kind, summary: '' });
}

// Build history: daily snapshots for the tracking period, with a few scripted changes
for (const a of APPS) {
  const trackedDays = 12;
  db.apps.push({
    id: a.id, app_store_id: a.app_store_id, country: a.country, name: a.name, is_own: false,
    source: 'manual', status: a.removed ? 'removed' : 'live', removed_at: a.removed ? ago(a.removed) : null,
    active: true, created_at: ago(trackedDays + 1),
  });
  let cur = baseSnap(a);
  const script = {
    5: { 9: (s) => ({ screenshot_urls: [...shots('BA', 50, 2, 2), ...s.screenshot_urls.slice(2)] }),
         4: () => ({ icon_url: icon('BA', 55, 2), version: '1.1', release_notes: 'New levels and bigger bonuses!', version_released_at: ago(4) }) },
    2: { 6: () => ({ developer_name: 'Lucky Crown Studio', seller_name: 'Lucky Crown Studio' }),
         2: () => ({ subtitle: 'Sweet slots & daily spins', screenshot_urls: shots('CA', 330, 6, 1) }) },
    6: { 3: () => ({ events: [{ id: '17000001', kind: null, title: 'Golden Catch Weekend', subtitle: 'Double rewards', detail: 'Catch golden fish for x2 coins all weekend.', start: ago(-1), end: ago(-4), status: 'upcoming', image: ph('EVENT', 1200, 675, 40) }] }),
         1: (s) => ({ iap: [...s.iap, { name: 'Lucky Bait x10', price: '₺89,99' }] }) },
    1: { 5: () => ({ subtitle: 'Learn words in 5 minutes a day', title: 'Swebble: Word Quest' }) },
    7: { 7: () => ({ description: 'Masak dan sajikan hidangan lezat! '.repeat(10), languages: 'English, Malay' }) },
    8: { 2: () => ({ developer_website: 'https://netivim.example.org' }) },
  }[a.id] || {};

  for (let d = trackedDays; d >= (a.removed || 0); d--) {
    const fn = script[d];
    if (fn && d !== trackedDays) {
      const patch = fn(cur);
      const changed = Object.keys(patch).filter((k) => JSON.stringify(cur[k]) !== JSON.stringify(patch[k]) && k !== 'version_released_at');
      const prev = Object.fromEntries(changed.map((k) => [k, cur[k] ?? null]));
      cur = { ...cur, ...patch };
      const snap = addSnap({ ...cur, changed_fields: changed, prev_values: prev }, d);
      addChange(snap, changed.includes('developer_name') ? 'account_change' : 'update');
    } else {
      addSnap({ ...cur, changed_fields: [], prev_values: null, chart_rank: cur.chart_rank ? cur.chart_rank + ((d * 3) % 5) : null }, d);
    }
  }
}
db.marks.push(
  { id: ++seq, app_id: 5, marked_at: ago(8).slice(0, 10), type: 'top1', keyword: 'casino', note: 'Top-1 after screenshot update', created_at: ago(8) },
  { id: ++seq, app_id: 5, marked_at: ago(3).slice(0, 10), type: 'motivated_traffic', keyword: 'slots', note: null, created_at: ago(3) },
  { id: ++seq, app_id: 9, marked_at: ago(5).slice(0, 10), type: 'top3', keyword: 'bet', note: null, created_at: ago(5) },
);
db.tags.push(
  { id: ++seq, app_id: 5, tag: 'casino' }, { id: ++seq, app_id: 2, tag: 'casino' }, { id: ++seq, app_id: 2, tag: 'account flip' },
  { id: ++seq, app_id: 7, tag: 'non-local texts' }, { id: ++seq, app_id: 8, tag: 'non-local texts' }, { id: ++seq, app_id: 6, tag: 'slots' },
);

const latestOf = (appId) => db.snapshots.filter((s) => s.app_id === appId).sort((a, b) => b.captured_at.localeCompare(a.captured_at))[0];

function overviewRow(a) {
  const s = latestOf(a.id);
  const snaps = db.snapshots.filter((x) => x.app_id === a.id);
  const ch = db.changes.filter((c) => c.app_id === a.id);
  return {
    id: a.id, app_store_id: a.app_store_id, country: a.country, name: a.name, is_own: a.is_own, status: a.status,
    active: a.active, removed_at: a.removed_at, created_at: a.created_at,
    title: s?.title ?? null, subtitle: s?.subtitle ?? null, icon_url: s?.icon_url ?? null, version: s?.version ?? null,
    version_released_at: s?.version_released_at ?? null, first_released_at: s?.first_released_at ?? null, developer_name: s?.developer_name ?? null, category: s?.category ?? null,
    rating: s?.rating ?? null, rating_count: s?.rating_count ?? null, chart_category: s?.chart_category ?? null,
    chart_rank: s?.chart_rank ?? null, editors_choice: s?.editors_choice ?? null, last_checked_at: s?.captured_at ?? null,
    tracked_since: snaps.length ? snaps.map((x) => x.captured_at).sort()[0] : null,
    last_change_at: ch.length ? ch.map((c) => c.detected_at).sort().pop() : null,
    changes_count: ch.length,
  };
}
const withSnap = (c) => ({ ...c, snapshot: clone(db.snapshots.find((s) => s.id === c.snapshot_id)) });

let session = { user: { email: 'demo@aso-radar.app' } };

export const api = {
  async getSession() { return session; },
  onAuthChange() { return () => {}; },
  async signIn() { session = { user: { email: 'demo@aso-radar.app' } }; },
  async signOut() { /* demo: stay signed in */ },

  async overview() { await wait(); return db.apps.map(overviewRow).sort((a, b) => b.created_at.localeCompare(a.created_at)); },
  async allTags() { await wait(40); return clone(db.tags); },
  async iconAssets() { return []; },
  async setActive(id, active) { await wait(60); db.apps.find((a) => a.id === id).active = active; },
  async addApp({ appStoreId, country, name }) {
    await wait(200);
    if (db.apps.some((a) => String(a.app_store_id) === String(appStoreId) && a.country === country)) {
      const e = new Error('duplicate'); e.code = 'duplicate'; throw e;
    }
    db.apps.push({ id: ++seq, app_store_id: Number(appStoreId), country, name, is_own: false, source: 'manual',
      status: 'live', removed_at: null, active: true, created_at: new Date().toISOString() });
  },

  async app(id) { await wait(); const a = db.apps.find((x) => x.id === Number(id)); return a ? overviewRow(a) : null; },
  async latestSnapshot(id) { return clone(latestOf(Number(id)) ?? null); },
  async appChanges(id) {
    await wait();
    return db.changes.filter((c) => c.app_id === Number(id)).sort((a, b) => b.detected_at.localeCompare(a.detected_at)).map(withSnap);
  },
  async marks(id) { return clone(db.marks.filter((m) => m.app_id === Number(id)).sort((a, b) => b.marked_at.localeCompare(a.marked_at))); },
  async addMark(row) { await wait(80); db.marks.push({ ...row, id: ++seq, created_at: new Date().toISOString() }); },
  async deleteMark(id) { db.marks = db.marks.filter((m) => m.id !== id); },
  async addTag(appId, tag) {
    if (db.tags.some((t) => t.app_id === appId && t.tag === tag)) { const e = new Error('duplicate'); e.code = '23505'; throw e; }
    db.tags.push({ id: ++seq, app_id: appId, tag });
  },
  async removeTag(id) { db.tags = db.tags.filter((t) => t.id !== id); },
  async appAssets() { return []; },
  async snapshotCount(id) { return db.snapshots.filter((s) => s.app_id === Number(id)).length; },

  async feed({ from = 0, size = 50, kind } = {}) {
    await wait();
    return db.changes
      .filter((c) => !kind || c.kind === kind)
      .sort((a, b) => b.detected_at.localeCompare(a.detected_at))
      .slice(from, from + size)
      .map((c) => {
        const a = db.apps.find((x) => x.id === c.app_id);
        return { ...withSnap(c), app: { id: a.id, name: a.name, country: a.country, app_store_id: a.app_store_id } };
      });
  },
};
