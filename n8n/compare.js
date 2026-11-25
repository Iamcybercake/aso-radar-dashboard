// n8n Code node — "Compare" v2 (Mode: Run Once for All Items)
// Needs upstream nodes named exactly: "Get apps", "Parse page", "Latest snapshots"
// Changes vs v1:
//   - images are compared without their size suffix, so a resolution change is not a "new screenshot"
//   - fields that come from the Lookup API: if today's value is missing (Lookup failed / app not in
//     Lookup), yesterday's value is kept; if yesterday's value was missing, it is not an alert

const apps   = $('Get apps').all().map((i) => i.json);
const parsed = $('Parse page').all().map((i) => i.json);
const latest = $('Latest snapshots').all().map((i) => i.json).filter((r) => r.app_id);
const lastByApp = Object.fromEntries(latest.map((r) => [r.app_id, r]));

// Daily-moving metrics (rating, histogram, chart_rank, size, similar_apps) are stored but do NOT trigger a change.
// featured_in is NOT tracked: Apple shows a rotating sample of stories.
const TRACKED = [
  'title', 'subtitle', 'promo_text', 'description', 'version', 'release_notes',
  'developer_name', 'seller_name', 'developer_website', 'privacy_url',
  'icon_url', 'screenshot_urls', 'ipad_screenshot_urls', 'preview_videos',
  'category', 'content_rating', 'languages', 'iap', 'events', 'privacy_labels',
  'editors_choice', 'more_by_developer',
];

// Filled from the Lookup API (see "Parse page")
const LOOKUP_FIELDS = [
  'version', 'version_released_at', 'seller_name', 'category', 'content_rating', 'languages', 'size',
  'bundle_id', 'first_released_at', 'advisories', 'language_codes',
  'current_version_rating', 'current_version_rating_count', 'developer_id',
];

// Lists Apple may show partially: change only when a NEW item appears
const ADDITIONS_ONLY = { more_by_developer: (a) => a.id };

// Same picture at another size/host -> same key
const imgKey = (u) => (typeof u === 'string'
  ? u.replace(/^https:\/\/is\d-ssl\./, 'https://is1-ssl.').replace(/\/[^/]*$/, '')
  : u);

const sortBy = (arr, key) => [...arr].sort((a, b) => String(key(a)).localeCompare(String(key(b))));
const normalize = (field, v) => {
  if (v == null) return null;
  switch (field) {
    case 'icon_url': return imgKey(v);
    case 'screenshot_urls':
    case 'ipad_screenshot_urls': return v.map(imgKey); // order matters
    case 'preview_videos': return v.map((x) => ({ url: x.url, preview: imgKey(x.preview) }));
    case 'events':
      return sortBy(v, (e) => e.id).map((e) => ({
        id: e.id, title: e.title, subtitle: e.subtitle, detail: e.detail, start: e.start, end: e.end,
      }));
    case 'iap':            return sortBy(v, (i) => `${i.name}|${i.price}`);
    case 'featured_in':    return sortBy(v, (c) => `${c.heading}|${c.title}`);
    case 'more_by_developer': return sortBy(v, (a) => a.id);
    case 'privacy_labels':
      return sortBy(v, (p) => p.type).map((p) => ({ type: p.type, categories: [...(p.categories || [])].sort() }));
    default: return v;
  }
};
const same = (field, a, b) => {
  if (ADDITIONS_ONLY[field]) {
    const key = ADDITIONS_ONLY[field];
    const prevKeys = new Set((a || []).map(key));
    return (b || []).every((x) => prevKeys.has(key(x)));
  }
  if (LOOKUP_FIELDS.includes(field) && a == null) return true; // nothing known before -> not an alert
  return JSON.stringify(normalize(field, a)) === JSON.stringify(normalize(field, b));
};

const out = [];
for (const p of parsed) {
  if (p.parse_error) continue; // not parsed — removal detection is a backlog item
  const app = apps.find((a) => String(a.app_store_id) === String(p.app_store_id) && a.country === p.country);
  if (!app) continue;
  const { app_store_id, country, ...fields } = p;
  const prev = lastByApp[app.id];
  if (prev) {
    for (const f of LOOKUP_FIELDS) if (fields[f] == null && prev[f] != null) fields[f] = prev[f];
  }
  const changed = prev ? TRACKED.filter((f) => !same(f, prev[f], fields[f])) : [];
  out.push({
    json: {
      app_id: app.id,
      ...fields,
      changed_fields: changed,
      prev_values: changed.length ? Object.fromEntries(changed.map((f) => [f, prev[f] ?? null])) : null,
    },
  });
}
return out;
