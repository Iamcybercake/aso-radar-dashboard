// One detected change: readable lines + "before / after" creatives with changed positions highlighted.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n.jsx';
import { changeLine, imagePair, IMAGE_FIELDS, TEXT_DIFF_FIELDS } from '../lib/changes.js';
import { fmtDateTime } from '../lib/format.js';
import { Geo } from './ui.jsx';

const SHAPE = {
  icon: 'h-16 w-16 rounded-[14px]',
  phone: 'h-44 w-auto aspect-[300/650] rounded-md',
  pad: 'h-32 w-auto aspect-[4/3] rounded-md',
  event: 'h-28 w-auto aspect-video rounded-md',
};

function Strip({ label, urls, compare, shape, img, dim }) {
  const { t } = useLang();
  return (
    <div className="flex gap-3 items-start">
      <span className={`w-12 shrink-0 pt-1 text-xs ${dim ? 'text-saul font-semibold' : 'text-signal font-semibold'}`}>{label}</span>
      {urls.length === 0 ? (
        <span className="text-xs text-faint pt-1">{t('no_items')}</span>
      ) : (
        <div className="flex gap-2.5 overflow-x-auto thin-scroll p-1.5 -m-1.5">
          {urls.map((u, i) => {
            const isNew = !dim && compare[i] !== u;
            return (
              <div key={`${u}-${i}`} className="relative shrink-0">
                <img
                  src={img(u)} alt="" loading="lazy"
                  className={`${SHAPE[shape]} object-cover bg-raised ${dim ? 'opacity-60 saturate-50 border border-saul/50' : ''} ${isNew ? 'ring-2 ring-signal ring-offset-2 ring-offset-panel' : dim ? '' : 'border border-line/60'}`}
                />
                {shape !== 'icon' && <span className={`absolute left-1 top-1 rounded px-1 text-[10px] font-semibold ${isNew ? 'bg-signal text-ink' : dim ? 'bg-saul text-text' : 'bg-ink/70 text-muted'}`}>{i + 1}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TextDiff({ before, after }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button type="button" className="text-xs text-muted hover:text-text underline underline-offset-2 cursor-pointer" onClick={() => setOpen(!open)}>
        {open ? t('show_less') : `${t('before')} / ${t('after')}`}
      </button>
      {open && (
        <div className="mt-2 grid gap-3 md:grid-cols-2 text-xs">
          <div><div className="text-saul font-semibold mb-1">{t('before')}</div><p className="whitespace-pre-line text-muted max-h-56 overflow-auto thin-scroll">{before || '—'}</p></div>
          <div><div className="text-signal font-semibold mb-1">{t('after')}</div><p className="whitespace-pre-line max-h-56 overflow-auto thin-scroll">{after || '—'}</p></div>
        </div>
      )}
    </div>
  );
}

export default function ChangeCard({ change, img, showApp = false, appIcon }) {
  const { lang, t } = useLang();
  const s = change.snapshot || {};
  const fields = s.changed_fields || [];
  const prev = s.prev_values || {};
  const isAccount = change.kind === 'account_change';
  const visuals = fields.filter((f) => IMAGE_FIELDS.includes(f));
  const texts = fields.filter((f) => TEXT_DIFF_FIELDS.includes(f));

  return (
    <article className={`rounded-lg border bg-panel p-4 ${isAccount ? 'border-alarm bg-saul/10' : 'border-line'}`}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
        {showApp && change.app && (
          <Link to={`/app/${change.app.id}`} className="flex items-center gap-2 font-semibold hover:text-signal">
            {appIcon}
            <span>{s.title || change.app.name}</span>
            <Geo cc={change.app.country} />
          </Link>
        )}
        <time className="text-xs text-muted" dateTime={change.detected_at}>{fmtDateTime(change.detected_at, lang)}</time>
        {change.kind !== 'update' && (
          <span className={`text-xs font-bold rounded px-1.5 py-0.5 ${isAccount ? 'bg-saul text-signal' : 'bg-signal text-ink'}`}>{t(`kind_${change.kind}`)}</span>
        )}
      </header>

      <ul className="space-y-0.5">
        {fields.length
          ? fields.map((f) => (
            <li key={f} className={f === 'developer_name' ? 'text-signal font-bold' : ''}>{changeLine(f, prev[f], s[f], lang)}</li>
          ))
          : <li className="whitespace-pre-line text-muted">{change.summary}</li>}
      </ul>

      {texts.map((f) => <TextDiff key={f} before={prev[f]} after={s[f]} />)}

      {visuals.length > 0 && (
        <div className="mt-4 space-y-4">
          {visuals.map((f) => {
            const p = imagePair(f, prev[f], s[f]);
            return (
              <div key={f} className="space-y-2">
                <Strip label={t('before')} urls={p.before} compare={[]} shape={p.shape} img={img} dim />
                <Strip label={t('after')} urls={p.after} compare={p.before} shape={p.shape} img={img} />
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
