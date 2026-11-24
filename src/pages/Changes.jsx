// Feed of all detected changes across competitors, newest first, loaded in pages of 50.
import { useEffect, useMemo, useState } from 'react';
import { useLang } from '../lib/i18n.jsx';
import { api } from '../lib/api.js';
import { makeImg } from '../lib/hooks.js';
import { FIELD_GROUP, GROUPS } from '../lib/changes.js';
import { AppIcon, Empty, ErrorBox, Loading } from '../components/ui.jsx';
import ChangeCard from '../components/ChangeCard.jsx';

const PAGE = 50;
const KINDS = ['update', 'account_change', 'removed', 'new_app'];

export default function Changes() {
  const { t } = useLang();
  const [kind, setKind] = useState('');
  const [group, setGroup] = useState('');
  const [geo, setGeo] = useState('');
  const [items, setItems] = useState([]);
  const [assets, setAssets] = useState([]);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async (from, reset) => {
    setLoading(true); setError(null);
    try {
      const rows = await api.feed({ from, size: PAGE, kind: kind || undefined });
      const ids = [...new Set(rows.map((r) => r.app_id))];
      const a = ids.length ? await api.appAssets(ids) : [];
      setItems((prev) => (reset ? rows : [...prev, ...rows]));
      setAssets((prev) => (reset ? a : [...prev, ...a]));
      setDone(rows.length < PAGE);
    } catch (e) { setError(e); }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(0, true); }, [kind]);

  const img = useMemo(() => makeImg(assets), [assets]);
  const geos = [...new Set(items.map((c) => c.app?.country).filter(Boolean))].sort();
  const shown = items.filter((c) => {
    if (geo && c.app?.country !== geo) return false;
    if (group && !(c.snapshot?.changed_fields || []).some((f) => FIELD_GROUP[f] === group)) return false;
    return true;
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <h1 className="text-base font-semibold mr-3">{t('feed_title')}</h1>
        <select className="input" value={kind} onChange={(e) => setKind(e.target.value)} aria-label={t('all_kinds')}>
          <option value="">{t('all_kinds')}</option>
          {KINDS.map((k) => <option key={k} value={k}>{t(`kind_${k}`)}</option>)}
        </select>
        <select className="input" value={group} onChange={(e) => setGroup(e.target.value)} aria-label={t('all_fields')}>
          <option value="">{t('all_fields')}</option>
          {GROUPS.map((g) => <option key={g} value={g}>{t(`grp_${g}`)}</option>)}
        </select>
        <select className="input" value={geo} onChange={(e) => setGeo(e.target.value)} aria-label={t('all_geos')}>
          <option value="">{t('all_geos')}</option>
          {geos.map((g) => <option key={g} value={g}>{g.toUpperCase()}</option>)}
        </select>
      </div>

      {error && <ErrorBox error={error} onRetry={() => load(0, true)} />}
      {!loading && !error && shown.length === 0 && <Empty>{items.length ? t('nothing_found') : t('feed_empty')}</Empty>}

      <div className="space-y-3 max-w-5xl">
        {shown.map((c) => (
          <ChangeCard
            key={c.id} change={c} img={img} showApp
            appIcon={<AppIcon src={img(c.snapshot?.icon_url)} name={c.app?.name} size={28} />}
          />
        ))}
      </div>

      {loading ? <Loading /> : !done && items.length > 0 && (
        <div className="py-6"><button type="button" className="btn" onClick={() => load(items.length, false)}>{t('load_more')}</button></div>
      )}
    </>
  );
}
