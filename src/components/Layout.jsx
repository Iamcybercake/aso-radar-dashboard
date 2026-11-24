import { NavLink, Outlet } from 'react-router-dom';
import { useLang } from '../lib/i18n.jsx';
import { api, DEMO } from '../lib/api.js';

export function RadarMark({ className = 'size-6' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="13" fill="none" stroke="var(--color-faint)" strokeWidth="2" />
      <circle cx="16" cy="16" r="7" fill="none" stroke="var(--color-faint)" strokeWidth="2" />
      <path d="M16 16 L16 3 A13 13 0 0 1 27.3 9.5 Z" fill="var(--color-signal)" opacity=".8" />
      <circle cx="23" cy="9" r="2.2" fill="var(--color-signal)" />
    </svg>
  );
}

export function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex rounded-md border border-line overflow-hidden text-xs" role="group" aria-label="Language">
      {['en', 'ru'].map((l) => (
        <button
          key={l} type="button" onClick={() => setLang(l)} aria-pressed={lang === l}
          className={`px-2 py-1 uppercase cursor-pointer ${lang === l ? 'bg-raised text-text' : 'text-faint hover:text-text'}`}
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
      <header className="sticky top-0 z-20 border-b border-line bg-ink/95 backdrop-blur">
        <div className="mx-auto max-w-[1400px] px-4 h-12 flex items-center gap-3 sm:gap-4">
          <NavLink to="/" className="flex items-center gap-2 font-semibold shrink-0">
            <RadarMark /> <span className="hidden sm:inline font-extrabold italic tracking-tight text-signal text-[15px]">ASO Radar</span>
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
