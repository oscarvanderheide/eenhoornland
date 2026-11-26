// Quest HUD: today's wishes as picture chips (top-left), coins, bedtime button, and the island map.
// Everything is spoken when tapped — the players cannot read yet.
import * as PX from './pixel.js';
import * as ART from './art.js';
import * as MAP from './map.js';
import * as WILD from './art-wild.js';
import * as Q from './quest.js';
import { sfx, speak } from './audio.js';
import * as ui from './ui.js';
import { state } from './state.js';
import { openSaves, slotIcon } from './saves.js';

const CSS = `
#quest{display:flex;flex-wrap:wrap;gap:6px;max-width:min(60vw,420px);align-items:center}
.qchip{font-family:var(--f-pixel);font-weight:700;font-size:1.1rem;color:var(--ink);cursor:pointer;display:flex;align-items:center;gap:6px;height:48px;padding:4px 10px 4px 7px;
  background:var(--paper);border:3px solid var(--ink);border-radius:8px;box-shadow:inset -3px -3px 0 var(--paper2),0 3px 0 var(--ink)}
.qchip:active{transform:translateY(2px)}
.qchip canvas{image-rendering:pixelated;display:block}
.qchip.done{background:#C9F2D2;box-shadow:inset -3px -3px 0 #9ADBA9,0 3px 0 var(--ink)}
.qchip.next{opacity:.55}
.qchip.now{animation:qnow 2.4s ease-in-out infinite}
@keyframes qnow{0%,80%,100%{transform:scale(1)}90%{transform:scale(1.12)}}
.qchip.coins{background:#FFF3C4;box-shadow:inset -3px -3px 0 #F2D675,0 3px 0 var(--ink)}
.qchip.bed{background:var(--lilac);color:#fff;font-size:1.25rem;padding-right:14px;box-shadow:inset -3px -3px 0 #8E74D6,0 3px 0 var(--ink);animation:qpulse 1.1s ease-in-out infinite;text-shadow:1px 1px 0 var(--ink)}
.qchip.bump{animation:qbump .45s cubic-bezier(.22,1,.36,1)}
@keyframes qpulse{50%{transform:scale(1.08)}}
@keyframes qbump{0%{transform:scale(1)}40%{transform:scale(1.25)}100%{transform:scale(1)}}
.kaart{display:flex;flex-direction:column;gap:10px;width:min(640px,calc(100vw - 76px),calc((100vh - 150px) * 1.78))}
#modal .card:has(.kaart){max-width:min(720px,100%)}
.kaart-map{position:relative;border:3px solid var(--ink);border-radius:6px;overflow:hidden;line-height:0}
.kaart-map canvas{width:100%;height:auto;image-rendering:pixelated;display:block}
.kaart-pin{position:absolute;transform:translate(-50%,-50%);font-family:var(--f-pixel);font-weight:700;font-size:.9rem;line-height:1.1;color:var(--ink);cursor:pointer;display:flex;align-items:center;gap:4px;
  padding:4px 7px;background:var(--paper);border:3px solid var(--ink);border-radius:8px;box-shadow:0 3px 0 var(--ink);white-space:nowrap}
.kaart-pin canvas{image-rendering:pixelated}
.kaart-me{position:absolute;transform:translate(-50%,-85%);pointer-events:none;animation:bob 1s ease-in-out infinite;z-index:2}
.kaart-egg{position:absolute;transform:translate(-50%,-50%);pointer-events:none;animation:qpulse 1s ease-in-out infinite;font-family:var(--f-pixel);font-weight:700;font-size:1.6rem;color:#fff;text-shadow:2px 2px 0 var(--ink),-2px 2px 0 var(--ink),2px -2px 0 var(--ink),-2px -2px 0 var(--ink)}
#stick{position:absolute;z-index:6;left:max(18px,env(safe-area-inset-left,0px));bottom:calc(14px + env(safe-area-inset-bottom,0px) * .35);width:132px;height:132px;border-radius:50%;background:rgba(255,248,230,.38);border:3px solid rgba(58,42,61,.55);box-shadow:inset 0 0 0 6px rgba(255,255,255,.25);touch-action:none;cursor:grab}
#stick .knob{position:absolute;left:50%;top:50%;width:62px;height:62px;margin:-31px 0 0 -31px;border-radius:50%;background:var(--paper);border:3px solid var(--ink);box-shadow:inset -4px -4px 0 var(--paper2),0 3px 0 var(--ink);pointer-events:none;transition:transform .12s}
#stick.on .knob{transition:none}
#stick.on{background:rgba(255,248,230,.55)}
#pad{position:absolute;z-index:5;right:max(10px,env(safe-area-inset-right,0px));bottom:calc(8px + env(safe-area-inset-bottom,0px) * .35);width:200px;height:200px;pointer-events:none;--b:66px}
#pad .hbtn{position:absolute;width:var(--b);height:var(--b);border-radius:50%;padding:0;pointer-events:auto;touch-action:none}
#pad .hbtn canvas{width:auto;max-width:calc(var(--b) - 20px);max-height:calc(var(--b) - 20px)}
#pad .hbtn.off{visibility:hidden}
#pad .ps{position:absolute;width:24px;height:24px;border-radius:50%;background:#fff;border:2px solid var(--ink);display:grid;place-items:center;pointer-events:none}
#pad .ps svg{width:16px;height:16px;fill:none;stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round}
#b-jump{left:calc(50% - var(--b) / 2);bottom:0}#b-jump .ps{right:-6px;bottom:-4px}
#b-hop{right:0;top:calc(50% - var(--b) / 2);background:#FFE9EC}#b-hop .ps{right:-6px;top:-6px}
#b-sword{left:0;top:calc(50% - var(--b) / 2);background:#FFE6F6}#b-sword .ps{left:-6px;top:-6px}
#b-hook{left:calc(50% - var(--b) / 2);top:0;background:#E3FAF3}#b-hook .ps{right:-6px;top:-6px}
#b-jump.idle canvas{opacity:.35}
#b-sword.bump,#b-hop.bump{animation:qbump .3s cubic-bezier(.22,1,.36,1)}
#b-jump.ctx{background:#FFF3C4;box-shadow:0 0 0 4px #FFD43B,0 3px 0 var(--ink)}
#b-jump.bump{animation:qbump .35s cubic-bezier(.22,1,.36,1)}
#b-jump{touch-action:none}
#b-ride{position:absolute;z-index:5;right:calc(max(14px,env(safe-area-inset-right,0px)) + 214px);bottom:calc(12px + env(safe-area-inset-bottom,0px) * .35);width:64px;height:64px;border-radius:50%;padding:0;background:#FFE3F1}
#b-ride.call{animation:qpulse .9s ease-in-out infinite;box-shadow:0 0 0 5px #FF7EB6,0 3px 0 var(--ink)}
#b-ride.on{background:var(--sun);box-shadow:0 0 0 4px #FFD43B,0 3px 0 var(--ink)}
#b-ride canvas{width:52px}
#b-fly{position:absolute;z-index:5;right:calc(max(14px,env(safe-area-inset-right,0px)) + 214px);bottom:calc(86px + env(safe-area-inset-bottom,0px) * .35);width:64px;height:64px;border-radius:50%;padding:0;background:#E3F1FF}
#b-fly.call{animation:qpulse .9s ease-in-out infinite;box-shadow:0 0 0 5px #7EC3FF,0 3px 0 var(--ink)}
#b-fly.on{background:#FFF3C4;box-shadow:0 0 0 4px #FFD43B,0 3px 0 var(--ink)}
#b-fly canvas{width:50px}
#who{display:flex;flex-direction:row;gap:6px;align-items:center}
#who .who{width:48px;height:48px;border-radius:50%;padding:0;opacity:.55;transform:scale(.82);transition:transform .15s,opacity .15s}
#who .who.on{opacity:1;transform:scale(1);box-shadow:0 0 0 4px #FFD43B,0 3px 0 var(--ink)}
#who canvas{image-rendering:pixelated}
#tools{position:absolute;z-index:5;left:max(12px,env(safe-area-inset-left,0px));bottom:calc(162px + env(safe-area-inset-bottom,0px) * .35);display:flex;gap:6px}
.kaart-goal{position:absolute;transform:translate(-50%,-50%);cursor:pointer;animation:qpulse 1s ease-in-out infinite;z-index:3;padding:5px;background:#FFF3C4;border:3px solid var(--ink);border-radius:50%;line-height:0;box-shadow:0 0 0 4px #FFD43B,0 3px 0 var(--ink);display:flex;align-items:center;font-family:var(--f-pixel);font-weight:700;font-size:1.2rem}
.kaart-gate{position:absolute;transform:translate(-50%,-50%);pointer-events:none;z-index:1;line-height:0}
@media (max-width:640px),(max-height:480px){#stick{width:118px;height:118px}#stick .knob{width:54px;height:54px;margin:-27px 0 0 -27px}#tools{bottom:calc(144px + env(safe-area-inset-bottom,0px) * .35)}#pad{width:162px;height:162px;--b:56px}#b-ride{width:54px;height:54px;right:calc(max(14px,env(safe-area-inset-right,0px)) + 172px)}#b-ride canvas{width:40px}#b-fly{width:54px;height:54px;right:calc(max(14px,env(safe-area-inset-right,0px)) + 172px);bottom:calc(74px + env(safe-area-inset-bottom,0px) * .35)}#b-fly canvas{width:40px}#who .who{width:42px;height:42px}#quest{max-width:46vw}.qchip{height:42px;font-size:1rem;padding:3px 7px 3px 5px}.kaart-pin span{display:none}}
`;
const fit = (cv, px) => { const s = Math.max(1, Math.floor(px / Math.max(cv.width, cv.height))); const c = PX.domSprite(cv, s); return c; };

/** getWorld() returns the world api once it has loaded (or null) */
export function createHud(getWorld) {
  const game = document.getElementById('game');
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  // top left, in the same row as the buttons top right: coins (and the bed when it is bedtime)
  const panel = document.createElement('div'); panel.id = 'quest'; document.querySelector('.hud.tl').appendChild(panel);
  const night = document.getElementById('b-night'); if (night) night.hidden = true;
  const music = document.getElementById('b-music'); if (music) music.hidden = true;                // the sound is the phone's or laptop's job
  const voice = document.getElementById('b-voice'); if (voice) voice.hidden = true;                 // there is no voice (see audio.js)     // evening now comes by itself when the wishes are done
  // top right: the three saves (the map has no button of its own: a goal chip opens it)
  const saveBtn = document.createElement('button'); saveBtn.className = 'hbtn'; saveBtn.id = 'b-save'; saveBtn.setAttribute('aria-label', 'Ander spel'); saveBtn.appendChild(PX.domSprite(slotIcon(), 3));
  const tr = document.querySelector('.hud.tr'); tr.insertBefore(saveBtn, tr.firstChild); saveBtn.onclick = () => { if (!ui.activityOpen()) openSaves(); };

  // bottom right: four buttons laid out like the ones on a PlayStation controller, each with its own shape in the corner,
  // so the same button does the same thing on the screen and in the hand:
  //   ✕ (bottom) does what is right here (its picture shows what: say hello to an animal (twice: pick it up), take a toy,
  //     the bell, a door...), ○ (right) jumps, □ (left) the sword, △ (top) the hookshot. Sword and hookshot only show
  //     once she has them. pointerdown, not click: on a phone it answers at once, and a finger that slides off still counts
  const PS = { x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke="#4C7EE8"/>', o: '<circle cx="12" cy="12" r="6.5" stroke="#F0505F"/>', sq: '<rect x="6" y="6" width="12" height="12" rx="1" stroke="#E86CB8"/>', tri: '<path d="M12 5.2l7.2 12.6H4.8z" stroke="#21B48E"/>' };
  const pad = document.createElement('div'); pad.id = 'pad'; game.appendChild(pad);
  function padBtn(id, label, ps, icon, run) {
    const b = document.createElement('button'); b.className = 'hbtn'; b.id = id; b.setAttribute('aria-label', label);
    const art = document.createElement('span'); art.className = 'art'; if (icon) art.appendChild(PX.domSprite(icon, Math.min(4, 46 / Math.max(icon.width, icon.height)))); b.appendChild(art);
    b.insertAdjacentHTML('beforeend', `<span class="ps"><svg viewBox="0 0 24 24">${PS[ps]}</svg></span>`);
    b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const w = getWorld(); if (w) run(w); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); });
    b.addEventListener('click', e => { if (e.detail === 0) { const w = getWorld(); w && run(w); } });   // the keyboard (Enter on a focused button)
    pad.appendChild(b); return b;
  }
  const setArt = (b, c) => { const a = b.querySelector('.art'); a.innerHTML = ''; a.appendChild(PX.domSprite(c, Math.min(4, 46 / Math.max(c.width, c.height)))); };
  const jumpBtn = padBtn('b-jump', 'Doen', 'x', ART.handIcon(), w => { w.jump(); syncAct(true); });
  const hopBtn = padBtn('b-hop', 'Springen', 'o', ART.jumpIcon(), w => w.leapNow());
  const swordBtn = padBtn('b-sword', 'Zwaard', 'sq', ART.toolIcon('zwaard'), w => w.slash());
  const hookBtn = padBtn('b-hook', 'Haak', 'tri', ART.toolIcon('haak'), w => w.hook && w.hook());
  let actKey = '', actIcon = null;
  function syncAct(force) {
    const w = getWorld(), a = w && w.action ? w.action() : null, key = a ? a.key : actKey, up = !!(w && w.flying && w.flying());
    pad.style.visibility = up ? 'hidden' : '';                                   // up in the sky the wing button is the one that lands
    swordBtn.classList.toggle('off', !Q.hasTool('zwaard'));
    hookBtn.classList.toggle('off', !Q.hasTool('haak'));
    if (key === actKey && (!a || a.icon === actIcon) && !force) return;
    if (a && (key !== actKey || a.icon !== actIcon)) {
      actKey = key; actIcon = a.icon; const idle = key === 'jump' || key === 'none';                // nothing here: ✕ does nothing, so it shows an empty hand
      setArt(jumpBtn, idle ? ART.handIcon() : a.icon); jumpBtn.classList.toggle('idle', idle);
      jumpBtn.classList.toggle('ctx', !idle); jumpBtn.classList.remove('bump'); void jumpBtn.offsetWidth; jumpBtn.classList.add('bump');
    }
  }
  setInterval(() => syncAct(false), 120);
  // the joystick (bottom left): drag the knob and she walks that way, the further the faster; let go and she stops
  const stickEl = document.createElement('div'); stickEl.id = 'stick'; const knob = document.createElement('div'); knob.className = 'knob'; stickEl.appendChild(knob); game.appendChild(stickEl);
  let stickId = null;
  const moveStick = e => {
    const r = stickEl.getBoundingClientRect(), R = r.width / 2, dx = e.clientX - (r.left + R), dy = e.clientY - (r.top + R), l = Math.hypot(dx, dy), m = Math.min(l, R * .62), k = l ? m / l : 0;
    knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`; const v = Math.min(1, l / (R * .62)), dead = l < R * .14;
    const w = getWorld(); w && w.stick(dead ? 0 : dx / l * v, dead ? 0 : dy / l * v);
  };
  const stopStick = e => { if (e.pointerId !== stickId) return; stickId = null; knob.style.transform = ''; stickEl.classList.remove('on'); const w = getWorld(); w && w.stick(0, 0); };
  stickEl.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); stickId = e.pointerId; try { stickEl.setPointerCapture(e.pointerId); } catch (err) { } stickEl.classList.add('on'); moveStick(e); });
  stickEl.addEventListener('pointermove', e => { if (e.pointerId === stickId) moveStick(e); });
  stickEl.addEventListener('pointerup', stopStick); stickEl.addEventListener('pointercancel', stopStick); stickEl.addEventListener('lostpointercapture', stopStick);
  // riding: once the unicorn has eaten the rainbow fruit this button puts the girl on her back (and takes her off again; also off the bike)
  const rideBtn = document.createElement('button'); rideBtn.className = 'hbtn'; rideBtn.id = 'b-ride'; rideBtn.setAttribute('aria-label', 'Rijden'); rideBtn.hidden = true;
  rideBtn.onclick = () => { const w = getWorld(); if (w) { w.ride(); render(); } }; game.appendChild(rideBtn);
  let rideSig = '';
  // flying: a grown unicorn (hers once she can carry her, or an old one walking along) has wings. This button takes off
  // and lands; it asks for a tap (pulses) until the girls have flown once
  const flyBtn = document.createElement('button'); flyBtn.className = 'hbtn'; flyBtn.id = 'b-fly'; flyBtn.setAttribute('aria-label', 'Vliegen'); flyBtn.hidden = true;
  flyBtn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const w = getWorld(); if (!w || !w.fly) return; if (!w.flying()) { state.extra.flown = true; } w.fly(); syncFly(true); });
  flyBtn.addEventListener('click', e => { if (e.detail === 0) { const w = getWorld(); w && w.fly && w.fly(); } });
  game.appendChild(flyBtn);
  let flySig = '';
  function syncFly(force) {
    const w = getWorld(), up = !!(w && w.flying && w.flying()), can = !!(w && w.canFly && w.canFly()), sig = up + ':' + can;
    if (sig === flySig && !force) return; flySig = sig;
    flyBtn.hidden = !(up || can); flyBtn.classList.toggle('on', up); flyBtn.classList.toggle('call', can && !up && !state.extra.flown);
    flyBtn.innerHTML = ''; flyBtn.appendChild(PX.domSprite(up ? WILD.landIcon() : WILD.flyIcon(), 4));
    rideBtn.style.visibility = up ? 'hidden' : '';
  }
  setInterval(() => syncFly(false), 150);
  function syncRide() {
    const w = getWorld(), m = w ? w.mount() : null, sig = (Q.canRide() || m ? 1 : 0) + ':' + m + ':' + state.uni.body + state.uni.mane; rideBtn.hidden = !(Q.canRide() || m); rideBtn.classList.toggle('on', !!m); rideBtn.classList.toggle('call', Q.canRide() && !m);   // not riding although she could: the button asks for it
    if (sig !== rideSig) {
      rideSig = sig; rideBtn.innerHTML = ''; rideBtn.appendChild(PX.domSprite(m === 'fiets' ? ART.bike() : ART.uniSprite(Q.companionLook(), 'idle', false, { baby: true }), 3)); }
  }
  // who is playing: the sisters tap their own face when they swap seats (top right, next to the saves)
  const whoRow = document.createElement('div'); whoRow.id = 'who'; tr.insertBefore(whoRow, saveBtn);
  const head = (cv, rows) => { const c = document.createElement('canvas'); c.width = cv.width; c.height = rows; c.getContext('2d').drawImage(cv, 0, 0); return PX.domSprite(c, 3); };
  const whoBtn = {};
  for (const [id, rows] of [['anna', 9], ['fenna', 11]]) {
    const b = document.createElement('button'); b.className = 'hbtn who'; b.setAttribute('aria-label', id === 'anna' ? 'Anna speelt' : 'Fenna speelt'); b.appendChild(head(PX[id](), rows));
    b.onclick = () => { const w = getWorld(); if (!w) return; if (w.who() === id) { sfx.click(); speak((id === 'anna' ? 'Anna' : 'Fenna') + ' speelt nu.'); } else { w.setWho(id); syncWho(); } };
    whoRow.appendChild(b); whoBtn[id] = b;
  }
  function syncWho() { const w = getWorld(), cur = w ? w.who() : (state.extra.who || 'anna'); for (const id in whoBtn) whoBtn[id].classList.toggle('on', id === cur); }
  syncWho();
  const toolRow = document.createElement('div'); toolRow.id = 'tools'; game.appendChild(toolRow);
  const TOOL_SAY = { zwaard: 'Dit is het zwaard. Tik op een doornstruik om hem weg te hakken!' };

  let lastSig = {};
  function chip(cls, icon, text, onTap, key, parent = panel) {
    const b = document.createElement('button'); b.className = 'qchip ' + cls; if (icon) b.appendChild(fit(icon, 30));
    if (text) { const s = document.createElement('span'); s.textContent = text; b.appendChild(s); }
    b.onclick = () => { sfx.click(); onTap(); };
    if (key) { const sig = text + cls; if (lastSig[key] !== undefined && lastSig[key] !== sig) b.classList.add('bump'); lastSig[key] = sig; }
    parent.appendChild(b); return b;
  }
  const goalIcon = w => w.t === 'tool' ? ART.toolIcon(w.id) : w.t === 'egg' ? ART.egg(Q.kind()) : w.t === 'star' ? ART.warmItem(Q.quest.kind) : w.t === 'fruit' ? ART.foodItem(Q.quest.kind) : PX.rainbow();
  function render() {
    panel.innerHTML = ''; toolRow.innerHTML = '';
    for (const id of Object.keys(Q.TOOLS)) if (Q.hasTool(id) && id !== 'zwaard' && id !== 'haak') chip('', ART.toolIcon(id), '', () => speak(TOOL_SAY[id]), 'tool' + id, toolRow);
    if (Q.bedtime()) chip('bed', ART.bedIcon(), 'Slapen', goToBed, 'bed'); else delete lastSig.bed;
    // no goal chips (Oscar: they find out for themselves what comes next); the map is still there for tests (openMap)
    chip('coins', ART.coin(), String(Q.quest.coins), () => { speak('Met muntjes en met alles wat je vindt kun je bij de kraam in het dorp iets moois ruilen.'); const w = getWorld(); if (w && !ui.activityOpen()) (w.travel ? w.travel(MAP.STALL.x, MAP.STALL.z + 1) : w.walkToTile(MAP.STALL.x, MAP.STALL.z + 1)); }, 'coins');   // coins are for the stall: she walks there
    syncRide();
  }
  function goToBed() { const w = getWorld(); speak('Naar het huisje, lekker slapen!'); if (w && !ui.activityOpen()) { const d = MAP.houseDoor(MAP.HOUSES.huisje); w.travel ? w.travel(d[0], d[1] + 1, () => w.walkToBuilding('huisje')) : w.walkToBuilding('huisje'); } }

  /* ---------- the map: all the islands, where you are, and where to go now ---------- */
  /** where the goal of this moment is: {icon, text, at: [x, z] on the map, go()} */
  function goal(world) {
    const I = MAP.ISLES, P = MAP.PLACES, w = Q.wishes()[0], walk = t => () => world.travel ? world.travel(t[0], t[1]) : world.walkToTile(t[0], t[1]);
    if (Q.bedtime()) { const h = MAP.HOUSES.huisje; return { icon: ART.bedIcon(), text: '', at: [h.x + h.w / 2, h.z + h.d / 2], go: goToBed }; }
    if (!w) return null;
    if (w.t === 'tool') { const ts = world.tools.spot(w.id); return ts && { icon: goalIcon(w), text: '', at: ts, go: walk([Math.floor(ts[0]), Math.floor(ts[1])]) }; }
    if (w.t === 'egg') { const z = I[Q.quest.zone] ? Q.quest.zone : 'bos'; return { icon: goalIcon(w), text: '?', at: [I[z].cx, I[z].cz + 2], go: walk(P[z].tile) }; }
    if (w.t === 'star') return { icon: goalIcon(w), text: '', at: [I.wei.cx + 6, I.wei.cz], go: walk(P.wei.tile) };
    if (w.t === 'fruit') return { icon: goalIcon(w), text: '', at: [MAP.RAINBOW_TREE[0] + 1, MAP.RAINBOW_TREE[1] + 1], go: walk([MAP.RAINBOW_TREE[0] + 1, MAP.RAINBOW_TREE[1] + 1]) };
    return { icon: goalIcon(w), text: '', at: [MAP.CASTLE.x + MAP.CASTLE.w / 2, MAP.CASTLE.z + MAP.CASTLE.d / 2 + 2], go: () => world.travel ? world.travel(MAP.CASTLE.door[0], MAP.CASTLE.door[1] + 2, () => world.walkToBuilding('kasteel')) : world.walkToBuilding('kasteel') };
  }
  function openMap() {
    const world = getWorld(); if (!world || !document.getElementById('modal').hidden) return; sfx.pop();
    const el = document.createElement('div'); el.className = 'book kaart';
    el.innerHTML = `<div class="book-head"><h3>Kaart</h3><button class="x" data-close aria-label="Sluiten">✕</button></div><div class="kaart-map"></div>`;
    const box = el.querySelector('.kaart-map'), src = world.groundCanvas, M = world.M, S = 6;
    const cv = document.createElement('canvas'); cv.width = MAP.W * S; cv.height = MAP.OUT_H * S; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0, src.width, src.height * MAP.OUT_H / MAP.H, 0, 0, cv.width, cv.height);   // only the islands, not the rooms under the rock
    // the sea, and roofs so the map reads at a glance
    for (let tz = 0; tz < MAP.OUT_H; tz++) for (let tx = 0; tx < MAP.W; tx++) if (M.ground[M.I(tx, tz)] === MAP.SE) for (let py = 0; py < S; py += 2) for (let px = 0; px < S; px += 2) { x.fillStyle = ((tx * S + px >> 1) + (tz * S + py >> 1) * 3) % 11 === 0 ? '#BFEFFF' : '#5AB4E6'; x.fillRect(tx * S + px, tz * S + py, 2, 2); }
    const roof = (x0, z0, w, d, col) => { x.fillStyle = '#2B1E3A'; x.fillRect(x0 * S - 1, z0 * S - 1, w * S + 2, d * S + 2); x.fillStyle = col; x.fillRect(x0 * S, z0 * S, w * S, d * S); };
    const RC = { stal: '#7A4A3A', atelier: '#4A6FB8', bakkerij: '#D16A93', huisje: '#E8616B', kermis: '#E85D75' };
    for (const [id, h] of Object.entries(MAP.HOUSES)) { const [x0, z0, x1, z1] = MAP.houseRect(h); roof(x0, z0, x1 - x0 + 1, z1 - z0 + 1, RC[id]); }
    roof(MAP.CASTLE.x, MAP.CASTLE.z, MAP.CASTLE.w, MAP.CASTLE.d, '#B9B2CF');
    box.appendChild(cv);
    const at = (el2, tx, tz) => { const rm = tz >= MAP.ROCK_Z && MAP.roomAt(Math.floor(tx), Math.floor(tz)); if (rm) [tx, tz] = MAP.ROOMS[rm].out; el2.style.left = tx / MAP.W * 100 + '%'; el2.style.top = tz / MAP.OUT_H * 100 + '%'; box.appendChild(el2); };   // inside a room: shown at its door
    let close = null;
    const pin = (label, icon, tx, tz, go, say) => {
      const b = document.createElement('button'); b.className = 'kaart-pin'; b.setAttribute('aria-label', label); b.appendChild(fit(icon, 22)); const s = document.createElement('span'); s.textContent = label; b.appendChild(s);
      b.onclick = e => { e.stopPropagation(); sfx.pop(); close && close(); speak(say); go(); }; at(b, tx, tz);
    };
    const P = MAP.PLACES, IS = MAP.ISLES, walk = p => () => world.travel ? world.travel(p.tile[0], p.tile[1]) : world.walkToTile(p.tile[0], p.tile[1]);
    const PIN = { dorp: [ART.houseIcon('huisje'), 'Naar het dorp!', 0, 9], bos: [PX.pine(1), 'Naar het bos!', -12, -5], wei: [PX.flower(), 'Naar de bloemenwei!', -7, -7], strand: [ART.shell(0), 'Naar het strand!', 2, 3], eiland: [PX.rainbow(), 'Naar het regenboogeiland!', -5, 7], kasteel: [PX.crown(), 'Naar het kasteel!', -9, 5] };
    for (const [k, [icon, say, dx, dz]] of Object.entries(PIN)) pin(P[k].name, icon, IS[k].cx + dx, IS[k].cz + dz, walk(P[k]), say);
    // what still closes a bridge, so it is clear why you cannot get somewhere yet
    for (const g of world.tools.gates()) { const e = document.createElement('div'); e.className = 'kaart-gate'; e.appendChild(fit(ART.propArt(g.kind), 22)); at(e, g.x, g.z); }
    // the goal of this moment: tap it and she walks there (as far as she can get)
    const g = goal(world);
    if (g) { const e = document.createElement('button'); e.className = 'kaart-goal'; e.setAttribute('aria-label', 'Hierheen'); e.appendChild(fit(g.icon, 30)); if (g.text) e.insertAdjacentText('beforeend', g.text); e.onclick = ev => { ev.stopPropagation(); sfx.sparkle(); close && close(); g.go(); }; at(e, g.at[0], g.at[1]); }
    const me = document.createElement('div'); me.className = 'kaart-me'; me.appendChild(fit(PX[world.who()](), 30)); const [mx, mz] = world.pos(); at(me, mx, mz);
    close = ui.modal(el);
    speak('Dit is de kaart van Eenhoornland. ' + Q.goalText());
  }

  Q.on(type => { if (type === 'change') render(); });
  render();
  return { render, openMap, goToBed, syncWho };
}
