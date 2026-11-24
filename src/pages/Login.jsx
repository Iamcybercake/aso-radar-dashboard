import { useState } from 'react';
import { useLang } from '../lib/i18n.jsx';
import { api } from '../lib/api.js';
import { LangSwitch, RadarMark, Wordmark } from '../components/Layout.jsx';

// Email + password only. Sign-ups are disabled in Supabase Auth, so there is no "create account" link.
export default function Login() {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try { await api.signIn(email.trim(), password); } catch { setErr(t('login_failed')); }
    setBusy(false);
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="absolute top-4 right-4"><LangSwitch /></div>
      <form onSubmit={submit} className="w-full max-w-xs space-y-4 rounded-xl bg-panel border border-line p-6">
        <div className="flex items-center gap-3 mb-6">
          <RadarMark className="size-10" />
          <h1 className="text-base font-semibold space-y-2"><Wordmark className="flex" size="text-2xl" /><span className="block text-muted font-normal">{t('login_title')}</span></h1>
        </div>
        <label className="block space-y-1">
          <span className="text-xs text-muted">{t('email')}</span>
          <input className="input w-full" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-muted">{t('password')}</span>
          <input className="input w-full" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {err && <p className="text-sm text-alarm" role="alert">{err}</p>}
        <button className="btn btn-primary w-full justify-center" disabled={busy}>{t('sign_in')}</button>
      </form>
    </div>
  );
}
