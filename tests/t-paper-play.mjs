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
    // too gentle: a hop down in front (once the empty swing hangs still again)
    await t.ev('__p.placeAt(-6.7, .9)'); await until(`Math.abs(__p.toy('swing').th) < .04 && Math.abs(__p.toy('swing').om) < .08`, 8); await tapOn('swing'); await until(`__p.toy('swing').mode === 'swing'`, 5); await t.sleep(400);
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

  if (!only || only === 'house') {
    await open('?set=dorp', LAND); await t.sleep(2400);
    const r = await t.ev('__p.reach()'); ok(r.places['huis bed'] && r.places['huis middle'], 'from her doorstep the room inside is somewhere she can walk to, through the door');
    // walking into the front door with the stick held up
    await t.shot('tmp-shots/y-door-land.png'); await t.ev(`__p.keys(['w'])`);
    ok(await until(`__p.info().set === 'huis'`, 4), 'walking into her front door, she is inside'); await t.ev('__p.keys([])'); await t.sleep(1300);
    const i1 = await t.ev('__p.info()'), s1 = await t.ev('__p.stats()');
    ok(i1.h === 0 && await t.ev('__p.uniOk()') && s1.calls < 45 && (await t.ev('__p.shots()')).on === 'kamer', `she stands in the room, the unicorn came along, and nothing of the world outside is drawn (${s1.calls} draws)`); await t.shot('tmp-shots/y-room-land.png');
    await t.sleep(900); ok((await t.ev('__p.info()')).set === 'huis', 'the door does not take her straight back');
    // the bed: a real tap. She hops on, and shuts her eyes after a moment; a push and she is up
    await tapOn('bed'); ok(await until(`__p.info().pose === 'sit' && __p.info().lift > .4`, 5), 'a tap on a bed: she walks over and hops on'); await t.sleep(1900);
    ok((await t.ev('__p.doll()')).eyes === 'shut', 'after a moment her eyes are shut'); await t.shot('tmp-shots/y-bed-land.png');
    await t.ev(`__p.keys(['d'])`); await t.sleep(150); await t.ev('__p.keys([])'); ok(await until(`__p.info().lift === 0 && __p.info().pose === null`, 3), 'a push on the stick and she is up again'); await t.sleep(400);
    // the lamp
    const l0 = (await t.ev('__p.info()')).lit; await tapOn('lamp'); await t.sleep(300); ok((await t.ev('__p.info()')).lit === !l0, 'a tap on the lamp puts it out (and on again)'); await tapOn('lamp'); await t.sleep(300);
    // out again, over the doormat
    await t.ev(`__p.keys(['s'])`); ok(await until(`__p.info().set === 'dorp'`, 4), 'walking down over the doormat, she is outside again'); await t.ev('__p.keys([])'); await t.sleep(900);
    const o = await t.ev('__p.info()'); ok(Math.abs(o.girl[0] - .3) < .5 && o.girl[1] > -4.3 && o.girl[1] < -3.2 && Math.abs(o.h - .48) < .01 && o.set === 'dorp', `on her own doorstep (${o.girl.map(v => v.toFixed(1))}), and she stays there`);
    // a tap on the house sends her in as well
    await t.ev('__p.placeAt(1.6, -3.3)'); await t.sleep(800); await tapOn('door'); ok(await until(`__p.info().set === 'huis'`, 5), 'a tap on the house: she walks to the door and in');
    // walking along the front of the house does not take her in
    await t.ev('__p.placeAt(-1.2, -4.35)'); await t.sleep(600); await t.ev(`__p.keys(['d'])`); await t.sleep(1300); await t.ev('__p.keys([])'); await t.sleep(400);
    const past = await t.ev('__p.info()'); ok(past.set === 'dorp' && past.girl[0] > .9, `walking past the door along the wall, she stays outside (${past.girl.map(v => v.toFixed(1))})`);
    // from the forest the door still leads somewhere
    await open('?set=bos', DESK); await t.sleep(1500); const rb = await t.ev('__p.reach()'); ok(rb.places['huis bed'], 'starting in the forest, the room is still there behind the door');
    await open('?set=huis', DESK); await t.sleep(2500); await t.shot('tmp-shots/y-room-desk.png'); await t.ev('__p.evening(true)'); await t.sleep(1500); await t.shot('tmp-shots/y-room-eve-desk.png');
  }

  if (!only || only === 'dog') {
    await open('?set=dorp', LAND); await t.sleep(1500);
    const dogAt = async () => (await t.ev(`__p.toy('dog')`)), far = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    const d0 = await dogAt(); ok(d0.mode === 'wait' && d0.frame === 3, 'the dog sits on the square and waits: it does not come to her');
    await t.ev('__p.placeAt(.4, 1.6)'); await t.sleep(1200); ok((await dogAt()).frame === 0, 'when she comes close it gets up and looks at her'); await t.shot('tmp-shots/y-dog-land.png');
    // hello: a real tap on the dog
    await tapOn('hond'); await t.sleep(200); ok((await dogAt()).mode === 'follow' && await t.ev(`__p.hop('hond')`) > 0, 'a tap: it hops, and from now on it comes along');
    // it comes along, and sits down when she stands still
    await t.ev('__p.walkTo(-2.2, 3.6)'); await t.sleep(3800); const g1 = await t.ev('__p.info()'), d1 = await dogAt();
    ok(far(d1.at, g1.girl) < 2.3, `she walked off and the dog is with her (${far(d1.at, g1.girl).toFixed(1)} steps away)`);
    await t.sleep(2200); ok((await dogAt()).frame === 3, 'she stands still: the dog sits down');
    await tapOn('hond'); await t.sleep(350); ok((await dogAt()).frame === 4, 'a tap on her friend: belly up'); await t.shot('tmp-shots/y-dog-roll-land.png'); await t.sleep(1700);
    // the ball: a real tap on it. She walks up and kicks; it rolls; the dog brings it back
    await t.ev('__p.placeAt(-2.5, -.9)'); await t.sleep(2500);
    const b0 = (await t.ev(`__p.toy('ball')`)).at, [bx, by] = await t.ev(`__p.point(${b0[0]}, .2, ${b0[1]})`); await t.click(bx, by);
    ok(await until(`__p.toy('ball').kicks > 0`, 5), 'a tap on the ball: she walks up to it and kicks'); await t.sleep(700);
    const b1 = (await t.ev(`__p.toy('ball')`)).at; ok(far(b0, b1) > .8, `the ball rolls away (${far(b0, b1).toFixed(1)} steps so far)`);
    ok(await until(`__p.toy('dog').mode === 'fetch' || __p.toy('dog').mode === 'bring'`, 3), 'and the dog is off after it');
    ok(await until(`__p.toy('ball').held`, 8), 'it picks the ball up'); await t.shot('tmp-shots/y-dog-fetch-land.png');
    ok(await until(`__p.toy('dog').mode === 'follow'`, 9), 'and brings it back'); await t.sleep(600);
    const g2 = await t.ev('__p.info()'), b2 = await t.ev(`__p.toy('ball')`); ok(far(b2.at, g2.girl) < 1.5 && !b2.held, `the ball lies at her feet (${far(b2.at, g2.girl).toFixed(1)} steps away)`);
    // through her front door the dog comes too
    await t.ev('__p.placeAt(.3, -3.4)'); await t.sleep(1500); await t.ev(`__p.keys(['w'])`); await until(`__p.info().set === 'huis'`, 4); await t.ev('__p.keys([])'); await t.sleep(900);
    const g3 = await t.ev('__p.info()'), d3 = await dogAt(); ok(g3.set === 'huis' && far(d3.at, g3.girl) < 2, 'into the house the dog comes along'); await t.shot('tmp-shots/y-dog-room-land.png');
  }

  if (!only || only === 'animals') {
    await open('?set=dorp', LAND); await t.sleep(1500);
    const toy = n => t.ev(`__p.toy('${n}')`);
    // the hen: a tap, she sits, an egg lies there
    await t.ev('__p.placeAt(-4.6, 2.9)'); await t.sleep(2600); await tapOn('kip'); await t.sleep(500); ok((await toy('kip')).frame === 3, 'a real tap on the hen: she sits down');
    await t.sleep(1600); ok((await toy('kip')).eggs === 1, 'and leaves an egg'); await t.shot('tmp-shots/y-hen-land.png');
    await t.ev(`__p.tap('kuiken1')`); await t.sleep(120); ok(await t.ev(`__p.hop('kuiken1')`) > 0, 'a chick hops');
    // the pig
    await t.ev('__p.placeAt(-1.2, 9.2)'); await t.sleep(2600); ok((await toy('varken')).frame === 3, 'the pig lies in its mud'); await tapOn('varken'); await t.sleep(400);
    ok((await toy('varken')).up, 'a real tap: up it gets'); await t.shot('tmp-shots/y-pig-land.png'); await t.sleep(2600); ok((await toy('varken')).frame === 3, 'and lies down again');
    // the ducks
    await t.ev('__p.placeAt(-8.3, 1.9)'); await t.sleep(2600); const dk = (await toy('eend1')).at; await tapOn('eend1'); await t.sleep(300); ok((await toy('eend1')).dive, 'a real tap on a duck: tail up'); await t.shot('tmp-shots/y-ducks-land.png');
    await t.sleep(2600); const dk2 = (await toy('eend1')).at; ok(Math.hypot(dk[0] - dk2[0], dk[1] - dk2[1]) > .3, 'and it swims on to another spot');
    // the forest: hedgehog, owl, squirrel
    const bp = await t.ev(`__p.places('bos')`);
    await t.ev(`__p.placeAt(${bp.nook[0] + 2.6}, ${bp.nook[1] + .4})`); await t.sleep(2600); ok((await toy('egel')).frame === 0, 'from a little way off the hedgehog is just a hedgehog'); 
    await t.ev(`__p.placeAt(${bp.nook[0] + 1.2}, ${bp.nook[1] + .4})`); await t.sleep(700); ok((await toy('egel')).frame === 3, 'she comes close: it curls up'); await t.shot('tmp-shots/y-hedgehog-land.png');
    const e0 = (await toy('egel')).at; await tapOn('egel'); await t.sleep(1300); const e1 = (await toy('egel')).at; ok(Math.abs(e1[0] - e0[0]) > .5, 'a real tap: the ball rolls away a little'); await t.sleep(600); ok((await toy('egel')).frame === 0, 'and it peeps out again');
    await t.ev(`__p.placeAt(${bp.grot[0]}, ${bp.grot[1]})`); await t.sleep(3000); ok((await toy('uil')).frame === 1, 'the owl sleeps on her ledge'); await tapOn('uil'); await t.sleep(300); ok((await toy('uil')).frame === 2, 'a real tap: she spreads her wings and hoots'); await t.shot('tmp-shots/y-owl-land.png');
    await t.sleep(3400); ok((await toy('uil')).frame === 1, 'and sleeps again'); await t.ev('__p.evening(true)'); await t.sleep(400); ok((await toy('uil')).frame === 0, 'in the evening she is awake'); await t.ev('__p.evening(false)');
    await t.ev(`__p.placeAt(${bp.oak[0] - 2.6}, ${bp.oak[1] + .6})`); await t.sleep(3000); await tapOn('eekhoorn'); await t.sleep(800); ok((await toy('eekhoorn')).lift > 1.5, 'a real tap on the squirrel: up the oak it runs'); await t.shot('tmp-shots/y-squirrel-land.png');
    await t.sleep(1300); ok((await toy('eekhoorn')).frame === 3 && (await toy('eekhoorn')).lift === 0, 'and comes down with an acorn');
  }

  if (!only || only === 'farm') {
    await open('?set=dorp', LAND); await t.sleep(1500);
    const farm = () => t.ev(`__p.toy('boerderij')`), pl = await t.ev('__p.places()'), tapAt = async (x, y, z) => { const [sx, sy] = await t.ev(`__p.point(${x}, ${y}, ${z})`); await t.click(sx, sy); };
    await t.ev(`__p.placeAt(${pl.well[0] - 1.6}, ${pl.well[1] + 2.4})`); await t.sleep(2800); await t.shot('tmp-shots/y-farm-land.png');
    // a row without a can: nothing happens but a hint
    await tapAt(pl.rows[0], .1, pl.rows[1] - .5); await t.sleep(600); ok((await farm()).watered === 0, 'a tap on a row with empty hands waters nothing');
    // the can: a real tap
    const c0 = (await farm()).can; await tapAt(c0[0], .15, c0[1]); ok(await until(`__p.toy('boerderij').held`, 5), 'a tap on the watering can: she walks over and picks it up'); await t.sleep(300);
    ok((await t.ev('__p.info()')).pose === 'hold', 'she carries it in front of her');
    // the well fills it
    await tapAt(pl.well[0], .5, pl.well[1] - 1.0); ok(await until(`__p.toy('boerderij').full === 2`, 7), 'a tap on the well: the bucket goes down and the can is full'); await t.shot('tmp-shots/y-farm-well-land.png');
    // water a row: it grows in two steps
    await tapAt(pl.rows[0], .1, pl.rows[1] - .5); ok(await until(`__p.toy('boerderij').watered === 1`, 8), 'a tap on a row: she walks over and pours');
    ok(await until(`__p.toy('boerderij').rows[0].stage === 2`, 5), 'and the carrots grow'); await t.shot('tmp-shots/y-farm-grown-land.png');
    ok((await farm()).full === 1, 'the can has water for one more row');
    // pull one: it flies to the pig
    const n0 = (await farm()).rows[0].left; await tapAt(pl.rows[0] - .95, .1, pl.rows[1] - .5); ok(await until(`__p.toy('boerderij').pulled === 1`, 6), 'a tap on grown carrots: she pulls one out');
    await t.sleep(1100); ok((await farm()).rows[0].left === n0 - 1 && await t.ev(`__p.hop('varken')`) >= 0, 'one carrot fewer in the row, and it went to the pig');
    // the scarecrow's birds
    await t.ev(`__p.placeAt(${pl.crow[0] + 4.5}, ${pl.crow[1] + 1.5})`); await t.sleep(4200); ok(!(await t.ev(`__p.toy('vogelverschrikker')`)).up, 'from a way off the birds sit on the scarecrow');
    await t.ev(`__p.placeAt(${pl.crow[0]}, ${pl.crow[1]})`); await t.sleep(1500); ok((await t.ev(`__p.toy('vogelverschrikker')`)).up, 'she comes close: up they fly'); await t.shot('tmp-shots/y-farm-crow-land.png');
  }
}
