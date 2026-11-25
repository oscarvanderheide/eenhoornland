import * as ui from './ui.js';
import * as PX from './pixel.js';
import { state, save } from './state.js';
import { sfx, speak, unlock, startMusic, setMusic, setMood, setVoice } from './audio.js';
import * as Q from './quest.js';
import { createHud } from './hud.js';
import { playDream } from './dream.js';
import { playHatch, playFeed, playPull } from './cutscene.js';
import { openShop } from './shop.js';
import { initGamepad } from './gamepad.js';
import { startButton } from './saves.js';

const $ = s => document.querySelector(s);
const ACTS = {
  stal: () => import('./act-stal.js'),
  atelier: () => import('./act-atelier.js'),
  bakkerij: () => import('./act-bakkerij.js'),
  kermis: () => import('./act-kermis.js'),
  huisje: () => import('./act-huisje.js'),
  kasteel: () => import('./act-kasteel.js'),
  race: () => import('./act-race.js'),
  zee: () => import('./act-zee.js'),          // under the sea, with the sea unicorn (world-life.js)
  wolken: () => import('./act-wolken.js'),    // up in the clouds, with the star unicorn
};
const params = new URLSearchParams(location.search); // dev only: ?act=atelier opens an activity directly
let world = null;
const hud = createHud(() => world);
initGamepad(() => world);   // a game controller plays through the same buttons (gamepad.js)
// evening falls by itself when the unicorn has come home; a night's sleep brings the morning (and a new dream)
let musicStarted = false;
function syncNight(instant) { const n = Q.bedtime(); if (state.night !== n) { state.night = n; save(); } setNightIcon(); world && world.setNight(n, instant); if (musicStarted) setMood(n ? 'night' : 'day'); }
let wishInActivity = false;
Q.on(type => { if (type === 'bedtime' || type === 'day' || type === 'stage') syncNight(); if (type === 'wish' && ui.activityOpen()) wishInActivity = true; });

const setNightIcon = () => { const i = $('#night-ico'); i.innerHTML = ''; i.appendChild(PX.domSprite(state.night ? PX.moon() : PX.sparkle('#FFD43B'), 3)); };
setNightIcon();

/** a new cycle brings a new island: the village stays, everything around it is laid out afresh (the girls wake up to it) */
let makeWorld = null;
/** the big moments: the new stage is saved first, then the whole screen shows it happening, then the world goes on */
async function show(type, data) {
  if (!world) return; const w = world; w.pause(true);
  try {
    if (type === 'hatch' && Q.hatch()) await playHatch($('#game'), w.who(), data.kindDef, state.uni);
    if (type === 'feed' && Q.feed()) await playFeed($('#game'), w.who(), state.uni);
    if (type === 'pull') await playPull($('#game'), w.who(), Q.quest.stage === 'ei' ? Q.kind() : null);
  } catch (e) { console.error(e); }
  if (world === w) { w.refreshUnicorn(); w.pause(false); }
}
function rebuildIfNewIsland() {
  if (!world || !makeWorld || world.seed === Q.mapSeed()) return;
  world.destroy(); world = makeWorld(); world.setInteractive(true); syncNight(true); hud.render();
}
async function enter(id) {
  if (ui.activityOpen()) return;
  if (id === 'stal' && !Q.stalOpen()) {          // nobody lives there yet
    sfx.wrong(); speak(Q.quest.stage === 'ei' ? 'In de stal is het nog stil. Eerst moet het ei uitkomen!' : 'De stal is nog leeg. Zoek eerst een ei!');
    world && world.exitBuilding(id); return;
  }
  wishInActivity = false;
  world && world.pause(true);
  sfx.door();
  try {
    const mod = await ACTS[id]();
    const day0 = Q.quest.day; ui.openActivity(mod, () => { rebuildIfNewIsland(); if (world) { world.refreshUnicorn(); world.exitBuilding(id); world.pause(false); if (id === 'huisje' && Q.quest.day !== day0) { world.wakeUp(); quietHud(); } } syncNight(); if (wishInActivity || id === 'huisje') speak(Q.goalText()); });
  } catch (e) {
    console.error(e); speak('Dit huisje is nog in aanbouw!');
    if (world) { world.exitBuilding(id); world.pause(false); }
  }
}
$('#act-close').onclick = () => { sfx.pop(); ui.closeActivity(); };
$('#b-night').onclick = () => { state.night = !state.night; save(); setNightIcon(); world && world.setNight(state.night); setMood(state.night ? 'night' : 'day'); sfx.sparkle(); speak(state.night ? 'Welterusten! Het is nacht.' : 'Goedemorgen! Het is dag.'); };
// whoever switches the music off wants it to stay off, also tomorrow
$('#b-music').onclick = e => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', on); setMusic(on); state.extra.music = on; save(); };
if (state.extra.music === false) { $('#b-music').setAttribute('aria-pressed', 'false'); setMusic(false); }
$('#b-voice').onclick = e => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', on); setVoice(on); };

/** the first seconds of a morning: just her, her house and the morning light; the goal shows up after a little while */
function quietHud() { const q = $('#quest'); if (!q) return; q.style.transition = 'opacity .8s'; q.style.opacity = 0; setTimeout(() => { q.style.opacity = 1; }, 6000); }
/* ---------- start: who plays? Then the dream, then outside ---------- */
startButton($('#start'));   // which of the three saves
// The girl who is picked dreams of a mysterious egg and a unicorn, wakes up, and the adventure begins at her own front door.
for (const b of document.querySelectorAll('#start .pick')) {
  const who = b.dataset.who, cv = PX.domSprite(PX[who](), 6); b.querySelector('.face').appendChild(cv);
  b.onclick = async () => {
    if ($('#start').classList.contains('busy')) return; $('#start').classList.add('busy');
    unlock(); startMusic(); musicStarted = true; sfx.tada();
    state.extra.who = who; save(); world && world.setWho(who, true); hud.syncWho();
    const dream = Q.needsDream();
    if (dream) { setMood('night'); await playDream($('#game'), who, Q.kind()); Q.dreamShown(); world && world.exitBuilding('huisje'); }
    setMood(state.night ? 'night' : 'day');
    $('#start').hidden = true; world && world.setInteractive(true); world && world.wakeUp(); quietHud();
    speak((dream ? '' : 'Welkom terug in Eenhoornland! ') + 'Tik ergens om te lopen. ' + Q.goalText());
  };
}

if (params.get('act')) {
  $('#start').hidden = true;
  enter(params.get('act'));
} else {
  import('./world.js').then(m => {
    makeWorld = () => m.createWorld($('#world'), { onEnter: enter, onWish: () => ui.reward('Plons! Je wens komt uit!'), onMount: () => hud.render(), onShow: show, onShop: () => openShop(() => world.who()) });
    world = makeWorld(); hud.render();
    syncNight(true);
    if (params.has('night')) world.setNight(true, true);
    if (params.has('go')) { $('#start').hidden = true; Q.dreamShown(); world.setInteractive(true); }
    if (params.has('dream')) playDream($('#game'), world.who(), Q.kind());   // dev: watch the dream again
    if (params.get('scene') === 'hatch') playHatch($('#game'), world.who(), Q.kind(), state.uni); if (params.get('scene') === 'feed') playFeed($('#game'), world.who(), state.uni); if (params.get('scene') === 'pull') playPull($('#game'), world.who(), Q.kind());
  }).catch(e => { console.error(e && e.stack || e); $('#start p').textContent = 'Oeps, de wereld kon niet laden. Probeer het opnieuw.'; const d = document.createElement('p'); d.style.cssText = 'font-size:.8rem;opacity:.8;max-width:90vw'; d.textContent = String(e && e.message || e); $('#start').appendChild(d); });
}
