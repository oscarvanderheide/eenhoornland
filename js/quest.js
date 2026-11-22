// The adventure: a dream about a mysterious egg → find the egg in the forest → find the shears and cut the way to the
// flower meadow, where a fallen star hatches the egg → find the hammer and smash the way to the beach, sail to the
// rainbow island and pick the fruit the little unicorn is hungry for → now she is strong enough to ride: jump the
// broken bridge to the castle and bring her to the unicorn meadow → sleep, dream of a new egg, and it starts again.
// Pure logic + saved state (no DOM, no rendering) so it can be tested in node: `node tests/quest.test.mjs`.
// There are no fail states and nothing has to be done in the houses: those are just for fun.
import { state, save } from './state.js';
import { rng } from './pixel.js';

export const KINDS = {
  bos: { name: 'bos-ei', zone: 'bos', base: '#DDF3C8', spot: '#4DB37C', band: '#B5823F', bodies: ['#C6F1DB', '#FFF0A6', '#FFFFFF'], manes: ['#4DB37C', '#F5B83D', 'rainbow'], horns: ['#F7C548', '#D3DAE6'] },
  bloem: { name: 'bloemen-ei', zone: 'wei', base: '#FFE3EC', spot: '#FF7EB6', band: '#FFD43B', bodies: ['#FFFFFF', '#FFC8DD', '#FFE3EC'], manes: ['#FF7EB6', 'rainbow', '#FF9E6B'], horns: ['#F7C548', '#FF9EC7'] },
  zee: { name: 'zee-ei', zone: 'strand', base: '#CFEFFF', spot: '#4FA3F7', band: '#FFFFFF', bodies: ['#BFE3FF', '#B8F0EE', '#FFFFFF'], manes: ['#4FA3F7', '#2EC4B6', '#9B72E8'], horns: ['#D3DAE6', '#FF9EC7'] },
  regenboog: { name: 'regenboog-ei', zone: 'eiland', base: '#E9DDFF', spot: '#9B72E8', band: '#F7C548', bodies: ['#DCCBFA', '#FFFFFF', '#FFE9A8'], manes: ['rainbow', '#9B72E8', '#F5B83D'], horns: ['#F7C548', 'rainbow'] },
  ster: { name: 'sterren-ei', zone: null, base: '#6C6FC0', spot: '#FFF3A8', band: '#B9A3F0', bodies: ['#A9A6EE', '#F6C4EC', '#9FD8F5'], manes: ['#FFD43B', '#FFFFFF', 'rainbow'], horns: ['#F7C548', 'rainbow'] },
};
const ORDER = ['bos', 'bloem', 'zee', 'regenboog'];                 // the very first egg always lies in the forest
const ZONES = ['bos', 'wei', 'strand', 'eiland', 'dorp'];
const HINT = {
  bos: 'Zoek in het bos, tussen de bomen! Loop over de brug.', wei: 'Zoek in de bloemenwei!', strand: 'Zoek op het strand, bij de zee!',
  eiland: 'Zoek op het regenboogeiland! Neem de boot op het strand.', dorp: 'Zoek in het dorp, bij de bomen en de struiken!',
};
export const ITEMS = {
  bloem: { one: 'bloem', many: 'bloemen' }, appel: { one: 'appel', many: 'appels' }, paddenstoel: { one: 'paddenstoel', many: 'paddenstoelen' },
  schelp: { one: 'schelp', many: 'schelpen' }, wortel: { one: 'wortel', many: 'wortels' }, diamant: { one: 'diamant', many: 'diamanten' }, munt: { one: 'muntje', many: 'muntjes' },
};
/** how many of each lie around on one day */
export const DAILY = { bloem: 18, appel: 9, paddenstoel: 10, schelp: 12, wortel: 7, diamant: 5, munt: 16 };
export const FOUNTAIN_PRICE = 5;
const NAMES = ['Sterretje', 'Wolkje', 'Glitter', 'Snoepje', 'Bloesem', 'Maantje', 'Zonnetje', 'Roosje', 'Vlinder', 'Suikerspin', 'Regenboog', 'Parel', 'Sneeuwvlok', 'Madelief', 'Bubbel', 'Fonkel', 'Lolly', 'Dromer', 'Twinkel', 'Zeepbel', 'Hartje', 'Pluisje', 'Knuffel', 'Framboos'];
const STAGES = ['zoek', 'ei', 'baby', 'vriend', 'feest'];

/* ---------- saved state ---------- */
function fresh(old) {
  // unicorns and coins from before this adventure existed are kept, so nobody loses their friends
  return { v: 2, cycle: 0, stage: 'zoek', kind: 'bos', zone: 'bos', spot: 0, day: 1, picked: {}, coins: old && old.coins | 0 || 0, totals: {}, herd: old && Array.isArray(old.herd) ? old.herd : [], seed: Math.floor(Math.random() * 1e9), tools: {}, broken: [], dreamt: -1 };
}
let q = state.extra.quest && state.extra.quest.v === 2 && STAGES.includes(state.extra.quest.stage) ? state.extra.quest : null;
if (!q) { q = state.extra.quest = fresh(state.extra.quest); save(); }
for (const k of ['picked', 'totals', 'tools']) if (!q[k] || typeof q[k] !== 'object') q[k] = {};
if (!Array.isArray(q.herd)) q.herd = []; if (!Array.isArray(q.broken)) q.broken = [];
export const quest = q;

/* ---------- tools & the world of this cycle ---------- */
/** shears cut the brambles on the bridge to the flower meadow, the hammer smashes the boulders on the bridge to the beach. Tools are kept forever. */
export const TOOLS = {
  schaar: { name: 'schaar', found: 'Jullie hebben de schaar gevonden! Daarmee knip je doornstruiken weg. Ga naar de brug met de doornstruiken!', need: 'Au, doornstruiken! Hier heb je de schaar voor nodig.' },
  hamer: { name: 'hamer', found: 'Jullie hebben de hamer gevonden! Daarmee sla je grote stenen kapot. Ga naar de brug met de stenen!', need: 'Wat een grote steen! Hier heb je de hamer voor nodig.' },
};
export const hasTool = id => id === 'rit' ? canRide() : !!q.tools[id];
/** the tool the children have to find now (or null). The shears only turn up once there is an egg, the hammer once it has hatched. */
export function neededTool() { return q.stage === 'ei' && !q.tools.schaar ? 'schaar' : q.stage === 'baby' && !q.tools.hamer ? 'hamer' : null; }
/** does this tool lie somewhere in the world right now? */
export const toolOut = id => !q.tools[id] && (id === 'schaar' ? q.stage !== 'zoek' : q.stage !== 'zoek' && q.stage !== 'ei');
export function giveTool(id) { if (!TOOLS[id] || q.tools[id]) return false; q.tools[id] = true; commit(['tool', id]); return true; }
/** obstacle `i` of this cycle's world was cut or smashed; loose ones hide a coin */
export function smash(list, coin) { for (const i of list) if (!q.broken.includes(i)) q.broken.push(i); const ev = [['smash']]; if (coin) { q.coins++; ev.push(['coins', q.coins]); } commit(...ev); }
/** 0 for the first world; a new number for every later cycle, so the outer islands are laid out differently each time */
export const mapSeed = () => q.cycle ? ((q.seed | 0) + q.cycle * 104729) | 0 || 1 : 0;

const listeners = new Set();
/** fn(type, data): 'collect' | 'egg' | 'hatch' | 'fed' | 'stage' | 'day' | 'bedtime' | 'coins' | 'herd' | 'tool' — always followed by 'change' */
export function on(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit(type, data) { for (const fn of [...listeners]) { try { fn(type, data); } catch (e) { console.error(e); } } }
function commit(...events) { save(); for (const [t, d] of events) emit(t, d); emit('change'); }

/* ---------- what to do now ---------- */
function rnd(q, salt) { return rng((q.seed | 0) + q.cycle * 7919 + q.day * 104729 + salt * 31); }
/** the goals of this moment, in order, as picture chips: {t: 'egg' | 'tool' | 'star' | 'fruit' | 'wei', id} */
export function wishes() {
  const tool = neededTool(), t = tool ? [{ t: 'tool', id: tool }] : [];
  switch (q.stage) {
    case 'zoek': return [{ t: 'egg', id: 'ei' }];
    case 'ei': return [...t, { t: 'star', id: 'ster' }];
    case 'baby': return [...t, { t: 'fruit', id: 'fruit' }];
    case 'vriend': return [{ t: 'wei', id: 'wei' }];
    default: return [];
  }
}
export const canRide = () => q.stage === 'vriend';
/** evening falls when the unicorn has come home to the meadow — time for bed, and for a new dream */
export const bedtime = () => q.stage === 'feest';
export const hasUnicorn = () => q.stage === 'baby' || q.stage === 'vriend';
export const hasCompanion = () => q.stage === 'ei' || hasUnicorn();
export const kind = () => KINDS[q.kind] || KINDS.bos;
export const uniName = () => state.uni.name;

export function wishText(w) {
  const n = uniName();
  if (w.t === 'egg') return (q.cycle ? 'Er ligt weer ergens een ei verstopt! ' : 'Je droomde van een geheimzinnig ei. Zou het echt bestaan? ') + (HINT[q.zone] || HINT.bos);
  if (w.t === 'tool') return w.id === 'schaar'
    ? 'Het ei heeft het koud! In de bloemenwei ligt een warm sterretje. Maar de brug zit dicht met doornstruiken. Zoek de schaar in het dorp! Kijk maar op de kaart.'
    : n + ' heeft honger! Ze wil regenboogfruit. Maar er liggen grote stenen op de brug naar het strand. Zoek de hamer in het bos! Kijk maar op de kaart.';
  if (w.t === 'star') return neededTool() ? 'Met de schaar kun je naar de bloemenwei. Daar ligt een warm sterretje voor het ei.' : 'Het ei heeft het koud! Zoek het gevallen sterretje in de bloemenwei. Knip de doornstruiken op de brug weg.';
  if (w.t === 'fruit') return neededTool() ? 'Met de hamer kun je naar het strand. Daar ligt een boot naar het regenboogeiland.' : n + ' heeft honger! Sla de stenen op de brug kapot, ga naar het strand en neem de boot naar het regenboogeiland. Daar groeit regenboogfruit!';
  if (w.t === 'wei') return n + ' is nu sterk genoeg. Tik op ' + n + ' en klim op haar rug! Spring over de kapotte brug naar het kasteel. Daar wonen de eenhoorns.';
  return '';
}
/** one spoken sentence about what to do now */
export function goalText() {
  if (q.stage === 'feest') return 'Wat een feest! Het wordt avond. Ga maar lekker slapen in je huisje.';
  const w = wishes()[0]; return w ? wishText(w) : '';
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
/** the child picked up item `type` at spawn index `idx`: nothing depends on it, it is simply nice (coins buy a wish at the fountain) */
export function collect(type, idx) {
  (q.picked[type] = q.picked[type] || []).push(idx);
  q.totals[type] = (q.totals[type] || 0) + 1;
  const ev = [['collect', { type }]];
  if (type === 'munt') { q.coins++; ev.push(['coins', q.coins]); }
  commit(...ev);
  return { total: q.totals[type] };
}
/** kept for the houses: playing there is never needed for the adventure */
export function activityDone() { return false; }
export function foundEgg() {
  if (q.stage !== 'zoek') return false;
  q.stage = 'ei'; commit(['egg'], ['stage', 'ei']); return true;
}
function newLook() {
  const k = kind(), r = rnd(q, 99), pick = a => a[Math.floor(r() * a.length)];
  const used = new Set(q.herd.map(u => u.name)); const free = NAMES.filter(n => !used.has(n));
  return { body: pick(k.bodies), mane: pick(k.manes), horn: pick(k.horns), mark: null, wings: false, name: pick(free.length ? free : NAMES), kind: q.kind };
}
/** the fallen star warms the egg: it hatches on the spot */
export function hatch() {
  if (q.stage !== 'ei') return false;
  Object.assign(state.uni, newLook()); q.stage = 'baby';
  commit(['hatch', { name: state.uni.name }], ['stage', 'baby']); return true;
}
/** she eats the rainbow fruit: now she is strong enough to carry the girls */
export function feed() {
  if (q.stage !== 'baby') return false;
  q.stage = 'vriend'; commit(['fed'], ['stage', 'vriend']); return true;
}
export const weiOpen = () => q.stage === 'vriend';
/** the unicorn walks through the gate of the unicorn meadow */
export function deliver() {
  if (!weiOpen()) return false;
  q.herd.push(Object.assign({}, state.uni, { kind: q.kind }));
  q.stage = 'feest';
  commit(['herd'], ['stage', 'feest'], ['bedtime']); return true;
}
/** go to bed. Returns what the morning brings: {type: 'newegg' | 'morning', ...}. Things to collect lie there again every morning. */
export function sleep() {
  const from = q.stage; let res = { type: 'morning' };
  if (from === 'feest') {
    q.cycle++; q.stage = 'zoek'; q.broken = [];
    const r = rnd(q, 5); let k = q.cycle < ORDER.length ? ORDER[q.cycle] : (r() < .22 ? 'ster' : ORDER[Math.floor(r() * ORDER.length)]);
    if (q.cycle >= ORDER.length && k === q.kind) k = ORDER[(ORDER.indexOf(k) + 1) % ORDER.length];
    q.kind = k; q.zone = KINDS[k].zone || ZONES[Math.floor(r() * ZONES.length)]; q.spot = Math.floor(r() * 1000);
    q.dreamt = q.cycle;                                           // the bedroom shows this night's dream
    res = { type: 'newegg', kind: k };
  }
  q.day++; q.picked = {};
  res.from = from; res.stage = q.stage;
  commit(['day', res], ...(q.stage !== from ? [['stage', q.stage]] : []));
  return res;
}
/** has the dream that starts this cycle been shown? */
export const needsDream = () => q.stage === 'zoek' && q.dreamt !== q.cycle;
export function dreamShown() { if (q.dreamt !== q.cycle) { q.dreamt = q.cycle; save(); } }
export function spendCoins(n) { if (q.coins < n) return false; q.coins -= n; commit(['coins', q.coins]); return true; }
/** the unicorn to draw next to the girls: always the little one that came out of the egg */
export function companionLook() { return state.uni; }
/** dev / tests only */
export function _reset(patch) { for (const k of Object.keys(q)) delete q[k]; Object.assign(q, fresh(), { herd: [] }, patch || {}); commit(['stage', q.stage], ['day', { type: 'morning' }]); }
