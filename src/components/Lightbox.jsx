// Full-screen image viewer. Any screen calls useLightbox().open(urls, index).
// Keys: ← → to switch, Esc to close. Click outside the image to close.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLang } from '../lib/i18n.jsx';

const Ctx = createContext({ open: () => {} });
export const useLightbox = () => useContext(Ctx);

export function LightboxProvider({ children }) {
  const [state, setState] = useState(null); // { urls, index, label }
  const open = useCallback((urls, index = 0, label = '') => setState({ urls: urls.filter(Boolean), index, label }), []);
  const close = () => setState(null);
  const go = (d) => setState((s) => s && { ...s, index: (s.index + d + s.urls.length) % s.urls.length });

  useEffect(() => {
    if (!state) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [state]);

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      {state && <Viewer state={state} onClose={close} onGo={go} />}
    </Ctx.Provider>
  );
}

function Viewer({ state, onClose, onGo }) {
  const { t } = useLang();
  const url = state.urls[state.index];
  const many = state.urls.length > 1;
  const navBtn = 'absolute top-1/2 -translate-y-1/2 size-11 rounded-full bg-panel/90 border border-line text-xl text-text hover:bg-raised cursor-pointer';
  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="flex items-center gap-4 px-4 h-12 text-sm text-muted shrink-0 bg-black border-b border-line" onClick={(e) => e.stopPropagation()}>
        <span>{state.label}{many && <span className="ml-2 tabular-nums">{state.index + 1} / {state.urls.length}</span>}</span>
        <a href={url} target="_blank" rel="noreferrer" className="ml-auto underline underline-offset-2 hover:text-text">{t('open_original')}</a>
        <button type="button" onClick={onClose} className="text-2xl leading-none text-text hover:text-signal cursor-pointer" aria-label={t('close')}>×</button>
      </div>
      <div className="relative flex-1 min-h-0 flex items-center justify-center p-4 pt-0">
        <img src={url} alt="" className="max-h-full max-w-full object-contain rounded-md" onClick={(e) => e.stopPropagation()} />
        {many && (
          <>
            <button type="button" className={`${navBtn} left-4`} onClick={(e) => { e.stopPropagation(); onGo(-1); }} aria-label="Previous">‹</button>
            <button type="button" className={`${navBtn} right-4`} onClick={(e) => { e.stopPropagation(); onGo(1); }} aria-label="Next">›</button>
          </>
        )}
      </div>
    </div>
  );
}

// Clickable thumbnail that opens the viewer on the whole set
export function Thumb({ urls, index, label, className, children }) {
  const { open } = useLightbox();
  return (
    <button type="button" className={`block cursor-zoom-in ${className || ''}`} onClick={() => open(urls, index, label)}>
      {children}
    </button>
  );
}
