import * as ui from './ui.js';
import * as PX from './pixel.js';
import { state, save } from './state.js';
import { sfx, speak, unlock, startMusic, setMusic, setMood, setVoice } from './audio.js';
import * as Q from './quest.js';
import { createHud } from './hud.js';

const $ = s => document.querySelector(s);
const ACTS = {
  stal: () => import('./act-stal.js'),
  atelier: () => import('./act-atelier.js'),
  bakkerij: () => import('./act-bakkerij.js'),
  kermis: () => import('./act-kermis.js'),
  huisje: () => import('./act-huisje.js'),
};
const params = new URLSearchParams(location.search); // dev only: ?act=atelier opens an activity directly
let world = null;
const hud = createHud(() => world);
// evening falls by itself when today's wishes are done; a night's sleep brings the morning
let musicStarted = false;
function syncNight(instant) { const n = Q.bedtime(); if (state.night !== n) { state.night = n; save(); } setNightIcon(); world && world.setNight(n, instant); if (musicStarted) setMood(n ? 'night' : 'day'); }
let wishInActivity = false;
Q.on(type => { if (type === 'bedtime' || type === 'day' || type === 'stage') syncNight(); if (type === 'wish' && ui.activityOpen()) wishInActivity = true; });

$('#book-ico').appendChild(PX.domSprite(PX.star(), 3));
const setNightIcon = () => { const i = $('#night-ico'); i.innerHTML = ''; i.appendChild(PX.domSprite(state.night ? PX.moon() : PX.sparkle('#FFD43B'), 3)); };
setNightIcon(); ui.updateBookCount();

/** a new cycle brings a new island: the village stays, everything around it is laid out afresh (the girls wake up to it) */
let makeWorld = null;
function rebuildIfNewIsland() {
  if (!world || !makeWorld || world.seed === Q.mapSeed()) return;
  world.destroy(); world = makeWorld(); world.setInteractive(true); syncNight(true);
}
async function enter(id) {
  if (ui.activityOpen()) return;
  if (id === 'stal' && !Q.hasUnicorn()) {          // nobody lives there yet
    sfx.wrong(); speak(Q.quest.stage === 'ei' ? 'In de stal is het nog stil. Eerst moet het ei uitkomen!' : 'De stal is nog leeg. Zoek eerst een ei!');
    world && world.exitBuilding(id); return;
  }
  wishInActivity = false;
  world && world.pause(true);
  sfx.door();
  try {
    const mod = await ACTS[id]();
    ui.openActivity(mod, () => { rebuildIfNewIsland(); if (world) { world.refreshUnicorn(); world.exitBuilding(id); world.pause(false); } syncNight(); if (wishInActivity || id === 'huisje') speak(Q.goalText()); });
  } catch (e) {
    console.error(e); speak('Dit huisje is nog in aanbouw!');
    if (world) { world.exitBuilding(id); world.pause(false); }
  }
}
$('#act-close').onclick = () => { sfx.pop(); ui.closeActivity(); };
$('#b-book').onclick = () => ui.openBook();
$('#b-night').onclick = () => { state.night = !state.night; save(); setNightIcon(); world && world.setNight(state.night); setMood(state.night ? 'night' : 'day'); sfx.sparkle(); speak(state.night ? 'Welterusten! Het is nacht.' : 'Goedemorgen! Het is dag.'); };
$('#b-music').onclick = e => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', on); setMusic(on); };
$('#b-voice').onclick = e => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', on); setVoice(on); };

$('#b-start').onclick = () => {
  unlock(); startMusic(); musicStarted = true; setMood(state.night ? 'night' : 'day'); sfx.tada();
  $('#start').hidden = true;
  world && world.setInteractive(true);
  speak('Welkom in Eenhoornland, Anna en Fenna! Tik ergens om te lopen. ' + Q.goalText());
};

if (params.get('act')) {
  $('#start').hidden = true;
  enter(params.get('act'));
} else {
  import('./world.js').then(m => {
    makeWorld = () => m.createWorld($('#world'), { onEnter: enter, onWish: () => ui.reward('Plons! Je wens komt uit!') });
    world = makeWorld();
    syncNight(true);
    if (params.has('night')) world.setNight(true, true);
    if (params.has('go')) { $('#start').hidden = true; world.setInteractive(true); }
  }).catch(e => { console.error(e && e.stack || e); $('#start p').textContent = 'Oeps, de wereld kon niet laden. Probeer het opnieuw.'; const d = document.createElement('p'); d.style.cssText = 'font-size:.8rem;opacity:.8;max-width:90vw'; d.textContent = String(e && e.message || e); $('#start').appendChild(d); });
}
