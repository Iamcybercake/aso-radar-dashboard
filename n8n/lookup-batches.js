// n8n Code node — "Lookup batches" (Mode: Run Once for All Items)
// Placed after "App Store page". Groups apps by storefront so the iTunes Lookup API is called
// once per country (up to 100 ids per request) instead of once per app.
// Lookup returns language-neutral data: version, dates, genre, seller, size, age rating, language codes.

const apps = $('Get apps').all().map((i) => i.json);
const byCountry = {};
for (const a of apps) (byCountry[a.country] ||= []).push(String(a.app_store_id));

const out = [];
for (const [country, ids] of Object.entries(byCountry)) {
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    out.push({
      json: {
        country,
        ids: chunk,
        url: `https://itunes.apple.com/lookup?id=${chunk.join(',')}&country=${country}&entity=software&lang=en_us`,
      },
    });
  }
}
return out;
