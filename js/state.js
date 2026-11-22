// Saved game state (per browser). Everything is wrapped in try/catch because storage can be unavailable.
export const STICKERS = [
  { id: 'eenhoorn', name: 'Eenhoorn' }, { id: 'anna', name: 'Anna' }, { id: 'fenna', name: 'Fenna' },
  { id: 'konijn', name: 'Konijn' }, { id: 'poes', name: 'Poes' }, { id: 'hond', name: 'Hondje' },
  { id: 'egel', name: 'Egel' }, { id: 'eend', name: 'Eendje' }, { id: 'ster', name: 'Ster' },
  { id: 'hart', name: 'Hartje' }, { id: 'appel', name: 'Appel' }, { id: 'wortel', name: 'Wortel' },
  { id: 'bloem', name: 'Bloem' }, { id: 'paddenstoel', name: 'Paddenstoel' }, { id: 'kroon', name: 'Kroon' },
  { id: 'ballon', name: 'Ballon' }, { id: 'ijsje', name: 'IJsje' }, { id: 'taart', name: 'Taart' },
  { id: 'vlinder', name: 'Vlinder' }, { id: 'diamant', name: 'Diamant' }, { id: 'maan', name: 'Maan' },
  { id: 'regenboog', name: 'Regenboog' }, { id: 'boom', name: 'Boom' }, { id: 'den', name: 'Dennenboom' },
];
const KEY = 'eenhoornland-v1';
function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
const saved = load();
export const state = {
  uni: Object.assign({ body: '#FFFFFF', mane: 'rainbow', horn: '#F7C548', name: 'Sterretje' }, saved.uni || {}),
  stickers: saved.stickers || {},      // id -> count
  gallery: saved.gallery || [],        // saved sticker scenes (atelier)
  night: !!saved.night,
  extra: saved.extra || {},            // free space for activities: state.extra[activityId] = {...}
};
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { }
}
/** pick a sticker: a new one if any are missing, else a random duplicate */
export function pickSticker() {
  const missing = STICKERS.filter(s => !state.stickers[s.id]);
  const pool = missing.length ? missing : STICKERS;
  const s = pool[Math.floor(Math.random() * pool.length)];
  const isNew = !state.stickers[s.id];
  state.stickers[s.id] = (state.stickers[s.id] || 0) + 1; save();
  return { sticker: s, isNew };
}
export function stickerCount() { return STICKERS.filter(s => state.stickers[s.id]).length; }
