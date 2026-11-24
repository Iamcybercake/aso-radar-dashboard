// Data access layer. Every screen talks to Supabase only through these functions,
// so the demo (mock) mode can swap in fake data with the same shape.
import { createClient } from '@supabase/supabase-js';
import * as mock from './mock.js';

const SB_URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const DEMO = import.meta.env.VITE_DEMO === '1' || !SB_URL || !KEY;

export const supabase = DEMO ? null : createClient(SB_URL, KEY);

// Throw Supabase errors so screens can show them
const run = async (p) => {
  const { data, error } = await p;
  if (error) throw error;
  return data;
};

// Columns we need from a snapshot to render a change (keeps payloads small)
const SNAP_COLS = 'id, captured_at, changed_fields, prev_values, title, subtitle, promo_text, description, release_notes, '
  + 'version, developer_name, seller_name, developer_website, privacy_url, icon_url, screenshot_urls, ipad_screenshot_urls, '
  + 'preview_videos, category, content_rating, languages, iap, events, privacy_labels, editors_choice, more_by_developer';

const real = {
  // ---- auth ----
  async getSession() { return (await supabase.auth.getSession()).data.session; },
  onAuthChange(cb) {
    const { data } = supabase.auth.onAuthStateChange((_e, session) => cb(session));
    return () => data.subscription.unsubscribe();
  },
  async signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },
  async signOut() { await supabase.auth.signOut(); },

  // ---- competitors ----
  overview: () => run(supabase.from('app_overview').select('*').order('created_at', { ascending: false })),
  allTags: () => run(supabase.from('tags').select('id, app_id, tag')),
  iconAssets: () => run(supabase.from('assets').select('apple_url, public_url').eq('kind', 'icon')),
  setActive: (appId, active) => run(supabase.from('apps').update({ active }).eq('id', appId)),
  async addApp({ appStoreId, country, name }) {
    const { error } = await supabase.from('apps').insert({
      app_store_id: Number(appStoreId), country, name, source: 'manual',
    });
    if (error) {
      if (error.code === '23505') { const e = new Error('duplicate'); e.code = 'duplicate'; throw e; }
      throw error;
    }
  },

  // ---- one app ----
  app: (id) => run(supabase.from('app_overview').select('*').eq('id', id).maybeSingle()),
  latestSnapshot: (id) => run(supabase.from('latest_snapshots').select('*').eq('app_id', id).maybeSingle()),
  appChanges: (id) => run(
    supabase.from('changes').select(`id, detected_at, kind, summary, app_id, snapshot:snapshots(${SNAP_COLS})`)
      .eq('app_id', id).order('detected_at', { ascending: false }),
  ),
  marks: (id) => run(supabase.from('marks').select('*').eq('app_id', id).order('marked_at', { ascending: false })),
  addMark: (row) => run(supabase.from('marks').insert(row)),
  deleteMark: (id) => run(supabase.from('marks').delete().eq('id', id)),
  addTag: (appId, tag) => run(supabase.from('tags').insert({ app_id: appId, tag })),
  removeTag: (id) => run(supabase.from('tags').delete().eq('id', id)),
  appAssets: (ids) => run(supabase.from('assets').select('apple_url, public_url').in('app_id', ids)),
  snapshotCount: async (id) => {
    const { count, error } = await supabase.from('snapshots').select('id', { count: 'exact', head: true }).eq('app_id', id);
    if (error) throw error;
    return count;
  },

  // ---- changes feed ----
  feed: ({ from = 0, size = 50, kind } = {}) => {
    let q = supabase.from('changes')
      .select(`id, detected_at, kind, summary, app_id, app:apps(id, name, country, app_store_id), snapshot:snapshots(${SNAP_COLS})`)
      .order('detected_at', { ascending: false })
      .range(from, from + size - 1);
    if (kind) q = q.eq('kind', kind);
    return run(q);
  },
};

export const api = DEMO ? mock.api : real;
