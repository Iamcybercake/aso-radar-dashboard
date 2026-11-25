// One competitor: header, lifetimes, tags, timeline (changes + manual marks), current store page.
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLang } from '../lib/i18n.jsx';
import { api } from '../lib/api.js';
import { makeImg, useAsync } from '../lib/hooks.js';
import { daysBetween, fmtCount, fmtDate, fmtDateTime, storeUrl } from '../lib/format.js';
import { AppIcon, Empty, ErrorBox, Geo, Loading, Modal, Status, Tag } from '../components/ui.jsx';
import ChangeCard from '../components/ChangeCard.jsx';

const MARK_TYPES = ['top1', 'top3', 'top10', 'motivated_traffic', 'offer_change', 'featured', 'other'];

function Histogram({ h }) {
  if (!h) return null;
  const total = Object.values(h).reduce((a, b) => a + Number(b || 0), 0) || 1;
  return (
    <div className="space-y-0.5 w-32" aria-label="Rating histogram">
      {[5, 4, 3, 2, 1].map((s) => (
        <div key={s} className="flex items-center gap-1.5 text-[10px] text-faint">
          <span className="w-2">{s}</span>
          <div className="h-1.5 flex-1 rounded-full bg-raised overflow-hidden">
            <div className="h-full bg-muted" style={{ width: `${(Number(h[s] || 0) / total) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Life({ label, days, sub }) {
  const { t } = useLang();
  return (
    <div className="rounded-lg border border-line bg-panel px-4 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-2xl font-semibold mt-0.5 tabular-nums">
        {days != null ? <>{days}<span className="text-sm text-muted font-normal ml-1">{t('days_short')}</span></> : <span className="text-base text-faint font-normal">{t('life_unknown')}</span>}
      </div>
      {sub && <div className="text-xs text-faint mt-0.5">{sub}</div>}
    </div>
  );
}

function Section({ title, children, count }) {
  return (
    <section className="py-3 border-b border-line/60 last:border-0">
      <h3 className="text-xs text-muted mb-2">{title}{count != null && <span className="text-faint ml-1">{count}</span>}</h3>
      {children}
    </section>
  );
}

function Shots({ urls, img, pad }) {
  const { t } = useLang();
  if (!urls?.length) return <p className="text-xs text-faint">{t('no_items')}</p>;
  return (
    <div className="flex gap-2 overflow-x-auto thin-scroll p-1 -m-1">
      {urls.map((u, i) => (
        <img key={`${u}-${i}`} src={img(u)} alt="" loading="lazy"
          className={`shrink-0 rounded-md border border-line/60 object-cover bg-raised ${pad ? 'h-28 aspect-[4/3]' : 'h-52 aspect-[300/650]'}`} />
      ))}
    </div>
  );
}

function StorePreview({ s, img }) {
  const { t, lang } = useLang();
  const [full, setFull] = useState(false);
  if (!s) return null;
  return (
    <div className="rounded-lg border border-line bg-panel px-4">
      <Section title={t('iphone')} count={s.screenshot_urls?.length}><Shots urls={s.screenshot_urls} img={img} /></Section>
      {s.ipad_screenshot_urls?.length > 0 && (
        <Section title={t('ipad')} count={s.ipad_screenshot_urls.length}><Shots urls={s.ipad_screenshot_urls} img={img} pad /></Section>
      )}
      <Section title={t('events')} count={s.events?.length || 0}>
        {s.events?.length ? (
          <div className="space-y-3">
            {s.events.map((e) => (
              <div key={e.id} className="flex gap-3">
                {e.image && <img src={img(e.image)} alt="" className="h-16 aspect-video rounded object-cover shrink-0" loading="lazy" />}
                <div className="text-sm min-w-0">
                  <div className="font-medium">{e.title}</div>
                  <div className="text-xs text-muted">{e.subtitle}</div>
                  <div className="text-xs text-faint mt-0.5">{fmtDate(e.start, lang)} – {fmtDate(e.end, lang)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-faint">{t('no_items')}</p>}
      </Section>
      <Section title={t('iap')} count={s.iap?.length || 0}>
        {s.iap?.length ? (
          <table className="w-full text-sm"><tbody>
            {s.iap.map((i, k) => (
              <tr key={k}><td className="py-0.5">{i.name}</td><td className="py-0.5 text-right text-muted whitespace-nowrap">{i.price}</td></tr>
            ))}
          </tbody></table>
        ) : <p className="text-xs text-faint">{t('no_items')}</p>}
      </Section>
      {s.release_notes && (
        <Section title={`${t('whats_new')} ${s.version || ''}`}><p className="text-sm whitespace-pre-line">{s.release_notes}</p></Section>
      )}
      <Section title={t('description')}>
        <p className={`text-sm whitespace-pre-line text-muted ${full ? '' : 'line-clamp-6'}`}>{s.description || '—'}</p>
        {s.description?.length > 300 && (
          <button type="button" className="text-xs text-muted underline underline-offset-2 mt-1 cursor-pointer" onClick={() => setFull(!full)}>
            {full ? t('show_less') : t('show_more')}
          </button>
        )}
      </Section>
      <Section title={t('privacy')}>
        <div className="flex flex-wrap gap-1">{(s.privacy_labels || []).map((p) => <Tag key={p.type}>{p.type}</Tag>)}</div>
      </Section>
      {s.more_by_developer?.length > 0 && (
        <Section title={t('more_by_dev')} count={s.more_by_developer.length}>
          <ul className="text-sm space-y-0.5">{s.more_by_developer.map((a) => <li key={a.id}>{a.title}</li>)}</ul>
        </Section>
      )}
    </div>
  );
}

function MarkItem({ m, endAt, onDelete }) {
  const { t, lang, dict } = useLang();
  const after = daysBetween(m.marked_at, endAt || undefined);
  return (
    <article className="rounded-lg border border-amber/40 bg-amber/5 p-4">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-semibold text-amber">{dict.marks[m.type] || m.type}</span>
        {m.keyword && <span className="rounded bg-raised px-1.5 text-xs font-mono">{m.keyword}</span>}
        <time className="text-xs text-muted">{fmtDate(m.marked_at, lang)}</time>
        <span className="text-sm">
          {t('days_after_mark', after ?? 0)}{endAt && <span className="text-faint"> ({t('until_removed')})</span>}
        </span>
        <button type="button" className="ml-auto text-xs text-faint hover:text-alarm cursor-pointer" onClick={onDelete}>{t('delete')}</button>
      </header>
      {m.note && <p className="text-sm text-muted mt-1">{m.note}</p>}
    </article>
  );
}

function AddMark({ open, onClose, appId, onSaved }) {
  const { t, dict } = useLang();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ type: 'top1', marked_at: today, keyword: '', note: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      await api.addMark({ app_id: appId, type: form.type, marked_at: form.marked_at, keyword: form.keyword.trim() || null, note: form.note.trim() || null });
      setForm({ type: 'top1', marked_at: today, keyword: '', note: '' });
      onSaved(); onClose();
    } catch (x) { setErr(x.message); }
    setBusy(false);
  };
  return (
    <Modal open={open} onClose={onClose} title={t('add_mark')}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 block"><span className="text-xs text-muted">{t('mark_type')}</span>
            <select className="input w-full" value={form.type} onChange={upd('type')}>
              {MARK_TYPES.map((k) => <option key={k} value={k}>{dict.marks[k]}</option>)}
            </select>
          </label>
          <label className="space-y-1 block"><span className="text-xs text-muted">{t('mark_date')}</span>
            <input type="date" className="input w-full" value={form.marked_at} max={today} onChange={upd('marked_at')} required />
          </label>
        </div>
        <label className="space-y-1 block"><span className="text-xs text-muted">{t('mark_keyword')}</span>
          <input className="input w-full" value={form.keyword} onChange={upd('keyword')} />
        </label>
        <label className="space-y-1 block"><span className="text-xs text-muted">{t('mark_note')}</span>
          <textarea className="input w-full" rows={2} value={form.note} onChange={upd('note')} />
        </label>
        {err && <p className="text-sm text-alarm">{err}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn" onClick={onClose}>{t('cancel')}</button>
          <button className="btn btn-primary" disabled={busy}>{t('save')}</button>
        </div>
      </form>
    </Modal>
  );
}

function Tags({ appId, tags, onChange }) {
  const { t } = useLang();
  const [val, setVal] = useState('');
  const add = async (e) => {
    e.preventDefault();
    const tag = val.trim().toLowerCase();
    if (!tag) return;
    try { await api.addTag(appId, tag); } catch { /* duplicate tag: ignore */ }
    setVal(''); onChange();
  };
  return (
    <form onSubmit={add} className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-muted mr-1">{t('tags')}</span>
      {tags.map((x) => <Tag key={x.id} onRemove={async () => { await api.removeTag(x.id); onChange(); }}>{x.tag}</Tag>)}
      <input className="input py-0.5 text-xs w-32" value={val} onChange={(e) => setVal(e.target.value)} placeholder={`+ ${t('tag_ph')}`} aria-label={t('add_tag')} />
    </form>
  );
}

export default function AppPage() {
  const { id } = useParams();
  const appId = Number(id);
  const { t, lang } = useLang();
  const [marking, setMarking] = useState(false);
  const { data, error, loading, reload } = useAsync(async () => {
    const [app, snap, changes, marks, tags, assets, checks] = await Promise.all([
      api.app(appId), api.latestSnapshot(appId), api.appChanges(appId), api.marks(appId),
      api.allTags(), api.appAssets([appId]), api.snapshotCount(appId),
    ]);
    return { app, snap, changes, marks, tags: tags.filter((x) => x.app_id === appId), img: makeImg(assets), checks };
  }, [appId]);

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorBox error={error} onRetry={reload} />;
  if (!data.app) return <Empty>404</Empty>;

  const { app, snap: s, img } = data;
  const end = app.removed_at || undefined;
  const timeline = [
    ...data.changes.map((c) => ({ kind: 'change', at: c.detected_at, c })),
    ...data.marks.map((m) => ({ kind: 'mark', at: `${m.marked_at}T23:59:59`, m })),
  ].sort((a, b) => String(b.at).localeCompare(String(a.at)));

  return (
    <div className="space-y-5">
      <Link to="/" className="text-sm text-muted hover:text-text">← {t('back')}</Link>

      <header className="flex flex-wrap gap-5 items-start">
        <AppIcon src={img(s?.icon_url)} name={app.title || app.name} size={88} />
        <div className="min-w-[200px] flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-2xl font-semibold leading-tight">{app.title || app.name}</h1>
            <Geo cc={app.country} />
            <Status status={app.status} />
            {s?.editors_choice && <span className="text-xs font-semibold text-signal">{t('editors_choice')}</span>}
          </div>
          {s?.subtitle && <p className="text-muted mt-0.5">{s.subtitle}</p>}
          <dl className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm">
            {[
              [t('developer'), s?.developer_name],
              s?.seller_name && s.seller_name !== s.developer_name ? [t('seller'), s.seller_name] : null,
              [t('version'), s?.version],
              [t('category'), s?.category],
              [t('age_rating'), s?.content_rating],
              [t('size'), s?.size],
              [t('chart_pos'), s?.chart_rank ? `#${s.chart_rank} ${s.chart_category || ''}` : null],
            ].filter(Boolean).map(([k, v]) => (
              <div key={k}><dt className="text-xs text-faint">{k}</dt><dd>{v || '—'}</dd></div>
            ))}
          </dl>
        </div>
        <div className="flex items-center gap-4">
          {s?.rating_count > 0 && (
            <div className="text-right">
              <div className="text-2xl font-semibold tabular-nums">{Number(s.rating).toFixed(1)}</div>
              <div className="text-xs text-muted">{fmtCount(s.rating_count)} {t('ratings')}</div>
            </div>
          )}
          <Histogram h={s?.rating_histogram} />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted">
        <a className="underline underline-offset-2 hover:text-text" href={storeUrl(app.country, app.app_store_id)} target="_blank" rel="noreferrer">{t('open_store')}</a>
        <span className="font-mono">id{app.app_store_id}</span>
        <span>{t('checked')}: {fmtDateTime(app.last_checked_at, lang)}</span>
        <span>{t('snapshots_count', data.checks ?? 0)}</span>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Life label={t('life_released')} days={daysBetween(s?.first_released_at, end)} sub={s?.first_released_at && fmtDate(s.first_released_at, lang)} />
        <Life label={t('life_update')} days={daysBetween(s?.version_released_at, end)} sub={s?.version_released_at && `${s.version}, ${fmtDate(s.version_released_at, lang)}`} />
        <Life label={t('life_tracked')} days={daysBetween(app.tracked_since, end)} sub={app.tracked_since && fmtDate(app.tracked_since, lang)} />
        {app.status === 'removed'
          ? <Life label={t('life_removed')} days={daysBetween(app.removed_at)} sub={fmtDate(app.removed_at, lang)} />
          : <Life label={t('col_last_change')} days={daysBetween(app.last_change_at)} sub={app.last_change_at && fmtDate(app.last_change_at, lang)} />}
      </div>

      <Tags appId={appId} tags={data.tags} onChange={() => reload({ quiet: true })} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] items-start">
        <section>
          <div className="flex items-center mb-3">
            <h2 className="text-base font-semibold h-bar">{t('timeline')}</h2>
            <button type="button" className="btn ml-auto" onClick={() => setMarking(true)}>+ {t('add_mark')}</button>
          </div>
          {timeline.length === 0 ? <Empty>{t('timeline_empty')}</Empty> : (
            <ol className="relative space-y-3 border-l border-line pl-5 ml-1.5">
              {timeline.map((it) => (
                <li key={`${it.kind}-${it.c?.id ?? it.m.id}`} className="relative">
                  <span className={`absolute -left-[26px] top-5 size-2.5 rounded-full ring-4 ring-ink ${it.kind === 'mark' ? 'bg-amber' : it.c.kind === 'account_change' ? 'bg-saul' : 'bg-signal'}`} />
                  {it.kind === 'change'
                    ? <ChangeCard change={it.c} img={img} />
                    : <MarkItem m={it.m} endAt={app.removed_at} onDelete={async () => { await api.deleteMark(it.m.id); reload({ quiet: true }); }} />}
                </li>
              ))}
            </ol>
          )}
        </section>
        <aside>
          <h2 className="text-base font-semibold mb-3 h-bar">{t('store_preview')}</h2>
          {s ? <StorePreview s={s} img={img} /> : <Empty>{t('no_data_yet')}</Empty>}
        </aside>
      </div>

      <AddMark open={marking} onClose={() => setMarking(false)} appId={appId} onSaved={() => reload({ quiet: true })} />
    </div>
  );
}
