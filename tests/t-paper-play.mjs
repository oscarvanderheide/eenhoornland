// What she can play with (paper/toys.js and the sets): the swing, the slide, and more as it is built.
//   SERVE=8766 node cdp.mjs tests/t-paper-play.mjs      shots in tmp-shots/y-*.png      ONLY=swing runs one part
export default async function (t) {
  const port = process.env.SERVE || 8765, only = process.env.ONLY || '', fs = await import('node:fs'); fs.mkdirSync('tmp-shots', { recursive: true });
  const ok = (c, m) => console.log((c ? 'ok   ' : 'FAIL ') + m);
  const open = async (q, m) => { await t.send('Emulation.setDeviceMetricsOverride', m); await t.go(`http://127.0.0.1:${port}/paper/${q}`); for (let i = 0; i < 20 && !(await t.ev('!!window.__p')); i++) await t.sleep(500); };
  const DESK = { width: 1200, height: 750, deviceScaleFactor: 1, mobile: false }, LAND = { width: 750, height: 313, deviceScaleFactor: 2, mobile: true };
  const until = async (expr, secs) => { for (let i = 0; i < secs * 20; i++) { if (await t.ev(expr)) return true; await t.sleep(50); } return false; };
  const mouse = (type, x, y) => t.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1, pointerType: 'mouse' });
  const tapOn = async name => { const [x, y] = await t.ev(`__p.screen('${name}')`); await t.click(x, y); };

  if (!only || only === 'swing') {
    await open('?set=dorp', LAND); await t.sleep(1200);
    await t.ev('__p.placeAt(-5.6, 2.4)'); await t.sleep(2600);
    // getting on: a real tap on the swing
    await tapOn('swing'); ok(await until(`__p.toy('swing').on && __p.toy('swing').mode === 'swing'`, 6), 'a tap on the swing: she walks over and hops onto the seat');
    const i0 = await t.ev('__p.info()'); ok(i0.pose === 'sit' && i0.lift > .3, `she sits on the seat (${i0.lift.toFixed(2)} above the sand)`);
    await t.sleep(1500); const cam0 = await t.ev('__p.cam()');
    // the rule of the swing. A finger held still to her right for six seconds: she hardly swings
    const [hx, hy] = await t.ev(`__p.screen('girl')`);
    await mouse('mousePressed', hx + 150, hy); let top = 0; for (let i = 0; i < 60; i++) { await t.sleep(100); top = Math.max(top, Math.abs((await t.ev(`__p.toy('swing')`)).th)); } await mouse('mouseReleased', hx + 150, hy);
    ok(top < .55, `a finger held to one side for six seconds hardly swings her (highest ${top.toFixed(2)} of 1.25)`);
    // pushing in time, the way she is going: higher and higher
    await t.ev(`window.__push = setInterval(() => { const s = __p.toy('swing'); __p.keys(!s.on ? [] : s.om > .12 ? ['d'] : s.om < -.12 ? ['a'] : s.th <= 0 ? ['d'] : ['a']); }, 25)`);
    let high = 0; for (let i = 0; i < 70; i++) { await t.sleep(100); high = Math.max(high, Math.abs((await t.ev(`__p.toy('swing')`)).th)); if (i === 45) await t.shot('tmp-shots/y-swing-land.png'); }
    ok(high > 1.0, `pushing in time takes her high (highest ${high.toFixed(2)})`);
    const cam1 = await t.ev('__p.cam()'); ok(Math.hypot(cam1.look[0] - cam0.look[0], cam1.look[2] - cam0.look[2]) < .25, 'the camera holds still while she swings');
    // letting go at the top of a good swing: a real tap on her. She flies, and lands where she can walk on
    const fling = async (dir, what) => {
      ok(await until(`(() => { const s = __p.toy('swing'); return s.on && s.om * ${dir} > 2.1 && Math.abs(s.th) < .5; })()`, 10), `(${what}: a fast swing through the bottom)`);
      const [x, y] = await t.ev(`__p.screen('girl')`); await t.click(x, y); await t.sleep(120); const up = await t.ev('__p.info()');
      ok(await until(`!__p.toy('swing').on`, 5), `${what}: a tap on her and she lets go`); await t.sleep(500);
      const at = await t.ev('__p.info()'); const reach = await t.ev(`__p.canReach(${at.girl[0]}, ${at.girl[1]})`);
      const wet = (await t.ev(`__p.toy('swing')`)).splashes;
      ok((Math.abs(at.girl[0] + 6.7) > 2.5 || wet) && (at.girl[0] + 6.7) * dir > 0 && at.h !== null && at.lift === 0 && reach, `${what}: she ${wet ? 'flew into the pond with a splash, hopped out and stands' : 'flew'} ${Math.abs(at.girl[0] + 6.7).toFixed(1)} steps away, on floor she can walk on from (${at.girl.map(v => v.toFixed(1))}); in the air she was ${up.lift.toFixed(1)} up`);
    };
    await fling(1, 'to the right'); await t.ev('clearInterval(__push); __p.keys([])');
    await t.sleep(600); await t.ev(`__p.walkTo(-2.2, 1.9)`); await t.sleep(1200); const w = await t.ev('__p.info()'); ok(w.pose === null && w.lift === 0, 'afterwards she walks as always');
    // and to the left, towards the pond
    await t.ev('__p.placeAt(-6.7, .9)'); await t.sleep(500); await tapOn('swing'); await until(`__p.toy('swing').mode === 'swing'`, 5);
    await t.ev(`window.__push = setInterval(() => { const s = __p.toy('swing'); __p.keys(!s.on ? [] : s.om > .12 ? ['d'] : s.om < -.12 ? ['a'] : s.th <= 0 ? ['d'] : ['a']); }, 25)`); await t.sleep(5500);
    await fling(-1, 'to the left'); await t.ev('clearInterval(__push); __p.keys([])');
    // too gentle: a hop down in front
    await t.ev('__p.placeAt(-6.7, .9)'); await t.sleep(500); await tapOn('swing'); await until(`__p.toy('swing').mode === 'swing'`, 5); await t.sleep(400);
    await t.ev(`__p.keys([' '])`); await t.send('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space' }); await t.send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space' }); await t.ev('__p.keys([])');
    ok(await until(`!__p.toy('swing').on`, 3), 'the jump key lets go too'); await t.sleep(400); const g2 = await t.ev('__p.info()'); ok(Math.abs(g2.girl[0] + 6.7) < .4 && g2.girl[1] > .1, `from a still swing she hops down in front of it (${g2.girl.map(v => v.toFixed(1))})`);
  }

  if (!only || only === 'slide') {
    await open('?set=dorp', LAND); await t.sleep(1200);
    await t.ev('__p.placeAt(-6.6, 2.2)'); await t.sleep(2600);
    await tapOn('slide'); ok(await until(`__p.toy('slide').on`, 6), 'a tap on the slide: she walks to the ladder and climbs');
    ok(await until(`__p.toy('slide').mode === 'whoosh'`, 4), 'at the top she sits, then whoosh'); await t.sleep(250); await t.shot('tmp-shots/y-slide-land.png');
    ok(await until(`!__p.toy('slide').on`, 4), 'and she hops off the end'); await t.sleep(500);
    const s = await t.ev('__p.info()'); ok(s.girl[0] > -3 && s.h !== null && s.lift === 0 && s.pose === null && await t.ev(`__p.canReach(${s.girl[0]}, ${s.girl[1]})`), `she stands at the far end of the slide, on floor she can walk on from (${s.girl.map(v => v.toFixed(1))})`);
    await open('?set=dorp', DESK); await t.sleep(1200); await t.ev('__p.placeAt(-5.6, 2.4)'); await t.sleep(3000); await t.shot('tmp-shots/y-playground-desk.png');
  }
}
