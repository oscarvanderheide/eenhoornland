// Shared UI: activity overlay, pixel canvas stage, tool buttons, reward popup, sticker book.
import { state, save, pickSticker, STICKERS, stickerCount } from './state.js';
import { sfx, speak, stopSpeech } from './audio.js';
import * as PX from './pixel.js';

const $ = s => document.querySelector(s);

/* ---------- pixel canvas stage ---------- */
/** Creates a crisp, auto-scaled pixel canvas of logical size w×h inside parent.
 *  Returns {canvas, ctx, w, h, toLocal(evt)->{x,y}, loop(fn(dt,t)), destroy()} */
export function pixelStage(parent, w, h) {
  const wrap = document.createElement('div'); wrap.className = 'pstage';
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; wrap.appendChild(cv); parent.appendChild(wrap);
  const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  const fit = () => {
    const r = wrap.getBoundingClientRect(); if (!r.width || !r.height) return;
    let s = Math.min((r.width - 8) / w, (r.height - 8) / h); if (s >= 2) s = Math.floor(s * 4) / 4;
    cv.style.width = Math.floor(w * s) + 'px'; cv.style.height = Math.floor(h * s) + 'px';
  };
  const ro = new ResizeObserver(fit); ro.observe(wrap); requestAnimationFrame(fit);
  const toLocal = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * w, y: (e.clientY - r.top) / r.height * h }; };
  let raf = 0, alive = true;
  const loop = fn => {
    let last = performance.now();
    const tick = t => { if (!alive) return; const dt = Math.min(.05, (t - last) / 1000); last = t; ctx.imageSmoothingEnabled = false; fn(dt, t / 1000); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
  };
  return { canvas: cv, ctx, w, h, toLocal, loop, destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); wrap.remove(); } };
}

/* ---------- tool buttons ---------- */
/** tools: [{id, label, icon: canvas, onClick}] → returns container; set pressed with setActive(id) */
export function toolbar(parent, tools, opt = {}) {
  const bar = document.createElement('div'); bar.className = 'tools' + (opt.small ? ' small' : '');
  for (const t of tools) {
    const b = document.createElement('button'); b.className = 'tool'; b.dataset.id = t.id; b.setAttribute('aria-label', t.label);
    if (t.icon) b.appendChild(PX.domSprite(t.icon, opt.small ? 2 : 3));
    if (t.color) { const sw = document.createElement('span'); sw.className = 'sw'; sw.style.background = t.color; b.appendChild(sw); }
    if (!opt.noLabel) { const l = document.createElement('span'); l.textContent = t.label; b.appendChild(l); }
    b.onclick = () => { sfx.click(); t.onClick && t.onClick(t, b); };
    bar.appendChild(b);
  }
  bar.setActive = id => bar.querySelectorAll('.tool').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === id ? 'true' : 'false'));
  parent.appendChild(bar); return bar;
}

/* ---------- modal ---------- */
export function modal(contentEl, { onClose, dismissable = true } = {}) {
  const m = $('#modal'); m.innerHTML = ''; const card = document.createElement('div'); card.className = 'card'; card.appendChild(contentEl); m.appendChild(card); m.hidden = false;
  const close = () => { m.hidden = true; m.innerHTML = ''; m.onclick = null; onClose && onClose(); };
  if (dismissable) m.onclick = e => { if (e.target === m || e.target.closest('[data-close]')) close(); };
  return close;
}

/* ---------- reward ---------- */
/** gives the child a sticker with a celebratory popup; returns a promise that resolves on dismiss */
export function reward(msg) {
  const { sticker, isNew } = pickSticker();
  sfx.tada();
  const el = document.createElement('div'); el.className = 'reward';
  el.innerHTML = `<div class="rays"></div><h3>${isNew ? 'Nieuwe sticker!' : 'Nog een sticker!'}</h3>`;
  const art = PX.domSprite(PX.stickerSprite(sticker.id, state.uni), 1); art.classList.add('big'); el.appendChild(art);
  const nm = document.createElement('p'); nm.className = 'nm'; nm.textContent = sticker.name; el.appendChild(nm);
  const b = document.createElement('button'); b.className = 'btn'; b.textContent = 'Jippie!'; b.dataset.close = '1'; el.appendChild(b);
  sizeBig(art, 130);
  speak((msg ? msg + ' ' : '') + (isNew ? 'Je krijgt een nieuwe sticker: ' : 'Je krijgt een sticker: ') + sticker.name + '!');
  updateBookCount();
  return new Promise(res => modal(el, { onClose: res }));
}
function sizeBig(cv, px) { const s = Math.max(1, Math.floor(px / Math.max(cv.width, cv.height))); cv.style.width = cv.width * s + 'px'; cv.style.height = cv.height * s + 'px'; }

/* ---------- sticker book ---------- */
export function updateBookCount() { const c = $('#book-count'); if (c) c.textContent = stickerCount() + '/' + STICKERS.length; }
export function openBook() {
  sfx.pop();
  const el = document.createElement('div'); el.className = 'book';
  el.innerHTML = `<div class="book-head"><h3>Stickerboek</h3><span>${stickerCount()} van de ${STICKERS.length}</span><button class="x" data-close aria-label="Sluiten">✕</button></div><div class="book-grid"></div>`;
  const grid = el.querySelector('.book-grid');
  for (const s of STICKERS) {
    const has = state.stickers[s.id];
    const cell = document.createElement('button'); cell.className = 'slot' + (has ? ' has' : '');
    const art = PX.domSprite(PX.stickerSprite(s.id, state.uni), 1); sizeBig(art, 48); if (!has) art.classList.add('ghost');
    cell.appendChild(art); const l = document.createElement('span'); l.textContent = has ? s.name : '?'; cell.appendChild(l);
    cell.onclick = () => { if (has) { sfx.sparkle(); speak(s.name + '!'); cell.classList.remove('wig'); void cell.offsetWidth; cell.classList.add('wig'); } else { sfx.wrong(); speak('Deze sticker heb je nog niet. Speel in de huisjes om stickers te verdienen!'); } };
    grid.appendChild(cell);
  }
  modal(el);
  speak(stickerCount() ? `Je hebt al ${stickerCount()} stickers!` : 'Je stickerboek is nog leeg. Speel in de huisjes om stickers te verdienen!');
}

/* ---------- activity overlay ---------- */
let current = null;
/** mod = {meta:{id,title}, open(root, api) -> cleanup fn} */
export function openActivity(mod, onClose) {
  const act = $('#act'); act.hidden = false; $('#act-title').textContent = mod.meta.title;
  const root = $('#act-root'); root.innerHTML = ''; root.className = 'act-root act-' + mod.meta.id;
  const api = { speak, stopSpeech, sfx, state, save, reward, close: closeActivity, pixelStage, toolbar, modal, PX };
  let cleanup = null;
  try { cleanup = mod.open(root, api); } catch (e) { console.error(e); }
  current = { cleanup, onClose };
}
export function closeActivity() {
  if (!current) return; const c = current; current = null;
  try { c.cleanup && c.cleanup(); } catch (e) { console.error(e); }
  $('#act').hidden = true; $('#act-root').innerHTML = ''; stopSpeech();
  c.onClose && c.onClose();
}
export function activityOpen() { return !!current; }
