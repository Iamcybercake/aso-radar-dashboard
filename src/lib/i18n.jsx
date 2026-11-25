// EN/RU dictionary + language context. Add a key to both languages when adding UI text.
import { createContext, useContext, useState } from 'react';

const DICT = {
  en: {
    nav_competitors: 'Competitors', nav_changes: 'Changes', sign_out: 'Sign out', demo_badge: 'Demo data',
    login_title: 'Sign in to your radar', email: 'Email', password: 'Password', sign_in: 'Sign in',
    login_failed: 'Wrong email or password.',
    search: 'Search by name, developer or ID', all_geos: 'All geos', all_statuses: 'All statuses', all_tags: 'All tags',
    status_live: 'Live', status_removed: 'Removed', hide_paused: 'Hide paused',
    add_competitor: 'Add competitor', col_app: 'App', col_geo: 'Geo', col_status: 'Status', col_version: 'Version',
    col_since_update: 'Since update', col_tracked: 'Tracked', col_last_change: 'Last change', col_chart: 'Chart',
    col_rating: 'Rating', col_active: 'Tracking', own: 'ours', no_data_yet: 'Waiting for the first check',
    days_short: 'd', today: 'today', yesterday: 'yesterday', days_ago: 'd ago', never: '—',
    apps_count: (n) => `${n} apps`, nothing_found: 'No apps match these filters.',
    empty_apps: 'No competitors yet. Paste an App Store link to start tracking.',
    add_title: 'Add competitor', add_link: 'App Store link', add_link_ph: 'https://apps.apple.com/tr/app/…/id123456789',
    add_geo: 'Storefront', add_geo_hint: 'Taken from the link; change it to track another country.',
    add_bad_link: 'This doesn\'t look like an App Store app link. It should contain /app/…/id123….',
    add_duplicate: 'This app is already tracked in this storefront.',
    add_done: 'Added. Data appears after the next radar run (daily at 05:05 New York time).',
    add_save: 'Add', cancel: 'Cancel', close: 'Close', save: 'Save', delete: 'Delete',
    tracking_on: 'Tracking', tracking_off: 'Paused',
    // app page
    back: 'All competitors', developer: 'Developer', seller: 'Seller', category: 'Category', version: 'Version',
    editors_choice: "Editors' Choice", chart_pos: 'Chart', rating: 'Rating', ratings: 'ratings', age_rating: 'Age rating',
    size: 'Size', languages: 'Languages', open_store: 'Open in App Store',
    life_released: 'Since first release', life_update: 'Since last update', life_tracked: 'In tracking',
    life_removed: 'Removed from store', life_unknown: 'unknown yet', checked: 'Last checked',
    tags: 'Tags', add_tag: 'Add tag', tag_ph: 'tag name',
    store_preview: 'Store page', iphone: 'iPhone', ipad: 'iPad', events: 'In-app events', iap: 'In-app purchases',
    description: 'Description', whats_new: "What's New", privacy: 'Privacy labels', more_by_dev: 'More by developer',
    no_items: 'none',
    timeline: 'Timeline', timeline_empty: 'No changes or marks yet. Changes appear here after the radar spots them.',
    add_mark: 'Add mark', mark_type: 'Type', mark_date: 'Date', mark_keyword: 'Keyword', mark_note: 'Note',
    days_after_mark: (n) => `${n} d after mark`, until_removed: 'until removal',
    before: 'Before', after: 'After', open_original: 'Open full size', show_more: 'Show more', show_less: 'Show less',
    snapshots_count: (n) => `${n} checks`,
    // changes
    feed_title: 'All changes', all_kinds: 'All kinds', kind_update: 'Update', kind_account_change: 'Account change',
    kind_removed: 'Removed', kind_new_app: 'New app', all_fields: 'Any field',
    grp_meta: 'Metadata', grp_creatives: 'Creatives', grp_events: 'Events', grp_iap: 'IAP', grp_account: 'Account',
    load_more: 'Load more', feed_empty: 'No changes yet. The radar compares each day with the previous check.',
    load_error: 'Couldn\'t load data from Supabase:', retry: 'Retry',
    marks: {
      top1: 'Top-1 by keyword', top3: 'Top-3 by keyword', top10: 'Top-10 by keyword',
      motivated_traffic: 'Motivated traffic', offer_change: 'Offer change', featured: 'Featured', other: 'Other',
    },
  },
  ru: {
    nav_competitors: 'Конкуренты', nav_changes: 'Изменения', sign_out: 'Выйти', demo_badge: 'Демо-данные',
    login_title: 'Вход в радар', email: 'Email', password: 'Пароль', sign_in: 'Войти',
    login_failed: 'Неверный email или пароль.',
    search: 'Поиск по названию, разработчику или ID', all_geos: 'Все гео', all_statuses: 'Все статусы', all_tags: 'Все теги',
    status_live: 'В сторе', status_removed: 'Снято', hide_paused: 'Скрыть на паузе',
    add_competitor: 'Добавить конкурента', col_app: 'Приложение', col_geo: 'Гео', col_status: 'Статус', col_version: 'Версия',
    col_since_update: 'С апдейта', col_tracked: 'В трекинге', col_last_change: 'Изменение', col_chart: 'Чарт',
    col_rating: 'Рейтинг', col_active: 'Трекинг', own: 'наше', no_data_yet: 'Ждёт первой проверки',
    days_short: 'д', today: 'сегодня', yesterday: 'вчера', days_ago: 'д назад', never: '—',
    apps_count: (n) => `Приложений: ${n}`, nothing_found: 'По этим фильтрам ничего нет.',
    empty_apps: 'Конкурентов пока нет. Вставь ссылку App Store, чтобы начать трекинг.',
    add_title: 'Добавить конкурента', add_link: 'Ссылка App Store', add_link_ph: 'https://apps.apple.com/tr/app/…/id123456789',
    add_geo: 'Сторфронт', add_geo_hint: 'Берётся из ссылки; поменяй, чтобы следить за другой страной.',
    add_bad_link: 'Это не похоже на ссылку на приложение App Store. В ней должно быть /app/…/id123….',
    add_duplicate: 'Это приложение уже отслеживается в этом сторфронте.',
    add_done: 'Добавлено. Данные появятся после следующего запуска радара (каждый день в 05:05 по Нью-Йорку).',
    add_save: 'Добавить', cancel: 'Отмена', close: 'Закрыть', save: 'Сохранить', delete: 'Удалить',
    tracking_on: 'Трекинг', tracking_off: 'Пауза',
    back: 'Все конкуренты', developer: 'Разработчик', seller: 'Продавец', category: 'Категория', version: 'Версия',
    editors_choice: "Editors' Choice", chart_pos: 'Чарт', rating: 'Рейтинг', ratings: 'оценок', age_rating: 'Возраст',
    size: 'Размер', languages: 'Языки', open_store: 'Открыть в App Store',
    life_released: 'С первого релиза', life_update: 'С последнего апдейта', life_tracked: 'В трекинге',
    life_removed: 'Снято со стора', life_unknown: 'пока неизвестно', checked: 'Проверено',
    tags: 'Теги', add_tag: 'Добавить тег', tag_ph: 'название тега',
    store_preview: 'Страница в сторе', iphone: 'iPhone', ipad: 'iPad', events: 'Ивенты', iap: 'Встроенные покупки',
    description: 'Описание', whats_new: 'Что нового', privacy: 'Privacy labels', more_by_dev: 'Ещё от разработчика',
    no_items: 'нет',
    timeline: 'Таймлайн', timeline_empty: 'Изменений и меток пока нет. Изменения появятся, когда радар их заметит.',
    add_mark: 'Добавить метку', mark_type: 'Тип', mark_date: 'Дата', mark_keyword: 'Ключ', mark_note: 'Заметка',
    days_after_mark: (n) => `${n} д после метки`, until_removed: 'до снятия',
    before: 'Было', after: 'Стало', open_original: 'Открыть в полном размере', show_more: 'Показать больше', show_less: 'Свернуть',
    snapshots_count: (n) => `Проверок: ${n}`,
    feed_title: 'Все изменения', all_kinds: 'Все типы', kind_update: 'Апдейт', kind_account_change: 'Смена аккаунта',
    kind_removed: 'Снято', kind_new_app: 'Новое приложение', all_fields: 'Любое поле',
    grp_meta: 'Метаданные', grp_creatives: 'Креативы', grp_events: 'Ивенты', grp_iap: 'IAP', grp_account: 'Аккаунт',
    load_more: 'Загрузить ещё', feed_empty: 'Изменений пока нет. Радар каждый день сравнивает страницу с прошлой проверкой.',
    load_error: 'Не удалось загрузить данные из Supabase:', retry: 'Повторить',
    marks: {
      top1: 'Топ-1 по ключу', top3: 'Топ-3 по ключу', top10: 'Топ-10 по ключу',
      motivated_traffic: 'Мотивированный трафик', offer_change: 'Смена оффера', featured: 'Фичеринг', other: 'Другое',
    },
  },
};

const read = () => { try { return localStorage.getItem('lang'); } catch { return null; } };
const LangCtx = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(read() || 'ru');
  const setLang = (l) => { setLangState(l); try { localStorage.setItem('lang', l); } catch { /* storage unavailable */ } };
  const t = (key, ...args) => {
    const v = DICT[lang][key] ?? DICT.en[key] ?? key;
    return typeof v === 'function' ? v(...args) : v;
  };
  return <LangCtx.Provider value={{ lang, setLang, t, dict: DICT[lang] }}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);
