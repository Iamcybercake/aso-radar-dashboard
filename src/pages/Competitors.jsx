// Competitors list, built from the `app_overview` view + tags + icon copies.
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '../lib/i18n.jsx';
import { api } from '../lib/api.js';
import { makeImg, useAsync } from '../lib/hooks.js';
import { daysBetween, fmtAgo, fmtCount } from '../lib/format.js';
import { AppIcon, Empty, ErrorBox, Geo, Loading, Status, Tag, Toggle } from '../components/ui.jsx';
import AddCompetitor from '../components/AddCompetitor.jsx';

const SORTS = {
  name: (r) => (r.title || r.name || '').toLowerCase(),
  geo: (r) => r.country,
  update: (r) => daysBetween(r.version_released_at) ?? 1e9,
  tracked: (r) => daysBetween(r.tracked_since) ?? -1,
  change: (r) => (r.last_change_at ? -new Date(r.last_change_at) : 0),
  chart: (r) => r.chart_rank ?? 1e9,
  rating: (r) => -(r.rating_count || 0),
  added: (r) => -new Date(r.created_at),
};

function Th({ k, children, className = '', sort, dir, onSort }) {
  const active = sort === k;
  return (
    <th className={`px-3 py-2 font-medium text-left whitespace-nowrap ${className}`} aria-sort={active ? (dir === 1 ? 'ascending' : 'descending') : undefined}>
      <button type="button" className={`cursor-pointer hover:text-text ${active ? 'text-text' : ''}`} onClick={() => onSort(k)}>
        {children}{active ? (dir === 1 ? ' ↑' : ' ↓') : ''}
      </button>
    </th>
  );
}

export default function Competitors() {
  const { t } = useLang();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [adding, setAdding] = useState(false);
  const [activeOverride, setActiveOverride] = useState({});
  const { data, error, loading, reload } = useAsync(async () => {
    const [rows, tags, icons] = await Promise.all([api.overview(), api.allTags(), api.iconAssets()]);
    return { rows, tags, img: makeImg(icons) };
  }, []);

  const q = params.get('q') || '';
  const geo = params.get('geo') || '';
  const status = params.get('status') || '';
  const tag = params.get('tag') || '';
  const hidePaused = params.get('hide') === '1';
  const sort = params.get('sort') || 'added';
  const dir = params.get('dir') === 'desc' ? -1 : 1;
  const set = (k, v) => setParams((p) => { if (v) p.set(k, v); else p.delete(k); return p; }, { replace: true });

  const tagsByApp = useMemo(() => {
    const m = {};
    (data?.tags || []).forEach((x) => { (m[x.app_id] ||= []).push(x.tag); });
    return m;
  }, [data]);

  const rows = useMemo(() => {
    if (!data) return [];
    const all = data.rows.map((r) => (r.id in activeOverride ? { ...r, active: activeOverride[r.id] } : r));
    const needle = q.trim().toLowerCase();
    const list = all.filter((r) => {
      if (hidePaused && !r.active) return false;
      if (geo && r.country !== geo) return false;
      if (status && r.status !== status) return false;
      if (tag && !(tagsByApp[r.id] || []).includes(tag)) return false;
      if (needle) {
        const hay = [r.title, r.name, r.developer_name, r.subtitle, String(r.app_store_id)].join(' ').toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    const key = SORTS[sort] || SORTS.added;
    return [...list].sort((a, b) => {
      const x = key(a); const y = key(b);
      return (x < y ? -1 : x > y ? 1 : 0) * dir;
    });
  }, [data, q, geo, status, tag, hidePaused, sort, dir, tagsByApp, activeOverride]);

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorBox error={error} onRetry={reload} />;

  const geos = [...new Set(data.rows.map((r) => r.country))].sort();
  const allTags = [...new Set(data.tags.map((x) => x.tag))].sort();

  const toggleActive = async (r, v) => {
    setActiveOverride((o) => ({ ...o, [r.id]: v })); // show the new state right away
    try { await api.setActive(r.id, v); await reload({ quiet: true }); } finally {
      setActiveOverride((o) => { const n = { ...o }; delete n[r.id]; return n; });
    }
  };

  const onSort = (k) => { if (sort === k) set('dir', dir === 1 ? 'desc' : ''); else { set('sort', k); set('dir', ''); } };
  const th = { sort, dir, onSort };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input className="input w-72 max-w-full" type="search" value={q} onChange={(e) => set('q', e.target.value)} placeholder={t('search')} aria-label={t('search')} />
        <select className="input" value={geo} onChange={(e) => set('geo', e.target.value)} aria-label={t('col_geo')}>
          <option value="">{t('all_geos')}</option>
          {geos.map((g) => <option key={g} value={g}>{g.toUpperCase()}</option>)}
        </select>
        <select className="input" value={status} onChange={(e) => set('status', e.target.value)} aria-label={t('col_status')}>
          <option value="">{t('all_statuses')}</option>
          <option value="live">{t('status_live')}</option>
          <option value="removed">{t('status_removed')}</option>
        </select>
        {allTags.length > 0 && (
          <select className="input" value={tag} onChange={(e) => set('tag', e.target.value)} aria-label={t('tags')}>
            <option value="">{t('all_tags')}</option>
            {allTags.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        )}
        <label className="flex items-center gap-2 text-sm text-muted ml-1 cursor-pointer">
          <input type="checkbox" checked={hidePaused} onChange={(e) => set('hide', e.target.checked ? '1' : '')} className="accent-signal" />
          {t('hide_paused')}
        </label>
        <span className="text-xs text-faint ml-2">{t('apps_count', rows.length)}</span>
        <button type="button" className="btn btn-primary ml-auto" onClick={() => setAdding(true)}>+ {t('add_competitor')}</button>
      </div>

      {data.rows.length === 0 ? (
        <Empty action={<button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>{t('add_competitor')}</button>}>{t('empty_apps')}</Empty>
      ) : rows.length === 0 ? (
        <Empty>{t('nothing_found')}</Empty>
      ) : (
        <div className="overflow-x-auto thin-scroll rounded-lg border border-line bg-panel">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted border-b border-line">
              <tr>
                <Th {...th} k="name" className="min-w-72">{t('col_app')}</Th>
                <Th {...th} k="geo">{t('col_geo')}</Th>
                <th className="px-3 py-2 font-medium text-left">{t('col_status')}</th>
                <th className="px-3 py-2 font-medium text-left">{t('col_version')}</th>
                <Th {...th} k="update" className="text-right">{t('col_since_update')}</Th>
                <Th {...th} k="tracked" className="text-right">{t('col_tracked')}</Th>
                <Th {...th} k="change">{t('col_last_change')}</Th>
                <Th {...th} k="chart">{t('col_chart')}</Th>
                <Th {...th} k="rating">{t('col_rating')}</Th>
                <th className="px-3 py-2 font-medium text-left">{t('col_active')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const sinceUpd = daysBetween(r.version_released_at, r.removed_at || undefined);
                const tracked = daysBetween(r.tracked_since);
                const recent = r.last_change_at && daysBetween(r.last_change_at) <= 1;
                return (
                  <tr
                    key={r.id}
                    onClick={() => nav(`/app/${r.id}`)}
                    className={`border-b border-line/60 last:border-0 hover:bg-raised/60 cursor-pointer ${r.active ? '' : 'opacity-50'}`}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <AppIcon src={data.img(r.icon_url)} name={r.title || r.name} />
                        <div className="min-w-0">
                          <div className="font-medium truncate max-w-80">
                            {r.title || r.name || `id${r.app_store_id}`}
                            {r.is_own && <span className="ml-2 text-xs text-signal">{t('own')}</span>}
                          </div>
                          <div className="text-xs text-muted truncate max-w-80">
                            {r.last_checked_at ? (r.subtitle || r.developer_name) : <span className="text-faint">{t('no_data_yet')}</span>}
                          </div>
                          {(tagsByApp[r.id] || []).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">{tagsByApp[r.id].map((x) => <Tag key={x}>{x}</Tag>)}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2"><Geo cc={r.country} /></td>
                    <td className="px-3 py-2"><Status status={r.status} /></td>
                    <td className="px-3 py-2 tabular-nums text-muted">{r.version || '—'}</td>
                    <td className="px-3 py-2 tabular-nums text-right">{sinceUpd != null ? `${sinceUpd} ${t('days_short')}` : '—'}</td>
                    <td className="px-3 py-2 tabular-nums text-right text-muted">{tracked != null ? `${tracked} ${t('days_short')}` : '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.last_change_at ? (
                        <span className={`inline-flex items-center gap-1.5 ${recent ? 'text-signal font-medium' : 'text-muted'}`}>
                          {recent && <span className="size-1.5 rounded-full bg-saul shadow-[0_0_0_3px_rgb(200_16_46/0.25)]" aria-hidden />}
                          {fmtAgo(r.last_change_at, t)} <span className="text-faint">({r.changes_count})</span>
                        </span>
                      ) : <span className="text-faint">—</span>}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.chart_rank ? <><span className="font-medium tabular-nums">#{r.chart_rank}</span> <span className="text-xs text-muted">{r.chart_category}</span></> : <span className="text-faint">—</span>}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.rating_count > 0 ? <span className="tabular-nums">{Number(r.rating).toFixed(1)} <span className="text-xs text-muted">{fmtCount(r.rating_count)}</span></span> : <span className="text-faint">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      <Toggle checked={r.active} onChange={(v) => toggleActive(r, v)} label={r.active ? t('tracking_on') : t('tracking_off')} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AddCompetitor open={adding} onClose={() => setAdding(false)} onAdded={() => reload({ quiet: true })} />
    </>
  );
}
