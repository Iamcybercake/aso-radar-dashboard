# n8n workflow code

Code-node sources for the "ASO Radar" n8n workflow. Paste each file into the node with the same name.

```
Schedule / Manual
  → Get apps (Supabase: apps, active = true)
  → App Store page (HTTP GET apps.apple.com/{country}/app/id{id}, text, continue on error)
  → Lookup batches   lookup-batches.js   one Lookup URL per storefront (≤100 ids)
  → Lookup (HTTP GET {{ $json.url }}, JSON, continue on error)
  → Parse page       parse-page.js       page + Lookup → one snapshot row per app
  → Latest snapshots (Supabase view, execute once, always output data)
  → Compare          compare.js          diff vs previous snapshot → changed_fields / prev_values
  → Save snapshot → Has changes? → Build alert → Save change
  ↘ Get assets → New images → Download image → Upload to storage → Save asset
```

Parser v2 does not depend on the storefront language: localized labels are never used as keys.
Version, dates, genre, seller, size, age rating and language codes come from the iTunes Lookup API;
subtitle comes from `lockup.developerTagline` (Apple puts the genre into `subtitle` when an app has none).
