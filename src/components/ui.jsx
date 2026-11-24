// Small shared UI pieces
import { useEffect, useRef } from 'react';
import { useLang } from '../lib/i18n.jsx';
import { flag } from '../lib/format.js';

export function Geo({ cc }) {
  return (
    <span className="inline-flex items-center gap-1 text-muted whitespace-nowrap">
      <span aria-hidden>{flag(cc)}</span>
      <span className="uppercase text-xs font-mono">{cc}</span>
    </span>
  );
}

export function Status({ status }) {
  const { t } = useLang();
  const removed = status === 'removed';
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs whitespace-nowrap ${removed ? 'text-alarm' : 'text-muted'}`}>
      <span className={`size-1.5 rounded-full ${removed ? 'bg-alarm' : 'bg-muted'}`} />
      {removed ? t('status_removed') : t('status_live')}
    </span>
  );
}

export function AppIcon({ src, name, size = 36 }) {
  const style = { width: size, height: size, borderRadius: size * 0.225 };
  if (!src) {
    return (
      <div style={style} className="bg-raised border border-line grid place-items-center text-faint text-xs font-semibold shrink-0">
        {(name || '?').slice(0, 2)}
      </div>
    );
  }
  return <img src={src} alt="" style={style} className="shrink-0 object-cover border border-line/60" loading="lazy" />;
}

export function Loading() {
  return (
    <div className="py-16 grid place-items-center" role="status" aria-label="Loading">
      <div className="size-6 rounded-full border-2 border-line border-t-signal animate-spin" />
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  const { t } = useLang();
  return (
    <div className="my-6 rounded-lg border border-alarm/40 bg-alarm/10 p-4 text-sm">
      <p>{t('load_error')} <span className="text-alarm">{error?.message || String(error)}</span></p>
      {onRetry && <button type="button" className="btn mt-3" onClick={() => onRetry()}>{t('retry')}</button>}
    </div>
  );
}

export function Empty({ children, action }) {
  return (
    <div className="my-6 rounded-lg border border-dashed border-line p-8 text-center text-muted">
      <p>{children}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Accessible modal dialog on top of <dialog>
export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className={`m-auto w-[calc(100%-2rem)] ${width} rounded-xl border border-line bg-panel text-text p-0 backdrop:bg-black/60`}
    >
      {open && (
        <div className="p-5">
          <h2 className="text-base font-semibold mb-4">{title}</h2>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer ${checked ? 'bg-signal/25' : 'bg-line'}`}
    >
      <span className={`absolute top-0.5 size-4 rounded-full transition-all ${checked ? 'bg-signal' : 'bg-faint'} ${checked ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  );
}

export function Tag({ children, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-raised border border-line px-1.5 py-px text-xs text-muted">
      {children}
      {onRemove && (
        <button type="button" onClick={onRemove} className="text-faint hover:text-alarm cursor-pointer" aria-label={`Remove ${children}`}>×</button>
      )}
    </span>
  );
}
