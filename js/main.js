import * as ui from './ui.js';
import * as PX from './pixel.js';
import { state, save } from './state.js';
import { sfx, speak, unlock, startMusic, setMusic, setMood, setVoice } from './audio.js';

const $ = s => document.querySelector(s);
const ACTS = {
  stal: () => import('./act-stal.js'),
  atelier: () => import('./act-atelier.js'),
  bakkerij: () => import('./act-bakkerij.js'),
  kermis: () => import('./act-kermis.js'),
};
const params = new URLSearchParams(location.search); // dev only: ?act=atelier opens an activity directly
let world = null;

$('#book-ico').appendChild(PX.domSprite(PX.star(), 3));
const setNightIcon = () => { const i = $('#night-ico'); i.innerHTML = ''; i.appendChild(PX.domSprite(state.night ? PX.moon() : PX.sparkle('#FFD43B'), 3)); };
setNightIcon(); ui.updateBookCount();

async function enter(id) {
  if (ui.activityOpen()) return;
  world && world.pause(true);
  sfx.door();
  try {
    const mod = await ACTS[id]();
    ui.openActivity(mod, () => { if (world) { world.refreshUnicorn(); world.exitBuilding(id); world.pause(false); } });
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
  unlock(); startMusic(); setMood(state.night ? 'night' : 'day'); sfx.tada();
  $('#start').hidden = true;
  world && world.setInteractive(true);
  speak('Welkom in Eenhoornland, Anna en Fenna! Tik ergens om te lopen. Ga naar de stal, het atelier, de bakkerij of de kermis!');
};

if (params.get('act')) {
  $('#start').hidden = true;
  enter(params.get('act'));
} else {
  import('./world.js').then(m => {
    world = m.createWorld($('#world'), { onEnter: enter });
    world.setNight(state.night, true);
    if (params.has('night')) world.setNight(true, true);
    if (params.has('go')) { $('#start').hidden = true; world.setInteractive(true); }
  }).catch(e => { console.error(e && e.stack || e); $('#start p').textContent = 'Oeps, de wereld kon niet laden. Probeer het opnieuw.'; const d = document.createElement('p'); d.style.cssText = 'font-size:.8rem;opacity:.8;max-width:90vw'; d.textContent = String(e && e.message || e); $('#start').appendChild(d); });
}
