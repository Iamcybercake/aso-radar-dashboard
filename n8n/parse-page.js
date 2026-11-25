// n8n Code node — "Parse page" v2 (Mode: Run Once for All Items)
// Needs upstream nodes named exactly: "Get apps", "App Store page", "Lookup batches", "Lookup".
// Works for any storefront language: nothing here depends on localized labels.
//   - store page  -> title, subtitle, texts, creatives, events, IAP, privacy, chart, ratings
//   - Lookup API  -> version, dates, genre, seller, size, age rating, language codes, bundle id
// If Lookup fails, those fields come back null and "Compare" keeps the previous values.

// Apple image template -> fixed URL. Long side capped (screens 1600px, icons 512px) so copies are sharp
// but not huge. Host is normalized to is1-ssl to avoid fake changes.
const img = (a, maxSide = 1600) => {
  if (!a?.template) return null;
  const W = a.width || 1; const H = a.height || 1;
  const s = Math.min(1, maxSide / Math.max(W, H));
  return a.template
    .replace(/is\d-ssl/, 'is1-ssl')
    .replace('{w}', Math.round(W * s)).replace('{h}', Math.round(H * s))
    .replace('{c}', 'bb').replace('{f}', 'jpg');
};

function findAll(node, pred, out = []) {
  if (Array.isArray(node)) node.forEach((n) => findAll(n, pred, out));
  else if (node && typeof node === 'object') {
    if (pred(node)) out.push(node);
    Object.values(node).forEach((v) => findAll(v, pred, out));
  }
  return out;
}

const NOISE = ['actionMetrics', 'impressionMetrics', 'pageMetrics', 'clickAction', 'buttonAction',
  'seeAllAction', 'notificationConfig', 'artwork', 'icon', 'variants'];
const clean = (o) => JSON.parse(JSON.stringify(o ?? null, (k, v) => (NOISE.includes(k) ? undefined : v)));
const toIso = (v) => { const d = v ? new Date(v) : null; return d && !isNaN(d) ? d.toISOString() : null; };
const fmtSize = (bytes) => (Number(bytes) ? `${(Number(bytes) / 1048576).toFixed(1)} MB` : null);
// Genre from Lookup (English). For games add the subgenre, e.g. "Games: Casual" (ids 7001–7019).
const genre = (L) => {
  if (!L?.primaryGenreName) return null;
  if (String(L.primaryGenreId) === '6014') {
    const i = (L.genreIds ?? []).findIndex((id) => /^70\d\d$/.test(String(id)));
    if (i >= 0 && L.genres?.[i]) return `Games: ${L.genres[i]}`;
  }
  return L.primaryGenreName;
};

// ---- Lookup results, keyed by "id|country" (Lookup items come back in the same order as batches) ----
const batches = $('Lookup batches').all().map((i) => i.json);
const lookup = {};
$('Lookup').all().forEach((item, i) => {
  const country = batches[i]?.country;
  for (const r of item.json?.results ?? []) {
    if (r.trackId) lookup[`${r.trackId}|${country}`] = r;
  }
});

const appsIn = $('Get apps').all().map((i) => i.json); // same order as pages

return $('App Store page').all().map((item, idx) => {
  const src = appsIn[idx] || {};
  const fail = (reason) => ({
    json: { parse_error: reason, app_store_id: String(src.app_store_id ?? ''), country: src.country ?? null },
  });

  if (item.json.error) return fail(`request failed: ${item.json.error.message ?? 'unknown'}`);
  const html = typeof item.json.data === 'string' ? item.json.data : '';
  const m = html.match(/<script[^>]*id="serialized-server-data"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return fail('serialized-server-data not found');

  let root;
  try { root = JSON.parse(m[1]).data[0]; } catch (e) { return fail('bad page JSON'); }
  const page = root?.data;
  if (!page?.shelfMapping) return fail('no product page data (removed or unavailable?)');

  const appId = String(root.intent?.id ?? '');
  const country = root.intent?.storefront ?? null;
  const L = lookup[`${appId}|${country}`] ?? null;
  const S = page.shelfMapping || {};
  const items = (name) => S[name]?.items ?? [];

  // The app's own card. developerTagline exists only when the app has a real subtitle;
  // without it Apple puts the genre name into `subtitle`, which we must not store as a subtitle.
  const own = page.lockup ?? findAll(page, (o) => o.$kind === 'Lockup' && String(o.adamId) === appId)[0] ?? {};

  const desc = items('description')[0];
  const ver = items('mostRecentVersion')[0];
  const rat = items('productRatings')[0];

  // Ribbon badges have stable keys (category, chartPosition, contentRating, languages, size)
  const ribbon = items('informationRibbon').map((b) => ({
    key: b.key ?? b.type ?? null, caption: b.caption ?? null, content: clean(b.content ?? null),
  }));
  const rib = (k) => ribbon.find((b) => b.key === k);
  const chart = rib('chartPosition');

  // "Information" blocks have localized titles, so we recognise them by structure
  const info = items('information');
  const iapBlock = info.find((a) => (a.items ?? []).some((x) => x.$kind === 'textPair'));
  const iap = (iapBlock?.items ?? []).filter((i) => i.$kind === 'textPair')
    .map((i) => ({ name: i.leadingText, price: i.trailingText }));

  const shots = (shelf) => items(shelf).filter((i) => i.screenshot).map((i) => img(i.screenshot));
  const videos = (shelf) => items(shelf).filter((i) => i.video).map((i) => ({
    url: i.video.videoUrl, preview: img(i.video.preview),
  }));

  const rc = rat?.ratingCounts ?? [];
  const hist = rc.length === 5 ? { 5: rc[0], 4: rc[1], 3: rc[2], 2: rc[3], 1: rc[4] } : null;
  const devId = JSON.stringify(page.developerAction ?? {}).match(/developer\/[^/"]+\/id(\d+)/)?.[1] ?? null;
  const pageVersion = String(ver?.primarySubtitle ?? '').match(/\d+(?:\.\d+)*/)?.[0] ?? null; // "Versão 1.2.3" -> "1.2.3"
  const pageSize = rib('size') ? `${rib('size').content?.paragraphText ?? ''} ${rib('size').caption ?? ''}`.trim() : null;

  return {
    json: {
      app_store_id: appId,
      country,
      title: own.title ?? page.seoData?.pageTitle ?? null,
      subtitle: own.developerTagline ?? null,
      promo_text: null, // not present in the web page JSON — backlog
      description: desc?.paragraph?.text ?? null,
      version: pageVersion ?? L?.version ?? null,
      version_released_at: toIso(ver?.secondarySubtitle) ?? toIso(L?.currentVersionReleaseDate),
      release_notes: ver?.text ?? null,
      developer_name: page.developerAction?.title ?? L?.artistName ?? null,
      developer_id: devId ?? (L?.artistId ? String(L.artistId) : null),
      seller_name: L?.sellerName ?? null,
      developer_website: (desc?.developerLinks ?? []).map((l) => l.clickAction?.url).filter(Boolean)[0] ?? L?.sellerUrl ?? null,
      privacy_url: Object.values(items('privacyHeader')[0]?.bodyText?.linkedSubstrings ?? {})[0]?.url ?? null,
      icon_url: img(own.icon, 512),
      screenshot_urls: shots('product_media_phone_'),
      ipad_screenshot_urls: shots('product_media_pad_'),
      preview_videos: [...videos('product_media_phone_'), ...videos('product_media_pad_')],
      category: genre(L),
      content_rating: L?.contentAdvisoryRating ?? L?.trackContentRating ?? null,
      size: fmtSize(L?.fileSizeBytes) ?? pageSize,
      languages: L?.languageCodesISO2A?.length ? L.languageCodesISO2A.join(', ') : null,
      iap,
      events: items('appEvents').map((e) => ({
        id: e.appEventId, kind: e.kind ?? null, title: e.title ?? null, subtitle: e.subtitle ?? null,
        detail: e.detail ?? null, start: e.startDate ?? null, end: e.endDate ?? null,
        status: e.appEventBadgeKind ?? null, image: img(e.moduleArtwork, 1200),
      })),
      privacy_labels: items('privacyTypes').map((p) => ({
        type: p.identifier, categories: (p.categories ?? []).map((c) => c.identifier),
      })),
      chart_category: chart?.caption ?? null,
      chart_rank: Number(chart?.content?.position) || null,
      editors_choice: Boolean(own.isEditorsChoice) || items('editorsChoiceProductReviews').length > 0,
      rating: rat?.ratingAverage ?? L?.averageUserRating ?? null,
      rating_count: rat?.totalNumberOfRatings ?? L?.userRatingCount ?? null,
      rating_histogram: hist,
      featured_in: items('featuredIn').map((c) => ({ heading: c.heading ?? null, title: c.title ?? null })),
      more_by_developer: items('moreByDeveloper').map((l) => ({ id: l.adamId, title: l.title, subtitle: l.subtitle ?? null })),
      similar_apps: items('similarItems').map((l) => ({ id: l.adamId, title: l.title })),
      // Lookup-only columns (already exist in `snapshots`)
      bundle_id: L?.bundleId ?? own.bundleId ?? null,
      first_released_at: toIso(L?.releaseDate),
      advisories: L?.advisories ?? null,
      language_codes: L?.languageCodesISO2A ?? null,
      current_version_rating: L?.averageUserRatingForCurrentVersion ?? null,
      current_version_rating_count: L?.userRatingCountForCurrentVersion ?? null,
    },
  };
});
