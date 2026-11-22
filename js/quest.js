// The big loop: find a hidden egg → make a nest → sleep → it hatches → raise the unicorn over a few days
// (each day it has wishes; a night's sleep makes it grow) → bring it to the meadow → a new egg appears.
// Pure logic + saved state (no DOM, no rendering) so it can be tested in node: `node tests/quest.test.mjs`.
// There are no fail states: sleeping is always allowed, unfinished wishes simply stay for the next day.
import { state, save } from './state.js';
import { rng } from './pixel.js';

export const KINDS = {
  bloem: { name: 'bloemen-ei', zone: 'bloem', hint: 'Zoek in het dorp, bij de bomen en de struiken!', base: '#FFE3EC', spot: '#FF7EB6', band: '#FFD43B', bodies: ['#FFFFFF', '#FFC8DD', '#FFE3EC'], manes: ['#FF7EB6', 'rainbow', '#FF9E6B'], horns: ['#F7C548', '#FF9EC7'], marks: ['hartje', 'sokken', null] },
  bos: { name: 'bos-ei', zone: 'bos', hint: 'Zoek in het bos, tussen de bomen!', base: '#DDF3C8', spot: '#4DB37C', band: '#B5823F', bodies: ['#C6F1DB', '#FFF0A6', '#F3E3C8'], manes: ['#4DB37C', '#F5B83D', '#B5703F'], horns: ['#F7C548', '#D3DAE6'], marks: ['vlekken', 'vlekken', null] },
  zee: { name: 'zee-ei', zone: 'zee', hint: 'Zoek op het strand, bij de zee!', base: '#CFEFFF', spot: '#4FA3F7', band: '#FFFFFF', bodies: ['#BFE3FF', '#B8F0EE', '#FFFFFF'], manes: ['#4FA3F7', '#2EC4B6', '#9B72E8'], horns: ['#D3DAE6', '#FF9EC7'], marks: ['sokken', 'vlekken', null] },
  kasteel: { name: 'kasteel-ei', zone: 'kasteel', hint: 'Zoek bij het kasteel!', base: '#E9DDFF', spot: '#9B72E8', band: '#F7C548', bodies: ['#DCCBFA', '#FFFFFF', '#FFE9A8'], manes: ['#9B72E8', '#F5B83D', 'rainbow'], horns: ['#F7C548', 'rainbow'], marks: ['ster', 'ster', null] },
  ster: { name: 'sterren-ei', zone: null, hint: '', base: '#6C6FC0', spot: '#FFF3A8', band: '#B9A3F0', bodies: ['#A9A6EE', '#F6C4EC', '#9FD8F5'], manes: ['#FFD43B', '#FFFFFF', 'rainbow'], horns: ['#F7C548', 'rainbow'], marks: ['sterren'], wings: true },
};
const ZONES = ['bloem', 'bos', 'zee', 'kasteel'];
export const ITEMS = {
  bloem: { one: 'bloem', many: 'bloemen', where: 'in het gras' },
  appel: { one: 'appel', many: 'appels', where: 'bij de appelbomen in het bos' },
  paddenstoel: { one: 'paddenstoel', many: 'paddenstoelen', where: 'in het bos' },
  schelp: { one: 'schelp', many: 'schelpen', where: 'op het strand' },
  wortel: { one: 'wortel', many: 'wortels', where: 'in de moestuin' },
  diamant: { one: 'diamant', many: 'diamanten', where: 'bij het kasteel' },
  munt: { one: 'muntje', many: 'muntjes', where: 'overal' },
};
/** how many of each lie around on one day (always more than any wish needs) */
export const DAILY = { bloem: 14, appel: 9, paddenstoel: 9, schelp: 10, wortel: 7, diamant: 4, munt: 14 };
export const FOUNTAIN_PRICE = 5;
const NAMES = ['Sterretje', 'Wolkje', 'Glitter', 'Snoepje', 'Bloesem', 'Maantje', 'Zonnetje', 'Roosje', 'Vlinder', 'Suikerspin', 'Regenboog', 'Parel', 'Sneeuwvlok', 'Madelief', 'Bubbel', 'Fonkel', 'Lolly', 'Dromer', 'Twinkel', 'Zeepbel', 'Hartje', 'Pluisje', 'Knuffel', 'Framboos'];
const STAGES = ['zoek', 'ei', 'baby', 'jong', 'groot', 'feest'];

/* ---------- saved state ---------- */
function fresh() {
  let returning = false;
  try { returning = !!JSON.parse(localStorage.getItem('eenhoornland-v1') || 'null'); } catch (e) { }
  // a unicorn from before this update moves into the meadow, so nobody loses their friend
  const q = { v: 1, cycle: 0, stage: 'zoek', kind: 'bloem', zone: 'bloem', spot: 0, day: 1, wishes: [], picked: {}, coins: 0, totals: {}, herd: returning ? [Object.assign({ kind: 'bloem' }, state.uni)] : [], seed: Math.floor(Math.random() * 1e9), tools: {}, broken: [] };
  q.wishes = wishesFor(q); return q;
}
let q = state.extra.quest && state.extra.quest.v === 1 && STAGES.includes(state.extra.quest.stage) ? state.extra.quest : null;
if (!q) { q = state.extra.quest = fresh(); save(); }
for (const k of ['picked', 'totals']) if (!q[k] || typeof q[k] !== 'object') q[k] = {};
if (!Array.isArray(q.herd)) q.herd = []; if (!Array.isArray(q.wishes)) q.wishes = wishesFor(q);
if (!q.tools || typeof q.tools !== 'object') q.tools = {}; if (!Array.isArray(q.broken)) q.broken = [];
export const quest = q;

/* ---------- tools & the island of this cycle ---------- */
/** shears cut the brambles on the way into the forest, the hammer smashes the boulders before the castle. Tools are kept forever. */
export const TOOLS = {
  schaar: { name: 'schaar', found: 'Jullie hebben de schaar gevonden! Daarmee knip je doornstruiken weg. Tik maar op een doornstruik!', need: 'Au, doornstruiken! Hier heb je de schaar voor nodig.', seek: 'De weg naar het bos zit dicht met doornstruiken. Zoek de schaar! Kijk maar op de kaart.' },
  hamer: { name: 'hamer', found: 'Jullie hebben de hamer gevonden! Daarmee sla je grote stenen kapot. Tik maar op een steen!', need: 'Wat een grote steen! Hier heb je de hamer voor nodig.', seek: 'Er liggen grote stenen op de weg naar het kasteel. Zoek de hamer! Die ligt in het bos. Kijk maar op de kaart.' },
};
const BEHIND = { appel: 'bos', paddenstoel: 'bos', diamant: 'kasteel', atelier: 'bos', bakkerij: 'kasteel' };   // where a wish sends you (items and houses, see MAP.HOUSES)
export const hasTool = id => !!q.tools[id];
/** the tool the children still have to find before today's wishes can come true (or null) */
export function neededTool() {
  const zones = q.wishes.filter(w => !done(w)).map(w => w.t === 'egg' ? q.zone : w.t === 'item' || w.t === 'act' ? BEHIND[w.id] : null);
  if ((zones.includes('bos') || zones.includes('kasteel')) && !q.tools.schaar) return 'schaar';   // the hammer lies in the forest
  return zones.includes('kasteel') && !q.tools.hamer ? 'hamer' : null;
}
export function giveTool(id) { if (!TOOLS[id] || q.tools[id]) return false; q.tools[id] = true; commit(['tool', id]); return true; }
/** obstacle `i` of this cycle's island was cut or smashed; loose ones hide a coin */
export function smash(list, coin) { for (const i of list) if (!q.broken.includes(i)) q.broken.push(i); const ev = [['smash']]; if (coin) { q.coins++; ev.push(['coins', q.coins]); } commit(...ev); }
/** 0 for the first island; a new number for every later cycle, so the outer areas are laid out differently each time */
export const mapSeed = () => q.cycle ? ((q.seed | 0) + q.cycle * 104729) | 0 || 1 : 0;

const listeners = new Set();
/** fn(type, data): 'collect' | 'wish' | 'egg' | 'stage' | 'day' | 'bedtime' | 'coins' | 'herd' — always followed by 'change' */
export function on(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit(type, data) { for (const fn of [...listeners]) { try { fn(type, data); } catch (e) { console.error(e); } } }
function commit(...events) { save(); for (const [t, d] of events) emit(t, d); emit('change'); }

/* ---------- wishes ---------- */
function rnd(q, salt) { return rng((q.seed | 0) + q.cycle * 7919 + q.day * 104729 + salt * 31); }
const item = (id, need) => ({ t: 'item', id, need, have: 0 });
const act = id => ({ t: 'act', id, need: 1, have: 0 });
function wishesFor(q) {
  const r = rnd(q, STAGES.indexOf(q.stage)), pick = a => a[Math.floor(r() * a.length)];
  switch (q.stage) {
    case 'zoek': return [{ t: 'egg', id: 'ei', need: 1, have: 0 }];
    case 'ei': return [item('bloem', 3)];
    case 'baby': return [item('appel', 3), item('wortel', 2), act('stal')];
    case 'jong': { const a = pick([['schelp', 3], ['paddenstoel', 3]]), b = pick([['bloem', 4], ['appel', 3], ['wortel', 3]]); return [item(...a), item(...b), act(pick(['bakkerij', 'kermis', 'atelier']))]; }
    case 'groot': return [item('diamant', q.cycle ? 2 : 1), item(pick(['schelp', 'paddenstoel', 'bloem']), 3), { t: 'wei', id: 'wei', need: 1, have: 0 }];
    default: return [];
  }
}
export const done = w => w.have >= w.need;
/** today's wishes; a tool that has to be found first is shown as a wish of its own */
export const wishes = () => { const t = neededTool(); return t ? [{ t: 'tool', id: t, need: 1, have: 0 }, ...q.wishes] : q.wishes; };
/** the wish 'bring her to the meadow' only opens once the others are done */
export const weiOpen = () => q.stage === 'groot' && q.wishes.every(w => w.t === 'wei' || done(w));
export const allDone = () => q.wishes.every(done);
/** evening falls when today's wishes are all granted — time for bed */
export const bedtime = () => q.stage !== 'zoek' && allDone();
export const hasUnicorn = () => q.stage === 'baby' || q.stage === 'jong' || q.stage === 'groot';
export const hasCompanion = () => q.stage === 'ei' || hasUnicorn();
export const kind = () => KINDS[q.kind] || KINDS.bloem;
export const uniName = () => state.uni.name;

export function wishText(w) {
  const n = uniName();
  if (w.t === 'tool') return TOOLS[w.id].seek;
  if (w.t === 'egg') return 'Er ligt ergens een ei verstopt! ' + (KINDS[q.zone] || KINDS.bloem).hint;
  if (w.t === 'wei') return weiOpen() ? n + ' is nu groot! Breng ' + n + ' naar de eenhoornwei.' : 'Als ' + n + ' alles heeft, mag ze naar de eenhoornwei.';
  if (w.t === 'act') return ({ stal: 'Verzorg ' + n + ' in de stal! De stal staat bij de eenhoornwei.', bakkerij: n + ' heeft zin in taart. De bakkerij staat bij het kasteel!', kermis: n + ' wil naar de kermis! De kermis is op het strand.', atelier: 'Maak iets moois voor ' + n + '. Het atelier staat in het bos!' })[w.id] || '';
  const it = ITEMS[w.id], left = Math.max(0, w.need - w.have);
  if (!left) return 'Alle ' + it.many + ' zijn gevonden!';
  return (q.stage === 'ei' ? 'Het ei wil een zacht nestje. ' : '') + 'Zoek ' + (left === 1 ? 'nog één ' + it.one : (w.have ? 'nog ' : '') + left + ' ' + it.many) + ' ' + it.where + '!';
}
/** one spoken sentence about what to do now */
export function goalText() {
  if (q.stage === 'feest') return 'Wat een feest! Ga maar lekker slapen in je huisje.';
  if (bedtime()) return (q.stage === 'ei' ? 'Het nestje is klaar! ' : 'Alles is gelukt! ') + 'Het wordt avond. Ga slapen in je huisje!';
  const all = wishes(), w = all.find(w => !done(w) && (w.t !== 'wei' || weiOpen())) || all.find(w => !done(w));
  return w ? wishText(w) : '';
}

/* ---------- what lies around today ---------- */
const hash = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return h; };
/** indices (into the map's spawn list of `total` spots) that hold an item today and are not picked yet */
export function activeSpawns(type, total) {
  const r = rng((q.seed | 0) + q.day * 131 + hash(type)), idx = [...Array(total).keys()];
  for (let k = idx.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1));[idx[k], idx[j]] = [idx[j], idx[k]]; }
  const got = new Set(q.picked[type] || []);
  return idx.slice(0, Math.min(total, DAILY[type] || 6)).filter(i => !got.has(i));
}

/* ---------- things that happen ---------- */
/** the child picked up item `type` at spawn index `idx` */
export function collect(type, idx) {
  (q.picked[type] = q.picked[type] || []).push(idx);
  q.totals[type] = (q.totals[type] || 0) + 1;
  const ev = [['collect', { type }]];
  if (type === 'munt') { q.coins++; ev.push(['coins', q.coins]); }
  const w = q.wishes.find(w => w.t === 'item' && w.id === type && !done(w));
  let finished = null;
  if (w) { w.have++; if (done(w)) { finished = w; ev.push(['wish', w]); } }
  const bed = finished && bedtime(); if (bed) ev.push(['bedtime']);
  commit(...ev);
  return { counted: !!w, wish: w || null, finished, bedtime: !!bed, weiOpen: !!finished && weiOpen() };
}
/** an activity (stal, bakkerij, ...) gave its reward */
export function activityDone(id) {
  const w = q.wishes.find(w => w.t === 'act' && w.id === id && !done(w)); if (!w) return false;
  w.have = 1; const ev = [['wish', w]]; if (bedtime()) ev.push(['bedtime']); commit(...ev); return true;
}
export function foundEgg() {
  if (q.stage !== 'zoek') return false;
  q.stage = 'ei'; q.wishes = wishesFor(q); q.picked.bloem = [];
  commit(['egg'], ['stage', 'ei']); return true;
}
function newLook() {
  const k = kind(), r = rnd(q, 99), pick = a => a[Math.floor(r() * a.length)];
  const used = new Set(q.herd.map(u => u.name)); const free = NAMES.filter(n => !used.has(n));
  return { body: pick(k.bodies), mane: pick(k.manes), horn: pick(k.horns), mark: pick(k.marks), wings: !!k.wings, name: pick(free.length ? free : NAMES), kind: q.kind };
}
/** the grown unicorn walks through the meadow gate */
export function deliver() {
  if (!weiOpen()) return false;
  q.herd.push(Object.assign({}, state.uni, { kind: q.kind }));
  q.stage = 'feest'; q.wishes = [];
  commit(['herd'], ['stage', 'feest'], ['bedtime']); return true;
}
/** go to bed. Returns what the morning brings: {type: 'hatch'|'grow'|'newegg'|'morning', ...} */
export function sleep() {
  const from = q.stage, ready = bedtime(); let res = { type: 'morning' };
  if (ready && from === 'ei') { Object.assign(state.uni, { mark: null, wings: false }, newLook()); q.stage = 'baby'; res = { type: 'hatch', name: state.uni.name }; }
  else if (ready && from === 'baby') { q.stage = 'jong'; res = { type: 'grow', name: state.uni.name, stage: 'jong' }; }
  else if (ready && from === 'jong') { q.stage = 'groot'; res = { type: 'grow', name: state.uni.name, stage: 'groot' }; }
  else if (from === 'feest') {
    q.cycle++; q.stage = 'zoek'; q.broken = [];
    const r = rnd(q, 5); let k = q.cycle < ZONES.length ? ZONES[q.cycle] : (r() < .22 ? 'ster' : ZONES[Math.floor(r() * ZONES.length)]);
    if (q.cycle >= ZONES.length && k === q.kind) k = ZONES[(ZONES.indexOf(k) + 1) % ZONES.length];
    q.kind = k; q.zone = KINDS[k].zone || ZONES[Math.floor(r() * ZONES.length)]; q.spot = Math.floor(r() * 1000);
    res = { type: 'newegg', kind: k };
  }
  q.day++; q.picked = {};
  if (q.stage !== from) q.wishes = wishesFor(q);
  res.from = from; res.stage = q.stage;
  commit(['day', res], ...(q.stage !== from ? [['stage', q.stage]] : []), ...(bedtime() ? [['bedtime']] : []));
  return res;
}
export function spendCoins(n) { if (q.coins < n) return false; q.coins -= n; commit(['coins', q.coins]); return true; }
/** the unicorn to draw next to the girls (marks show once it is no longer a baby, wings once it is grown) */
export function companionLook() { return q.stage === 'groot' ? state.uni : Object.assign({}, state.uni, { wings: false }); }
/** dev / tests only */
export function _reset(patch) { for (const k of Object.keys(q)) delete q[k]; Object.assign(q, fresh(), { herd: [] }, patch || {}); if (!patch || !patch.wishes) q.wishes = wishesFor(q); commit(['stage', q.stage], ['day', { type: 'morning' }]); }
