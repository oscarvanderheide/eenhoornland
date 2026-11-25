// node cdp.mjs tests/t-gamepad.mjs — a game controller (faked: navigator.getGamepads) plays the game (tmp-shots/g-*.png)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const until = async (expr, ms = 3000) => { for (let i = 0; i < ms / 100; i++) { if (await t.ev(expr)) return true; await t.sleep(100); } return false; };
  const PORT = 'http://127.0.0.1:8765/dev.html';
  // a pad with the standard layout: ✕ 0, ○ 1, □ 2, △ 3, Options 9, d-pad 12-15
  const fake = `(() => { window.__pad = { connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
    navigator.getGamepads = () => [window.__pad]; dispatchEvent(new Event('gamepadconnected')); return true; })()`;
  const btn = async (i, ms = 250) => { await t.ev(`__pad.buttons[${i}].pressed = true`); await t.sleep(ms); await t.ev(`__pad.buttons[${i}].pressed = false`); await t.sleep(120); };
  const axes = (x, y) => t.ev(`__pad.axes[0] = ${x}; __pad.axes[1] = ${y}`);

  // the start screen: a hand shows up, the stick moves it to Anna, ✕ picks her
  await t.go(PORT + '?debug'); await t.ev('localStorage.clear()'); await t.go(PORT + '?debug'); await t.sleep(1500);
  await t.ev(fake); await t.sleep(200);
  await btn(0);                                            // the press that wakes the controller up
  ok(await t.ev(`!document.querySelector('#start').classList.contains('busy')`), 'the first press only wakes the controller up');
  ok(await t.ev(`!document.getElementById('pad-hand').hidden`), 'on the start screen a hand shows up');
  const pick = await J(`(() => { const r = document.querySelector('#start .pick[data-who="anna"]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
  for (let k = 0; k < 60; k++) {
    const h = await J(`(e => [parseFloat(e.style.left), parseFloat(e.style.top)])(document.getElementById('pad-hand'))`);
    const dx = pick[0] - h[0], dy = pick[1] - h[1], l = Math.hypot(dx, dy); if (l < 12) break;
    await axes(dx / l * (l > 80 ? 1 : .4), dy / l * (l > 80 ? 1 : .4)); await t.sleep(60);
  }
  await axes(0, 0); await t.shot('tmp-shots/g-1-start.png');
  const over = await t.ev(`(h => { const e = document.elementFromPoint(parseFloat(h.style.left), parseFloat(h.style.top)); return !!(e && e.closest('.pick[data-who="anna"]')); })(document.getElementById('pad-hand'))`);
  ok(over, 'the stick moves the hand onto Anna');
  await btn(0);
  ok(await until(`document.querySelector('#start').classList.contains('busy')`), '✕ taps where the hand points: Anna is picked');

  // outside: the stick and the d-pad walk, ✕ is the action button, △ the other sister, Options the map, ○ closes it
  await t.go(PORT + '?go&debug'); await t.ev('localStorage.clear()'); await t.go(PORT + '?go&debug'); await t.sleep(1500);
  await t.ev(fake); await t.sleep(200); await btn(0);
  ok(await t.ev(`document.getElementById('pad-hand').hidden`), 'outside there is no hand');
  await t.ev(`__w.placeAt(30.5, 46.5)`); await t.sleep(800);
  let p0 = await J('__w.info().pos'); await axes(1, 0); await t.sleep(900); await axes(0, 0); await t.sleep(300);
  let p1 = await J('__w.info().pos'); ok(p1[0] > p0[0] + .5, 'the left stick walks her: ' + p0 + ' -> ' + p1);
  await t.sleep(600); p0 = await J('__w.info().pos'); await t.sleep(400); p1 = await J('__w.info().pos');
  ok(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < .05, 'let go of the stick and she stops');
  await t.ev(`__w.placeAt(30.5, 44.5)`); await t.sleep(800);
  p0 = await J('__w.info().pos'); await t.ev('__pad.buttons[13].pressed = true'); await t.sleep(800); await t.ev('__pad.buttons[13].pressed = false'); await t.sleep(300);
  p1 = await J('__w.info().pos'); ok(p1[1] > p0[1] + .5, 'the d-pad walks her too: ' + p0 + ' -> ' + p1);
  // ✕ next to an animal: the action button's pick-up
  await t.ev(`(a => { a.pos.set(32.5, 0, 46.5); a.path = []; a.wait = 30; a.wayAt = performance.now(); __w.placeAt(31.7, 46.5); window.__a = a; })(__w.animals.find(a => a.g.visible && !a.water && !a.uniKind && !a.way))`);
  await t.sleep(700);
  const act = await t.ev('__w.action().key'); await btn(0);
  ok(await until(`__w.life.carrying() === __a`), '✕ does what the action button shows (' + act + '): she lifts the animal'); await t.sleep(500); await t.shot('tmp-shots/g-2-lift.png');
  await btn(0); await t.sleep(800); ok(await t.ev(`__w.life.carrying() !== __a`), '✕ again throws it');
  const who0 = await t.ev('__w.who()'); await btn(3); ok(await until(`__w.who() !== '${who0}'`), '△ switches to the other sister');
  await btn(9); const mapOk = await until(`!document.getElementById('modal').hidden`); ok(mapOk, 'Options opens the map');
  if (!mapOk) console.log('  state', await t.ev(`JSON.stringify({ hand: !document.getElementById('pad-hand').hidden, act: !document.getElementById('act').hidden, dream: !!document.getElementById('dream'), scene: !!document.getElementById('scene'), reward: !!document.querySelector('.reward'), map: !!document.getElementById('b-map').offsetParent, busy: __w.busy() })`)); await t.sleep(400);
  ok(await t.ev(`!document.getElementById('pad-hand').hidden`), 'on the map the hand shows up'); await t.shot('tmp-shots/g-3-map.png');
  await btn(1); ok(await until(`document.getElementById('modal').hidden`), '○ closes the map');
  ok(await until(`document.getElementById('pad-hand').hidden`), 'and the hand goes away again');
  // riding: □ gets on, ○ is the wing button
  await t.ev(`__w.Q._reset({ stage: 'vriend' }); __w.placeAt(30.5, 46.5)`); await t.sleep(1200);
  await btn(2); ok(await until(`!!__w.mount()`), '□ gets her on her unicorn'); await t.sleep(600);
  if (await t.ev(`!document.getElementById('b-fly').hidden`)) {
    await btn(1); ok(await until(`!!__w.fly.info() && !document.getElementById('b-jump').offsetParent`, 4000), '○ takes off'); await t.sleep(1500); await t.shot('tmp-shots/g-4-fly.png');
    await btn(0); ok(await until(`!!document.getElementById('b-jump').offsetParent`, 8000), 'up in the sky ✕ lands');
  } else console.log('  (no wing button in this stage; flying not checked)');
  await btn(2); ok(await until(`!__w.mount()`), '□ again gets her off');
  await t.ev(`delete navigator.getGamepads; window.__pad.connected = false; dispatchEvent(new Event('gamepaddisconnected'))`);
  console.log(fail ? `GAMEPAD: ${fail} FAIL` : 'GAMEPAD ALL OK');
}
