// Turns a snapshot's changed_fields + prev_values into readable, bilingual lines.
// Same logic as the n8n "Build alert" node, but rendered in the UI language.

export const FIELD_GROUP = {
  title: 'meta', subtitle: 'meta', promo_text: 'meta', description: 'meta', version: 'meta', release_notes: 'meta',
  category: 'meta', content_rating: 'meta', languages: 'meta', editors_choice: 'meta', privacy_labels: 'meta',
  icon_url: 'creatives', screenshot_urls: 'creatives', ipad_screenshot_urls: 'creatives', preview_videos: 'creatives',
  events: 'events', iap: 'iap',
  developer_name: 'account', seller_name: 'account', developer_website: 'account', privacy_url: 'account',
  more_by_developer: 'account',
};
export const GROUPS = ['meta', 'creatives', 'events', 'iap', 'account'];

// Fields shown as image strips "before / after"
export const IMAGE_FIELDS = ['icon_url', 'screenshot_urls', 'ipad_screenshot_urls', 'events'];

const L = {
  en: {
    title: 'Title', subtitle: 'Subtitle', promo_text: 'Promo text', version: 'Version', description: 'Description changed',
    release_notes: "New What's New", account: 'ACCOUNT CHANGE', seller: 'Seller changed', category: 'Category',
    content_rating: 'Age rating', ec_on: "Got Editors' Choice", ec_off: "Lost Editors' Choice",
    shots_iphone: 'iPhone screenshots', shots_ipad: 'iPad screenshots', new_at: 'new at positions', some_removed: 'some removed',
    events: 'Events', details: 'details changed', iap: 'IAP', order: 'order changed', icon: 'New icon',
    video: 'Preview video changed', privacy: 'Privacy labels changed', languages: 'Languages', website: 'Developer website',
    privacy_url: 'Privacy policy', new_dev_app: 'New app by developer', dev_list: 'Developer app list changed', changed: 'changed',
  },
  ru: {
    title: 'Название', subtitle: 'Subtitle', promo_text: 'Promo text', version: 'Версия', description: 'Описание изменено',
    release_notes: "Новый What's New", account: 'СМЕНА АККАУНТА', seller: 'Смена продавца', category: 'Категория',
    content_rating: 'Возрастной рейтинг', ec_on: "Получили Editors' Choice", ec_off: "Потеряли Editors' Choice",
    shots_iphone: 'Скрины iPhone', shots_ipad: 'Скрины iPad', new_at: 'новые на позициях', some_removed: 'часть удалена',
    events: 'Ивенты', details: 'изменены детали', iap: 'IAP', order: 'изменён порядок', icon: 'Новая иконка',
    video: 'Видео-превью изменено', privacy: 'Privacy labels изменены', languages: 'Языки', website: 'Сайт разработчика',
    privacy_url: 'Privacy policy', new_dev_app: 'Новое приложение разработчика', dev_list: 'Список приложений разработчика изменён',
    changed: 'изменено',
  },
};

const short = (s, n = 80) => (s && s.length > n ? `${s.slice(0, n)}…` : s ?? '—');
const q = (s) => `«${short(s)}»`;
const diffBy = (oldArr, newArr, keyFn) => {
  const o = new Set((oldArr || []).map(keyFn));
  const n = new Set((newArr || []).map(keyFn));
  return { added: [...n].filter((k) => !o.has(k)), removed: [...o].filter((k) => !n.has(k)) };
};

export function changeLine(field, oldV, newV, lang = 'ru') {
  const w = L[lang] || L.ru;
  const arrow = (a, b) => `${a ?? '—'} → ${b ?? '—'}`;
  switch (field) {
    case 'title': return `${w.title}: ${q(oldV)} → ${q(newV)}`;
    case 'subtitle': return `${w.subtitle}: ${q(oldV)} → ${q(newV)}`;
    case 'promo_text': return `${w.promo_text}: ${q(oldV)} → ${q(newV)}`;
    case 'version': return `${w.version}: ${arrow(oldV, newV)}`;
    case 'description': return w.description;
    case 'release_notes': return w.release_notes;
    case 'developer_name': return `${w.account}: ${arrow(oldV, newV)}`;
    case 'seller_name': return `${w.seller}: ${arrow(oldV, newV)}`;
    case 'category': return `${w.category}: ${arrow(oldV, newV)}`;
    case 'content_rating': return `${w.content_rating}: ${arrow(oldV, newV)}`;
    case 'editors_choice': return newV ? w.ec_on : w.ec_off;
    case 'screenshot_urls':
    case 'ipad_screenshot_urls': {
      const o = oldV || []; const n = newV || [];
      const pos = n.map((u, i) => (u !== o[i] ? i + 1 : null)).filter(Boolean);
      const label = field === 'screenshot_urls' ? w.shots_iphone : w.shots_ipad;
      return `${label}: ${pos.length ? `${w.new_at} ${pos.join(', ')}` : w.some_removed} (${o.length} → ${n.length})`;
    }
    case 'events': {
      const d = diffBy(oldV, newV, (e) => e.title);
      const parts = [...d.added.map((x) => `+ «${x}»`), ...d.removed.map((x) => `− «${x}»`)];
      return `${w.events}: ${parts.join(', ') || w.details}`;
    }
    case 'iap': {
      const d = diffBy(oldV, newV, (i) => `${i.name} ${i.price}`);
      const parts = [...d.added.map((x) => `+ ${x}`), ...d.removed.map((x) => `− ${x}`)];
      return `${w.iap}: ${parts.join(', ') || w.order}`;
    }
    case 'more_by_developer': {
      const d = diffBy(oldV, newV, (a) => a.title);
      return d.added.length ? `${w.new_dev_app}: ${d.added.join(', ')}` : w.dev_list;
    }
    case 'icon_url': return w.icon;
    case 'preview_videos': return w.video;
    case 'privacy_labels': return w.privacy;
    case 'languages': return `${w.languages}: ${arrow(oldV, newV)}`;
    case 'developer_website': return `${w.website}: ${arrow(oldV, newV)}`;
    case 'privacy_url': return `${w.privacy_url}: ${arrow(oldV, newV)}`;
    default: return `${field} ${w.changed}`;
  }
}

// Image lists for the "before / after" strip of one changed field
export function imagePair(field, oldV, newV) {
  switch (field) {
    case 'icon_url': return { before: oldV ? [oldV] : [], after: newV ? [newV] : [], shape: 'icon' };
    case 'screenshot_urls': return { before: oldV || [], after: newV || [], shape: 'phone' };
    case 'ipad_screenshot_urls': return { before: oldV || [], after: newV || [], shape: 'pad' };
    case 'events': return {
      before: (oldV || []).map((e) => e.image).filter(Boolean),
      after: (newV || []).map((e) => e.image).filter(Boolean),
      shape: 'event',
    };
    default: return null;
  }
}

// Text fields that are worth a before/after text block
export const TEXT_DIFF_FIELDS = ['description', 'release_notes', 'promo_text'];
