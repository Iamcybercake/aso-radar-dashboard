// "Add competitor" dialog: paste an App Store link -> parse storefront + id -> insert into `apps`.
import { useState } from 'react';
import { useLang } from '../lib/i18n.jsx';
import { api } from '../lib/api.js';
import { parseStoreLink } from '../lib/format.js';
import { Modal } from './ui.jsx';

export default function AddCompetitor({ open, onClose, onAdded }) {
  const { t } = useLang();
  const [link, setLink] = useState('');
  const [geo, setGeo] = useState('');
  const [msg, setMsg] = useState(null); // { kind: 'error' | 'ok', text }
  const [busy, setBusy] = useState(false);
  const parsed = parseStoreLink(link);

  const reset = () => { setLink(''); setGeo(''); setMsg(null); };
  const close = () => { reset(); onClose(); };

  const onLink = (v) => {
    setLink(v); setMsg(null);
    const p = parseStoreLink(v);
    if (p) setGeo(p.country);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!parsed) { setMsg({ kind: 'error', text: t('add_bad_link') }); return; }
    const country = geo.trim().toLowerCase();
    if (!/^[a-z]{2}$/.test(country)) { setMsg({ kind: 'error', text: t('add_bad_link') }); return; }
    setBusy(true);
    try {
      await api.addApp({ appStoreId: parsed.appStoreId, country, name: parsed.slugName });
      setMsg({ kind: 'ok', text: t('add_done') });
      setLink('');
      onAdded?.();
    } catch (err) {
      setMsg({ kind: 'error', text: err.code === 'duplicate' ? t('add_duplicate') : err.message });
    }
    setBusy(false);
  };

  return (
    <Modal open={open} onClose={close} title={t('add_title')}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-xs text-muted">{t('add_link')}</span>
          <input className="input w-full" autoFocus value={link} onChange={(e) => onLink(e.target.value)} placeholder={t('add_link_ph')} />
        </label>
        {parsed && (
          <div className="flex items-end gap-4">
            <label className="block space-y-1">
              <span className="text-xs text-muted">{t('add_geo')}</span>
              <input className="input w-20 uppercase" maxLength={2} value={geo} onChange={(e) => setGeo(e.target.value)} />
            </label>
            <div className="text-xs text-muted pb-2">
              <span className="font-mono">id{parsed.appStoreId}</span>{parsed.slugName && <span className="ml-3">{parsed.slugName}</span>}
            </div>
          </div>
        )}
        {parsed && <p className="text-xs text-faint -mt-2">{t('add_geo_hint')}</p>}
        {msg && <p role="status" className={`text-sm ${msg.kind === 'ok' ? 'text-signal' : 'text-alarm'}`}>{msg.text}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn" onClick={close}>{msg?.kind === 'ok' ? t('close') : t('cancel')}</button>
          <button className="btn btn-primary" disabled={busy || !link}>{t('add_save')}</button>
        </div>
      </form>
    </Modal>
  );
}
