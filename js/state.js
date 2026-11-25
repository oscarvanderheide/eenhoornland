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
// Three saves side by side (saves.js shows them). Slot 1 keeps the old key, so a game saved before there were slots
// simply is the first save. Which slot is played is remembered; ?slot=2 picks one (tests).
export const SLOTS = 3;
const SLOT_KEY = 'eenhoornland-slot';
export const slotKey = n => n === 1 ? 'eenhoornland-v1' : 'eenhoornland-v1-' + n;
function pickSlot() {
  try {
    const p = +new URLSearchParams(location.search).get('slot'); if (p >= 1 && p <= SLOTS) { localStorage.setItem(SLOT_KEY, String(p)); return p; }
    const s = +localStorage.getItem(SLOT_KEY); return s >= 1 && s <= SLOTS ? s : 1;
  } catch (e) { return 1; }
}
export const slot = pickSlot();
export const setSlot = n => { try { localStorage.setItem(SLOT_KEY, String(n)); } catch (e) { } };
const KEY = slotKey(slot);
let frozen = false;
/** after switching or wiping a save nothing may be written any more until the page has reloaded */
export const freezeSaves = () => { frozen = true; };
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
  if (frozen) return;
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
