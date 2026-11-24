import { NavLink, Outlet } from 'react-router-dom';
import { useLang } from '../lib/i18n.jsx';
import { api, DEMO } from '../lib/api.js';

export function RadarMark({ className = 'size-6' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="13" fill="none" stroke="var(--color-signal)" strokeOpacity=".45" strokeWidth="2" />
      <circle cx="16" cy="16" r="7" fill="none" stroke="var(--color-signal)" strokeOpacity=".45" strokeWidth="2" />
      <path d="M16 16 L16 3 A13 13 0 0 1 27.3 9.5 Z" fill="var(--color-signal)" opacity=".8" />
      <circle cx="23" cy="9" r="2.2" fill="var(--color-signal)" />
    </svg>
  );
}

// Logo lockup after "Better Call Saul": white word + bold yellow word on a compact crimson plaque
export function Wordmark({ className = '', size = 'text-[17px]' }) {
  return (
    <span className={`items-center gap-1.5 font-extrabold italic tracking-tight leading-none ${size} ${className}`}>
      <span className="text-text">ASO</span>
      <span className="rounded-[3px] bg-saul px-1.5 py-1 text-signal">Radar</span>
    </span>
  );
}

export function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex rounded-md border border-line overflow-hidden text-xs" role="group" aria-label="Language">
      {['en', 'ru'].map((l) => (
        <button
          key={l} type="button" onClick={() => setLang(l)} aria-pressed={lang === l}
          className={`px-2 py-1 uppercase cursor-pointer ${lang === l ? 'bg-raised text-text font-semibold' : 'text-faint hover:text-text'}`}
        >{l}</button>
      ))}
    </div>
  );
}

export default function Layout() {
  const { t } = useLang();
  const link = ({ isActive }) => `px-2.5 py-1 rounded-md ${isActive ? 'bg-signal text-ink font-semibold' : 'text-muted hover:text-text'}`;
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-ink border-b border-line">
        <div className="mx-auto max-w-[1400px] px-4 h-12 flex items-center gap-3 sm:gap-4">
          <NavLink to="/" className="flex items-center gap-2 font-semibold shrink-0">
            <RadarMark /> <Wordmark className="hidden sm:inline-flex" />
          </NavLink>
          <nav className="flex gap-1 text-sm">
            <NavLink to="/" end className={link}>{t('nav_competitors')}</NavLink>
            <NavLink to="/changes" className={link}>{t('nav_changes')}</NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {DEMO && <span className="hidden sm:inline text-xs text-signal">{t('demo_badge')}</span>}
            <LangSwitch />
            {!DEMO && <button type="button" className="text-xs text-muted hover:text-text cursor-pointer" onClick={() => api.signOut()}>{t('sign_out')}</button>}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-5">
        <Outlet />
      </main>
    </div>
  );
}
