// A game controller (a PS5 DualSense, an Xbox pad, anything the browser maps to the "standard" layout) plays the game
// through the same doors as the fingers and the keyboard, so every input keeps one rule per thing:
//   outside:  left stick = the on-screen joystick, d-pad = the arrow keys, ✕ = the action button (whatever it shows right
//             here; in the sky: land), ○ = the wing button, □ = the ride button, △ = the other sister, Options = the map
//   anywhere else (start screen, houses, the map, the stall, cutscenes, a coin): a hand shows up; the left stick or d-pad
//             moves it, ✕ taps where it points (hold ✕ and move to drag or paint), ○ closes the screen
// Browsers only show a controller to the page after a button on it is pressed, so the first press just wakes it up.

const B = { X: 0, O: 1, SQ: 2, TRI: 3, OPT: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };
const DPAD = { [B.UP]: 'ArrowUp', [B.DOWN]: 'ArrowDown', [B.LEFT]: 'ArrowLeft', [B.RIGHT]: 'ArrowRight' };
const DEAD = .2;

const $ = s => document.querySelector(s);
const shown = el => !!el && !el.hidden && el.offsetParent !== null;
/** a screen over the world: then the controller moves the hand instead of the girl */
function overlay() {
  return shown($('#start')) || shown($('#act')) || shown($('#modal')) || !!$('#dream') || !!$('#scene') || !!$('.reward');
}

export function initGamepad(getWorld) {
  let raf = 0, prev = [], stickOn = false, mode = '', fresh = true;
  const keysDown = new Set();
  // the hand: a pointer for every screen that is played by tapping
  const hand = document.createElement('div'); hand.id = 'pad-hand'; hand.hidden = true;
  hand.style.cssText = 'position:fixed;z-index:9999;left:0;top:0;width:34px;height:34px;margin:-6px 0 0 -6px;pointer-events:none;transition:transform .08s;filter:drop-shadow(0 2px 0 rgba(58,42,61,.6))';
  hand.innerHTML = '<svg viewBox="0 0 24 24" width="34" height="34"><path d="M5 2l14 10-6 1.2 3.6 7-2.8 1.4-3.6-7L5 19z" fill="#FFF8E6" stroke="#3A2A3D" stroke-width="2" stroke-linejoin="round"/></svg>';
  document.body.appendChild(hand);
  let hx = innerWidth / 2, hy = innerHeight / 2, held = null, lastT = performance.now();
  const placeHand = () => { hand.style.left = hx + 'px'; hand.style.top = hy + 'px'; };

  const pe = (type, target, extra = {}) => target && target.dispatchEvent(new PointerEvent(type, {
    bubbles: true, cancelable: true, composed: true, pointerId: 41, pointerType: 'mouse', isPrimary: true,
    clientX: hx, clientY: hy, button: type === 'pointermove' ? -1 : 0, buttons: held || type === 'pointerdown' ? 1 : 0, ...extra }));
  const under = () => document.elementFromPoint(hx, hy);
  function tapDown() {
    const t = under(); if (!t) return; held = t; hand.style.transform = 'scale(.85)';
    pe('pointerdown', t); t.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: hx, clientY: hy }));
  }
  function tapUp() {
    if (!held) return; const t = under() || held, down = held; held = null; hand.style.transform = '';
    pe('pointerup', t); t.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: hx, clientY: hy }));
    if (t === down || down.contains(t) || t.contains(down)) t.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: hx, clientY: hy, detail: 1 }));
  }
  /** ○ on a screen: whatever closes it (a coin, the map or the stall, a house); cutscenes are not skipped by accident */
  function back() {
    const c = $('.reward [data-close]') || (shown($('#modal')) && $('#modal [data-close]')) || (shown($('#act')) && $('#act-close'));
    if (c) c.click();
  }

  const key = (k, down) => {
    if (down === keysDown.has(k)) return; down ? keysDown.add(k) : keysDown.delete(k);
    document.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { key: k, bubbles: true, cancelable: true }));
  };
  const press = (sel, kind) => { const b = $(sel); if (!shown(b)) return false; kind === 'down' ? b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 41 })) : b.click(); return true; };

  function setMode(m) {
    if (m === mode) return; mode = m;
    if (m === 'hand') { hand.hidden = false; placeHand(); } else { hand.hidden = true; if (held) tapUp(); }
    if (stickOn) { const w = getWorld(); w && w.stick(0, 0); stickOn = false; }
  }

  function poll() {
    raf = requestAnimationFrame(poll);
    const now = performance.now(), dt = Math.min(.05, (now - lastT) / 1000); lastT = now;
    const pad = [...(navigator.getGamepads ? navigator.getGamepads() : [])].find(p => p && p.connected);
    if (!pad) return;
    const btn = i => !!(pad.buttons[i] && (pad.buttons[i].pressed || pad.buttons[i].value > .5));
    const hit = i => btn(i) && !prev[i];                   // pressed just now
    const cur = pad.buttons.map((_, i) => btn(i));
    if (fresh) { fresh = false; prev = cur; return; }      // the press that woke the controller up does nothing else
    let ax = pad.axes[0] || 0, ay = pad.axes[1] || 0; const l = Math.hypot(ax, ay);
    if (l < DEAD) { ax = 0; ay = 0; } else { const v = Math.min(1, (l - DEAD) / (1 - DEAD)); ax = ax / l * v; ay = ay / l * v; }

    if (overlay()) {
      setMode('hand');
      for (const i in DPAD) key(DPAD[i], cur[i]);         // a house game that listens to the arrows still gets them
      let mx = ax + (cur[B.RIGHT] ? 1 : 0) - (cur[B.LEFT] ? 1 : 0), my = ay + (cur[B.DOWN] ? 1 : 0) - (cur[B.UP] ? 1 : 0);
      const m = Math.hypot(mx, my);
      if (m) {
        const sp = 260 + 900 * Math.min(1, m) ** 2;           // slow near the middle of the stick to aim, fast at the rim
        hx = Math.max(0, Math.min(innerWidth - 1, hx + mx / Math.max(1, m) * sp * dt)); hy = Math.max(0, Math.min(innerHeight - 1, hy + my / Math.max(1, m) * sp * dt));
        placeHand(); if (held) pe('pointermove', held);
      }
      if (hit(B.X)) tapDown(); else if (!cur[B.X] && held) tapUp();
      if (hit(B.O)) back();
    } else {
      setMode('world');
      const w = getWorld();
      for (const i in DPAD) key(DPAD[i], cur[i]);         // the d-pad is the arrow keys (walk, steer the boat, fly)
      if (w && (ax || ay)) { w.stick(ax, ay); stickOn = true; } else if (stickOn) { w && w.stick(0, 0); stickOn = false; }
      if (hit(B.X)) { press('#b-jump', 'down') || press('#b-fly', 'down'); }   // up in the sky the wing button is the one that lands
      if (hit(B.O)) press('#b-fly', 'down');
      if (hit(B.SQ)) press('#b-ride');
      if (hit(B.TRI)) { const other = document.querySelector('#who .who:not(.on)'); other && other.click(); }
      if (hit(B.OPT)) press('#b-map');
    }
    prev = cur;
  }
  const start = () => { if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(poll); } };
  addEventListener('gamepadconnected', start);
  addEventListener('gamepaddisconnected', () => {
    if ([...(navigator.getGamepads ? navigator.getGamepads() : [])].some(p => p && p.connected)) return;
    cancelAnimationFrame(raf); raf = 0; fresh = true; setMode(''); for (const k of [...keysDown]) key(k, false); prev = [];
  });
  if ([...(navigator.getGamepads ? navigator.getGamepads() : [])].some(p => p && p.connected)) start();
}
