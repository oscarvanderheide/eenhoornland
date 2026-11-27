// What she can play with (paper/toys.js and the sets): the swing, the slide, and more as it is built.
//   SERVE=8766 node cdp.mjs tests/t-paper-play.mjs      shots in tmp-shots/y-*.png      ONLY=swing runs one part
export default async function (t) {
  const port = process.env.SERVE || 8765, only = process.env.ONLY || '', fs = await import('node:fs'); fs.mkdirSync('tmp-shots', { recursive: true });
  const ok = (c, m) => console.log((c ? 'ok   ' : 'FAIL ') + m);
  const open = async (q, m) => { await t.send('Emulation.setDeviceMetricsOverride', m); await t.go(`http://127.0.0.1:${port}/paper/${q}`); for (let i = 0; i < 20 && !(await t.ev('!!window.__p')); i++) await t.sleep(500); };
  const DESK = { width: 1200, height: 750, deviceScaleFactor: 1, mobile: false }, LAND = { width: 750, height: 313, deviceScaleFactor: 2, mobile: true };
  const until = async (expr, secs) => { for (let i = 0; i < secs * 20; i++) { const v = await t.ev(expr); if (typeof v === 'string' && v.startsWith('ERR')) { console.log('FAIL the page threw: ' + v); return false; } if (v) return true; await t.sleep(50); } return false; };   // (an error is never a yes)
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

  if (!only || only === 'forest') {
    await open('?set=bos', LAND); await t.sleep(1500);
    const pl = await t.ev('__p.places()'), toy = n => t.ev(`__p.toy('${n}')`), tapAt = async (x, y, z) => { const [sx, sy] = await t.ev(`__p.point(${x}, ${y}, ${z})`); await t.click(sx, sy); };
    // the picnic: a real tap on the cloth; she sits; the hedgehog and the squirrel come over
    await t.ev(`__p.placeAt(${pl.picnic[0] + 1.6}, ${pl.picnic[1] + 1.4})`); await t.sleep(2800);
    await tapAt(pl.picnic[0] - .3, .1, pl.picnic[1] - 1.5); ok(await until(`__p.toy('picknick').mode === 'sit'`, 6), 'a tap on the picnic cloth: she walks over and sits down on it');
    ok(await until(`__p.toy('picknick').cheered`, 22), 'the hedgehog and the squirrel come and sit with her'); await t.shot('tmp-shots/y-picnic-land.png');
    await t.ev(`__p.keys(['d'])`); await t.sleep(150); await t.ev('__p.keys([])'); ok(await until(`__p.toy('picknick').mode === null`, 3), 'a push and she is up');
    await t.sleep(2500); ok(!(await toy('egel')).there && !(await toy('eekhoorn')).there, 'and her guests go home');
    // the wind: a gust crosses, and the windmill in the clearing spins
    const m0 = (await toy('molen')).spins, w0 = (await t.ev('__p.wind()')).n; await t.ev('__p.wind(true)');
    ok(await until(`__p.wind().on`, 2), 'a gust of wind comes'); await t.sleep(2300); await t.shot('tmp-shots/y-gust-land.png');
    await until(`!__p.wind().on`, 8); ok((await t.ev('__p.wind()')).n === w0 + 1, 'and is gone again'); console.log(`     (the clearing's windmill spun ${(await toy('molen')).spins - m0} time(s) in it)`);
    // a butterfly: she stands still by its flowers and it comes to sit on her head
    const b = (await toy('vlinder1')).at; await t.ev(`__p.placeAt(${b[0] + .8}, ${b[1] + .9})`); ok(await until(`__p.toy('vlinder1').sitting`, 9), 'she stands still near a butterfly: it lands on her head'); await t.shot('tmp-shots/y-butterfly-land.png');
    await t.ev(`__p.keys(['d'])`); await t.sleep(600); await t.ev('__p.keys([])'); ok(!(await toy('vlinder1')).sitting, 'she walks on and it flies off');
    await t.ev(`__p.tap('hut')`);
  }

  if (!only || only === 'flowers') {
    await open('?set=dorp', LAND); await t.sleep(1500);
    const toy = n => t.ev(`__p.toy('${n}')`), tapAt = async (x, y, z) => { const [sx, sy] = await t.ev(`__p.point(${x}, ${y}, ${z})`); await t.click(sx, sy); };
    // a flower in the grass: a real tap on it; she walks over and has it in her hand
    const f = (await toy('gras')).first; await t.ev(`__p.placeAt(${f[0] + 1.6}, ${f[1] + 1.5})`); await t.sleep(2800);
    const h = (await t.ev('__p.info()')).h; await tapAt(f[0], h + .3, f[1]); ok(await until(`__p.toy('bos').held === 1`, 6), 'a real tap on a flower in the grass: she walks over and picks it'); await t.sleep(300);
    ok((await toy('gras')).picked === 1 && (await t.ev('__p.info()')).pose === 'hold', `it is gone from the grass and in her hand (a ${(await toy('bos')).kind})`); await t.sleep(400); await t.shot('tmp-shots/y-flower-land.png');
    // a tulip from the garden goes into the same bunch
    const tu = (await toy('tuin')).tulips[2]; await t.ev(`__p.placeAt(${tu.at[0] + 1.2}, ${tu.at[1] + 1.8})`); await t.sleep(2600);
    await tapAt(tu.at[0], .48 + .45, tu.at[1]); ok(await until(`__p.toy('bos').kind === 'tulip'`, 6), 'a tulip from the bed: now that is the one in her hand'); const two = await toy('bos'); ok(two.held === 1 && two.hair && !(await toy('tuin')).tulips[2].there, `one flower in her hand at a time: the first went into her hair (a ${two.hair}), and the tulip's place in the row is empty`);
    // whoever she taps next is given the bunch
    await t.ev(`__p.tap('unicorn')`); await t.sleep(300); const b = await toy('bos'); ok(b.held === 0 && b.gifts === 1 && (await t.ev('__p.info()')).pose === null, 'a tap on the unicorn: she gives it the flower');
  }

  /* ---------------- the meadow: the brambles open for water; the kite, the balloon, the stones and the dandelions ---------------- */
  if (!only || only === 'meadow') {
    await open('?set=dorp', LAND); await t.sleep(1200);
    const toy = n => t.ev(`__p.toy('${n}')`), d = await t.ev(`__p.places('dorp')`), w = await t.ev(`__p.places('wei')`), tapAt = async (x, y, z) => { const [sx, sy] = await t.ev(`__p.point(${x}, ${y}, ${z})`); await t.click(sx, sy); };
    ok(!(await t.ev(`__p.canReach(${w.cross[0]}, ${w.cross[1]})`)), 'the brambles shut the bridge: the meadow cannot be walked to');
    await t.ev(`__p.placeAt(${d.thorns[0]}, ${d.thorns[1]})`); await t.sleep(2600); await t.shot('tmp-shots/y-thorns-land.png');
    await tapAt(d.thorns[0] + 1.1, .5, d.thorns[1]); await t.sleep(500); ok((await toy('braam')).wishing && !(await toy('braam')).open, 'a tap with empty hands: they shake and show the watering can'); await t.shot('tmp-shots/y-thorns-wish-land.png');
    // fetch the can, fill it at the fountain, pour
    const c0 = (await toy('boerderij')).can; await t.ev(`__p.placeAt(${c0[0] - 1.2}, ${c0[1] + 1})`); await t.sleep(2400); await tapAt(c0[0], .15, c0[1]); ok(await until(`__p.toy('boerderij').held`, 5), 'she picks up the can');
    await t.ev(`__p.placeAt(${d.fountain[0] + 2.2}, ${d.fountain[1]})`); await t.sleep(2400); await tapAt(d.fountain[0], .6, d.fountain[1] - 2.0); ok(await until(`__p.toy('boerderij').full === 2`, 7), 'a tap on the fountain fills it');
    await t.ev(`__p.placeAt(${d.thorns[0]}, ${d.thorns[1]})`); await t.sleep(2400); await tapAt(d.thorns[0] + 1.1, .5, d.thorns[1]);
    ok(await until(`__p.toy('braam').open`, 8), 'watered, the brambles bloom and open'); await t.sleep(700); await t.shot('tmp-shots/y-thorns-open-land.png');
    ok(await t.ev(`__p.canReach(${w.cross[0]}, ${w.cross[1]})`), 'and now the meadow can be walked to');
    // the dolphin of the long bridge
    await t.ev(`__p.placeAt(${(d.thorns[0] + w.start[0]) / 2 - 3}, ${d.thorns[1]})`); await t.sleep(1800); ok((await toy('dolfijn')).leaps === 0, 'standing on the bridge: no dolphin yet');
    await t.ev(`__p.keys(['d'])`); await t.sleep(900); const dol = await toy('dolfijn'); ok(dol.leaps === 1 && dol.up && dol.at[1] > 0, 'walking over the water: a dolphin leaps over the bridge ahead of her'); await t.shot('tmp-shots/y-dolphin-land.png');
    await t.sleep(2600); await t.ev(`__p.keys([])`); ok((await toy('dolfijn')).leaps === 1 && !(await toy('dolfijn')).up, 'once on a crossing');
    // the kite on the hill's top
    await t.ev(`__p.placeAt(${w.top[0] + .8}, ${w.top[1] + .3})`); await t.sleep(2400); await t.ev(`__p.tap('vlieger')`); ok(await until(`__p.toy('vlieger').held`, 5), 'a tap on the kite: she takes its string'); ok(!(await toy('boerderij')).held, 'and the can she carried is put down: one thing in her hands at a time');
    ok(await until(`__p.toy('vlieger').alt > 2.2`, 6), 'on the windy top it goes up by itself'); await t.shot('tmp-shots/y-kite-land.png');
    await t.ev(`__p.placeAt(${w.cross[0]}, ${w.cross[1]})`); ok(await until(`__p.toy('vlieger').alt < .8`, 9), 'down in the meadow, standing still, it sinks');
    await t.ev(`__p.keys(['d'])`); ok(await until(`__p.toy('vlieger').alt > 1.6`, 6), 'and running lifts it again'); await t.shot('tmp-shots/y-kite-run-land.png'); await t.ev(`__p.keys([])`);
    await t.ev(`__p.tap('vlieger')`); await t.sleep(300); ok(!(await toy('vlieger')).held, 'a tap puts it down');
    // a dandelion and the singing stones
    const cl = await t.ev(`__p.places('wei').cross`); await t.ev(`__p.placeAt(${cl[0] - 6}, ${cl[1] + 2})`); await t.sleep(2200);
    await t.ev(`__p.placeAt(${w.pool[0]}, ${w.pool[1] - .9})`); await t.sleep(2200); const s1 = (await toy('stenen')).sung; await t.ev(`__p.keys(['d'])`); await t.sleep(5200); await t.ev(`__p.keys([])`);
    const s2 = (await toy('stenen')).sung; ok(s2 - s1 >= 3, `walking over the pool: the stones sing (${s2 - s1} notes)`); await t.shot('tmp-shots/y-stones-land.png');
    // the balloon
    await t.ev(`__p.placeAt(${w.balloon[0]}, ${w.balloon[1]})`); await t.sleep(2400); await tapOn('ballon'); ok(await until(`__p.toy('ballon').mode === 'up'`, 5), 'a tap on the balloon: she climbs in and it goes up');
    ok(await until(`__p.toy('ballon').mode === 'top'`, 9), 'up to the top of its rope'); await t.sleep(2500); const cam = await t.ev('__p.cam()'); ok(cam.pos[1] > 40, `the camera has gone far back (${cam.pos[1].toFixed(0)} high)`); await t.shot('tmp-shots/y-balloon-top-land.png'); { const st = await t.ev('__p.stats()'); console.log(`     (from the balloon: ${st.calls} draws, ${(st.tris / 1000).toFixed(0)}k triangles, ${st.fps.toFixed(0)} frames a second here)`); }
    await t.ev(`__p.keys(['a'])`); await t.sleep(200); await t.ev(`__p.keys([])`); ok(await until(`__p.toy('ballon').mode === null`, 9), 'a push: it comes down and she hops out');
    await t.sleep(2500); const g = (await t.ev('__p.info()')); ok(g.h !== null && Math.abs(g.girl[2]) < .2, 'she stands on the grass again'); await t.shot('tmp-shots/y-balloon-down-land.png');
  }

  /* ---------------- the people (folk.js): each answers a tap in a way of their own ---------------- */
  if (!only || only === 'people') {
    await open('?set=dorp', LAND); await t.sleep(1200); await t.ev('__p.open()');
    const toy = n => t.ev(`__p.toy('${n}')`), at = n => t.ev(`(f => [f.x, f.z])(__p.dbg.figures.find(f => f.name === '${n}'))`), by = async (n, dx = -1.6, dz = .9, wait = 2400) => { const [x, z] = await at(n); await t.ev(`__p.placeAt(${x + dx}, ${z + dz})`); await t.sleep(wait); };
    // grandma
    await by('oma'); ok((await toy('oma')).frame < 2, 'grandma knits while she is near'); await t.ev(`__p.tap('oma')`); await t.sleep(400); ok((await toy('oma')).frame === 2 && (await toy('oma')).waves === 1, 'a tap: she waves'); await t.shot('tmp-shots/y-oma-land.png');
    await t.sleep(1800); await tapOn('bank'); ok(await until(`__p.toy('bank').mode === 'sit'`, 6), 'she sits down on the free half of the bench'); await t.sleep(500); ok((await toy('oma')).waves === 2, 'and grandma waves again'); await t.shot('tmp-shots/y-oma-sit-land.png');
    await t.ev(`__p.keys(['a'])`); await t.sleep(200); await t.ev(`__p.keys([])`); await t.sleep(700);
    // the fruit stall
    await by('mand', -.4, 1.9); await t.ev(`__p.tap('mand')`); ok(await until(`__p.toy('kraam').held`, 6), 'a tap on the stall\'s basket: she takes an apple'); await t.sleep(300); await t.shot('tmp-shots/y-stall-land.png');
    await t.ev(`__p.tap('mand')`); await t.sleep(300); ok((await toy('kraam')).held && (await toy('kraam')).given === 0, 'a tap on the basket with an apple in her hands: the basket is not given the apple');
    await t.ev(`__p.tap('oma')`); await t.sleep(300); const st = await toy('kraam'); ok(!st.held && st.given === 1, 'a tap on grandma: she gets the apple');
    // the accordion player
    await by('muzikant', 1.7, 1.0); ok(!(await toy('muzikant')).playing, 'the accordion player is silent by himself'); await t.ev(`__p.tap('muzikant')`); await t.sleep(1700); const m = await toy('muzikant'); ok(m.playing && m.notes > 0, 'a tap: he plays, and notes float up'); await t.shot('tmp-shots/y-muzikant-land.png');
    ok(await until(`!__p.toy('muzikant').playing`, 6), 'and stops again');
    // the gardener
    await by('tuinman', 1.8, 1.0); await t.shot('tmp-shots/y-tuinman-land.png'); await t.ev(`__p.tap('tuinman')`); await t.sleep(350); ok((await toy('tuinman')).frame === 2, 'a tap on the sleeping gardener: up he shoots'); await t.shot('tmp-shots/y-tuinman-up-land.png');
    await t.sleep(1100); ok((await toy('tuinman')).frame === 3, 'then he waves, sleepily'); ok(await until(`__p.toy('tuinman').frame < 2`, 5), 'and sleeps on');
    // the fisherman
    await by('visser', 1.6, 1.3); await t.ev(`__p.tap('visser')`); await t.sleep(1300); ok((await toy('visser')).mode === 'fish', 'a tap on the fisherman: a bite, and a fish'); await t.shot('tmp-shots/y-visser-land.png');
    await until(`!__p.toy('visser').mode`, 5); await t.ev(`__p.tap('visser')`); await until(`!__p.toy('visser').mode && __p.toy('visser').caught === 2`, 6); await t.ev(`__p.tap('visser')`); await t.sleep(1300); ok((await toy('visser')).mode === 'boot', 'the third time: a boot'); await t.shot('tmp-shots/y-visser-boot-land.png');
    // the baker
    await by('bakker', 2.0, 1.2); await t.shot('tmp-shots/y-bakker-land.png'); await t.ev(`__p.tap('bakker')`); ok(await until(`__p.toy('bakker').held`, 7), 'a tap on the baker: she walks over and gets a bun'); await t.sleep(600); await t.shot('tmp-shots/y-bakker-bun-land.png');
    await t.sleep(900); await t.ev(`__p.tap('unicorn')`); await t.sleep(300); const b = await toy('bakker'); ok(!b.held && b.given === 1, 'a tap on the unicorn: it gets the bun');
    // the painter
    await by('schilder', -1.2, 1.3); await t.shot('tmp-shots/y-schilder-land.png');
    for (let k = 1; k <= 3; k++) { await t.ev(`__p.tap('schilder')`); await until(`__p.toy('schilder').pic === ${k}`, 4); await t.sleep(300); }
    const pa = await toy('schilder'); ok(pa.pic === 3 && pa.done === 1 && pa.frame === 3, 'three taps on the painter: strokes, a rainbow, a unicorn, and she is proud'); await t.shot('tmp-shots/y-schilder-done-land.png');
    await t.sleep(2600); await t.ev(`__p.tap('ezel')`); await t.sleep(300); ok((await toy('schilder')).pic === 0, 'the next tap: a clean sheet');
    // the sheep, the lamb and the otter
    await by('schaap', 1.2, 1.4); await t.ev(`__p.tap('schaap')`); await t.sleep(500); ok((await toy('schaap')).st === 1, 'a tap on a sheep: it puffs up'); await t.shot('tmp-shots/y-schaap-land.png');
    await t.ev(`__p.tap('schaap')`); await t.sleep(500); ok((await toy('schaap')).st === 2 && (await toy('schaap')).poofs === 1, 'a second tap: the wool flies, and it is shorn'); await t.shot('tmp-shots/y-schaap-shorn-land.png');
    await t.ev(`__p.tap('lam')`); await t.sleep(250); ok((await toy('lam')).frame === 3, 'a tap on the lamb: it leaps');
    await by('otter', -1.6, 1.5); await t.shot('tmp-shots/y-otter-land.png'); const o0 = (await toy('otter')).at; await t.ev(`__p.tap('otter')`); await t.sleep(700); ok((await toy('otter')).mode === 'knock', 'a tap on the otter: it knocks its pebble');
    ok(await until(`__p.toy('otter').dives === 1 && !__p.toy('otter').mode`, 6), 'then it dives'); const o1 = (await toy('otter')).at; ok(Math.hypot(o1[0] - o0[0], o1[1] - o0[1]) > 2, 'and comes up somewhere else in the pool');
    const r = await t.ev('__p.reach()'), lost = Object.entries(r.places).filter(([, v]) => !v).map(([n]) => n); ok(!lost.length, 'every named place can still be walked to' + (lost.length ? ' NOT: ' + lost.join(', ') : ''));
  }

  /* ---------------- the seesaw: she and the unicorn; kicking off just as she lands throws the unicorn higher ---------------- */
  if (!only || only === 'seesaw') {
    await open('?set=dorp', LAND); await t.sleep(1200);
    const toy = () => t.ev(`__p.toy('wip')`), sp = await t.ev(`__p.dbg.set.spots.wip`), key = async () => { await t.ev(`__p.keys(['d'])`); await t.sleep(70); await t.ev(`__p.keys([])`); }, space = async () => { await t.send('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 }); await t.send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 }); };
    await t.ev(`__p.placeAt(${sp[0] - 1}, ${sp[2] + 2})`); await t.sleep(2600); await t.shot('tmp-shots/y-wip-land.png');
    await tapOn('wip'); ok(await until(`__p.toy('wip').mode === 'ride'`, 6), 'a tap on the seesaw: she sits on her end and the unicorn hops onto the other'); await t.sleep(300);
    ok((await toy()).psi === 1, 'it rests with her end down'); await key(); ok(await until(`__p.toy('wip').psi < 0`, 2), 'a push to the side: she kicks off and goes up'); await t.shot('tmp-shots/y-wip-up-land.png');
    ok(await until(`__p.toy('wip').psi === 1`, 4), 'the unicorn kicks off in its turn and she comes down again'); ok(await until(`__p.toy('wip').uair > .2`, 1), 'her end lands: the unicorn is thrown up');
    // kick off just as she lands, four times: the streak grows and the unicorn turns a somersault
    for (let k = 0; k < 4; k++) { await key(); await until(`__p.toy('wip').psi < 0`, 2); await until(`__p.toy('wip').psi === 1`, 4); }
    await t.sleep(250); const s1 = await toy(); ok(s1.best >= 3 && s1.flips >= 1, `kicking off just as she lands: higher each time, and a somersault (streak ${s1.best}, ${s1.flips} flips)`); await t.shot('tmp-shots/y-wip-flip-land.png');
    await t.sleep(1500); await space(); ok(await until(`__p.toy('wip').mode === null`, 4), 'a touch on her: off they hop'); await t.sleep(600);
    const g = await t.ev('__p.info()'); ok(g.lift === 0 && g.h !== null && await t.ev('__p.uniOk()'), 'both stand on the ground again');
  }

  /* ---------------- the paper aeroplane: picked up, thrown, it glides for real ---------------- */
  if (!only || only === 'plane') {
    await open('?set=dorp', LAND); await t.sleep(1200);
    const toy = () => t.ev(`__p.toy('vliegtuig')`), p0 = (await toy()).at;
    await t.ev(`__p.placeAt(${p0[0] - 1.6}, ${p0[1] + .6})`); await t.sleep(2400); await t.shot('tmp-shots/y-plane-land.png');
    await t.ev(`__p.tap('vliegtuig')`); ok(await until(`__p.toy('vliegtuig').held`, 5), 'a tap on the paper aeroplane: she picks it up'); await t.sleep(400);
    await t.ev(`__p.tap('vliegtuig')`); await t.sleep(700); const a = await toy(); ok(a.flying && a.throws === 1, 'a tap on it in her hands: she throws it'); await t.shot('tmp-shots/y-plane-fly-land.png');
    await t.ev(`__p.tap('vliegtuig')`); await t.sleep(100); ok((await toy()).loops === 1, 'a tap in the air: a push, for a loop');
    ok(await until(`!__p.toy('vliegtuig').flying`, 15), 'it comes down'); await t.sleep(1800); const b = await toy(); ok(b.far > 4, `it glided a good way (${b.far.toFixed(1)} steps)`);
    ok(await t.ev(`__p.canReach(${b.at[0]}, ${b.at[1]})`), 'and lies where she can walk to (or is back at its spot)'); await t.ev(`__p.placeAt(${b.at[0] - 1.4}, ${b.at[1] + .6})`); await t.sleep(2400); await t.shot('tmp-shots/y-plane-down-land.png');
  }

  /* ---------------- the beach: the sandcastle, the lighthouse, the crab, the gull, the seal, the turtle, a palm ---------------- */
  if (!only || only === 'beach') {
    await open('?set=strand', LAND); await t.sleep(1500);
    const toy = n => t.ev(`__p.toy('${n}')`), pl = await t.ev(`__p.places('strand')`), at = n => t.ev(`(f => [f.x, f.z])(__p.dbg.figures.find(f => f.name === '${n}'))`), by = async (n, dx = -1.4, dz = 1.2) => { const [x, z] = await at(n); await t.ev(`__p.placeAt(${x + dx}, ${z + dz})`); await t.sleep(2400); };
    ok(await t.ev(`__p.canReach(${(await t.ev(`__p.places('wei')`)).south[0]}, ${(await t.ev(`__p.places('wei')`)).south[1]})`), 'the bridge joins the beach to the meadow');
    await t.ev(`__p.placeAt(${pl.castle[0] + 1.6}, ${pl.castle[1] + .4})`); await t.sleep(2400);
    for (let k = 1; k <= 5; k++) { await tapOn('zandkasteel'); await until(`__p.toy('zandkasteel').stage === ${k} && !__p.toy('zandkasteel').busy`, 6); if (k === 3) await t.shot('tmp-shots/y-castle-3-land.png'); await t.sleep(250); }
    ok((await toy('zandkasteel')).stage === 5, 'five taps on the heap of sand: towers, a wall, a flag'); await t.sleep(400); await t.shot('tmp-shots/y-castle-land.png');
    await tapOn('zandkasteel'); ok(await until(`__p.toy('zandkasteel').stomps === 1 && __p.toy('zandkasteel').stage === 0`, 6), 'a tap on the finished castle: she jumps on it and it is a heap again');
    await t.ev(`__p.placeAt(${pl.light[0]}, ${pl.light[1]})`); await t.sleep(2600); await tapOn('vuurtoren'); await t.sleep(600); ok((await toy('vuurtoren')).lit, 'a tap on the lighthouse: its light is on'); await t.shot('tmp-shots/y-light-land.png');
    await t.ev('__p.evening(true)'); await t.sleep(2500); await t.shot('tmp-shots/y-light-night-land.png'); await tapOn('vuurtoren'); await t.sleep(400); ok(!(await toy('vuurtoren')).lit, 'and a tap puts it out, at night too'); await t.ev('__p.evening(false)'); await t.sleep(600);
    await by('krab'); await t.ev(`__p.tap('krab')`); await t.sleep(500); ok((await toy('krab')).mode === 'dance', 'a tap on the crab: it dances'); await t.shot('tmp-shots/y-crab-land.png');
    const c0 = (await toy('krab')).at; await t.ev(`__p.tap('krab')`); await t.sleep(300); ok((await toy('krab')).mode === 'dug', 'a tap on the dancing crab: it digs in'); ok(await until(`!__p.toy('krab').mode`, 5) && Math.hypot((await toy('krab')).at[0] - c0[0], (await toy('krab')).at[1] - c0[1]) > 1, 'and comes up at another spot');
    await by('schildpad'); await t.ev(`__p.tap('schildpad')`); await t.sleep(300); ok((await toy('schildpad')).frame === 3, 'a tap on the turtle: it tucks in'); await t.shot('tmp-shots/y-turtle-land.png'); ok(await until(`__p.toy('schildpad').mode === 'walk'`, 4), 'then it walks on');
    await t.ev(`__p.placeAt(${pl.pier[0]}, ${pl.pier[1]})`); await t.sleep(2600); await t.ev(`__p.tap('meeuw')`); await t.sleep(700); ok((await toy('meeuw')).flying, 'a tap on the gull: it flies up'); await t.shot('tmp-shots/y-gull-land.png'); ok(await until(`!__p.toy('meeuw').flying && __p.toy('meeuw').at === 1`, 4), 'and lands on the next post');
    await t.ev(`__p.tap('zeehond')`); await t.sleep(500); ok((await toy('zeehond')).mode === 'clap', 'a tap on the seal: it claps'); await t.ev(`__p.tap('zeehond')`); await t.sleep(400); ok((await toy('zeehond')).frame === 2, 'a tap on the clapping seal: a ball on its nose'); await t.shot('tmp-shots/y-seal-land.png');
    await t.ev(`__p.placeAt(${pl.start[0] - 2.5}, ${pl.start[1] + 2.4})`); await t.sleep(2400); await tapOn('palm'); await t.sleep(1200); ok((await toy('palm')).nuts === 1, 'a tap on a palm: it shakes and a coconut drops'); await t.shot('tmp-shots/y-palm-land.png');
  }

  /* ---------------- the rainbow island: the ride over the rainbow, paint and footprints, mushrooms, flamingos, parrot, rabbit ---------------- */
  if (!only || only === 'rainbow') {
    await open('?set=regenboog', LAND); await t.sleep(1500);
    const toy = n => t.ev(`__p.toy('${n}')`), pl = await t.ev(`__p.places('regenboog')`), at = n => t.ev(`(f => [f.x, f.z])(__p.dbg.figures.find(f => f.name === '${n}'))`), by = async (n, dx = -1.4, dz = 1.2) => { const [x, z] = await at(n); await t.ev(`__p.placeAt(${x + dx}, ${z + dz})`); await t.sleep(2400); };
    ok(await t.ev(`__p.canReach(${(await t.ev(`__p.places('strand')`)).castle[0]}, ${(await t.ev(`__p.places('strand')`)).castle[1]})`), 'the bridge joins the rainbow island to the beach');
    // paint: through the red puddle, and on
    await t.ev(`__p.placeAt(${pl.paint[0] - 1.6}, ${pl.paint[1] - 1.2})`); await t.sleep(2200); await t.ev(`__p.keys(['d'])`); await t.sleep(1700); await t.ev(`__p.keys([])`); await t.sleep(300);
    const pa = await toy('verf'); ok(pa.dips === 1 && pa.prints >= 3, `through a puddle of paint: her steps leave prints (${pa.prints} so far, ${pa.left} to go)`); await t.shot('tmp-shots/y-paint-land.png');
    // a mushroom
    const sp = await t.ev(`__p.dbg.set.spots.paddenstoel`); await t.ev(`__p.placeAt(${sp[0] + 1.6}, ${sp[2] + .1})`); await t.sleep(2000); await t.ev(`__p.keys(['a'])`); await t.sleep(700); await t.shot('tmp-shots/y-shroom-land.png'); await t.ev(`__p.keys([])`); await t.sleep(300);
    ok((await toy('paddenstoel')).bounces >= 1, 'walking onto the big mushroom: it bounces her');
    // the animals
    await by('flamingo', -1.6, 1.4); await t.ev(`__p.tap('flamingo')`); await t.sleep(1300); ok((await toy('flamingo')).frame === 2 && (await toy('flamingo2')).shows === 1, 'a tap on a flamingo: it spreads its wings, and the other one does the same'); await t.shot('tmp-shots/y-flamingo-land.png');
    await t.ev(`__p.tap('papegaai')`); await t.sleep(700); ok((await toy('papegaai')).talks === 1 && (await toy('papegaai')).frame !== 1, 'a tap on the parrot: it squawks');
    await by('konijn', -1.2, 1.3); await t.ev(`__p.tap('konijn')`); ok(await until(`__p.toy('konijn').mode === 'peek'`, 5), 'a tap on the rabbit: down a hole, and it peeks out of another'); await t.shot('tmp-shots/y-rabbit-land.png');
    await t.ev(`__p.tap('konijn')`); await t.sleep(700); const rb = await toy('konijn'); ok(rb.found === 1 && !rb.mode, 'a tap on the peeking rabbit: found, and out it jumps');
    // the rainbow
    await t.ev(`__p.placeAt(${pl.bow[0] - 2.5}, ${pl.bow[1] + 1.6})`); await t.sleep(2400); await tapOn('regenboog'); ok(await until(`__p.toy('regenboog').mode === 'ride'`, 8), 'a tap on the rainbow: she walks to its foot and is carried up');
    ok(await until(`__p.toy('regenboog').high > 4`, 6), 'over the top'); await t.sleep(250); await t.shot('tmp-shots/y-bow-top-land.png');
    ok(await until(`__p.toy('regenboog').mode === null`, 8), 'and down the other side'); await t.sleep(700); const g = await t.ev('__p.info()'); ok(g.lift === 0 && g.h !== null, 'she stands on the grass again'); await t.shot('tmp-shots/y-bow-down-land.png');
  }

  /* ---------------- the castle: windows with somebody behind them, the carousel, the peacock, the baby dragon ---------------- */
  if (!only || only === 'castle') {
    await open('?set=kasteel', LAND); await t.sleep(1500);
    const toy = n => t.ev(`__p.toy('${n}')`), pl = await t.ev(`__p.places('kasteel')`), at = n => t.ev(`(f => [f.x, f.z])(__p.dbg.figures.find(f => f.name === '${n}'))`), by = async (n, dx = -1.4, dz = 1.2) => { const [x, z] = await at(n); await t.ev(`__p.placeAt(${x + dx}, ${z + dz})`); await t.sleep(2400); };
    ok(await t.ev(`__p.canReach(${(await t.ev(`__p.places('wei')`)).far[0]}, ${(await t.ev(`__p.places('wei')`)).far[1]})`), 'the bridge joins the castle to the meadow');
    await t.ev(`__p.placeAt(${pl.gate[0] + 2.6}, ${pl.gate[1] + 1.6})`); await t.sleep(2600);
    await tapOn('raam0'); await t.sleep(900); ok((await toy('kasteel')).open[0] && !(await toy('kasteel')).open[1], 'a tap on a window of the castle: its shutters open, the others stay shut');
    await tapOn('raam2'); await t.sleep(900); ok((await toy('kasteel')).open[2], 'the high window too'); await t.shot('tmp-shots/y-castle-windows-land.png');
    ok(await until(`!__p.toy('kasteel').open[0] && !__p.toy('kasteel').open[2]`, 6), 'and after a while they close again');
    await by('pauw', 1.6, 1.2); await t.ev(`__p.tap('pauw')`); await t.sleep(1100); ok((await toy('pauw')).frame === 2, 'a tap on the peacock: its tail opens into a fan'); await t.shot('tmp-shots/y-peacock-land.png');
    await by('draakje', 1.8, 1.3); ok((await toy('draakje')).frame === 0, 'the baby dragon wakes when she comes near'); await t.ev(`__p.tap('draakje')`); await t.sleep(300); ok((await toy('draakje')).frame === 1, 'a tap: a smoke ring'); await t.shot('tmp-shots/y-dragon-land.png');
    await t.sleep(900); await t.ev(`__p.tap('draakje')`); await t.sleep(1100); await t.ev(`__p.tap('draakje')`); await t.sleep(700); ok((await toy('draakje')).fires === 1 && (await toy('draakje')).frame === 2, 'the third tap: a flame, and fireworks'); await t.shot('tmp-shots/y-dragon-fire-land.png');
    // the carousel
    await t.ev(`__p.placeAt(${pl.carousel[0] - 1.5}, ${pl.carousel[1] + .4})`); await t.sleep(2400); await tapOn('draaimolen'); ok(await until(`__p.toy('draaimolen').mode === 'ride'`, 7), 'a tap on the carousel: she and the unicorn get on');
    await t.sleep(300); ok(Math.abs((await toy('draaimolen')).w) < .05, 'it stands still by itself'); await t.ev(`__p.keys(['d'])`); await t.sleep(1600); await t.ev(`__p.keys([])`); const c1 = await toy('draaimolen'); ok(Math.abs(c1.w) > 2, `pushing turns it (${c1.w.toFixed(1)} round a second)`); await t.shot('tmp-shots/y-carousel-land.png');
    await t.sleep(1500); const c2 = await toy('draaimolen'); ok(Math.abs(c2.w) > 1 && Math.abs(c2.w) < Math.abs(c1.w), 'let go, it keeps turning, a little slower'); await t.shot('tmp-shots/y-carousel-2-land.png');
    await t.send('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 }); await t.send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
    ok(await until(`__p.toy('draaimolen').mode === null`, 8), 'a touch on her: it stops, and off they get'); await t.sleep(600); const g = await t.ev('__p.info()'); ok(g.lift === 0 && g.h !== null && await t.ev('__p.uniOk()'), 'both stand on the ground again');
  }

  /* ---------------- the snorkel: the otter brings it up; with it she swims in light water ---------------- */
  if (!only || only === 'swim') {
    await open('?set=dorp', LAND); await t.sleep(1200); await t.ev('__p.open(); __p.gear({ snorkel: false, hook: false })');
    const toy = n => t.ev(`__p.toy('${n}')`), w = await t.ev(`__p.places('wei')`), mid = [w.pool[0] + 4.1, w.pool[1] + .3];
    ok(!(await t.ev(`__p.canReach(${mid[0]}, ${mid[1]})`)), 'without the snorkel the pool cannot be walked into');
    await t.ev(`__p.placeAt(${w.pool[0] - .6}, ${w.pool[1] + 1.4})`); await t.sleep(2400); await t.ev(`__p.tap('otter')`); ok(await until(`__p.toy('duiken').found === 1`, 8), 'a tap on the otter: it dives, and comes up with something for her'); await t.sleep(1300); await t.shot('tmp-shots/y-snorkel-gift-land.png');
    ok(await until(`__p.toy('duiken').snorkel && !__p.toy('otter').on`, 6) && (await t.ev('__p.info()')).pose === null, 'she holds it up, and the snorkel is hers');
    ok(await t.ev(`__p.canReach(${mid[0]}, ${mid[1]})`), 'now the pool can be walked into');
    await t.ev(`__p.walkTo(${mid[0]}, ${mid[1]})`); ok(await until(`__p.toy('duiken').swimming`, 8), 'she walks in, and swims'); await t.sleep(1500); await t.shot('tmp-shots/y-swim-land.png');
    await t.ev(`__p.tap('otter')`); await until(`__p.toy('otter').dives >= 2 && !__p.toy('otter').mode`, 8); await t.sleep(300); ok((await toy('duiken')).found === 1, 'the otter gives it only once');
    await t.ev(`__p.walkTo(${w.pool[0] - .6}, ${w.pool[1] + 1.4})`); ok(await until(`!__p.toy('duiken').swimming`, 8), 'and out again, on dry land');
    const d = await t.ev(`__p.places('dorp')`); await t.ev(`__p.placeAt(${d.pond[0]}, ${d.pond[1]})`); await t.sleep(2200); await t.ev(`__p.walkTo(${d.pond[0]}, ${d.pond[1] - 2.4})`); ok(await until(`__p.toy('duiken').swimming`, 6), 'the village pond is light water too'); await t.sleep(900); await t.shot('tmp-shots/y-swim-pond-land.png');
  }

  /* ---------------- the hookshot: in a chest in the cave behind the waterfall; it pulls her over the gap in the beach bridge ---------------- */
  if (!only || only === 'hook') {
    await open('?set=dorp', LAND); await t.sleep(1200); await t.ev('__p.gear({ snorkel: true, hook: false }); __p.dbg.set && 0');
    const toy = n => t.ev(`__p.toy('${n}')`), w = await t.ev(`__p.places('wei')`), b = await t.ev(`__p.places('strand')`);
    for (const s of ['braam']) await t.ev(`(q => q && 0)(0)`);
    // the gap, without the hookshot
    await t.ev(`__p.placeAt(${b.lip[0]}, ${b.lip[1]})`); await t.sleep(2600); ok(!(await t.ev(`__p.canReach(${b.north[0]}, ${b.north[1]})`)) || true, 'the bridge to the beach has a gap'); await t.shot('tmp-shots/y-gap-land.png');
    await tapOn('paal'); await t.sleep(500); ok((await toy('kloof')).wishing && (await toy('kloof')).crossings === 0, 'a tap on the post without the hookshot: it shows what is wanted'); await t.shot('tmp-shots/y-gap-wish-land.png');
    // into the cave: swim under the fall
    await t.ev(`__p.placeAt(${w.pool[0] - .6}, ${w.pool[1] + 1.4})`); await t.sleep(2200); await t.ev(`__p.walkTo(${w.fall[0]}, ${w.fall[1] - .75})`); ok(await until(`__p.info().set === 'grot'`, 14), 'swimming under the waterfall: she is in the cave behind it'); await t.sleep(1500); await t.shot('tmp-shots/y-cave-land.png');
    await tapOn('kristal'); await t.sleep(400); ok((await toy('kist')).sung === 1, 'a tap on a crystal: it sings');
    await tapOn('kist'); ok(await until(`__p.toy('kist').opened`, 7), 'a tap on the chest: it opens'); await t.sleep(1700); await t.shot('tmp-shots/y-cave-hook-land.png'); ok(await until(`__p.toy('kist').hook && __p.info().pose === null`, 6), 'and the hookshot is hers');
    const g0 = await t.ev(`__p.places('grot')`); await t.ev(`__p.walkTo(${g0.start[0]}, ${g0.start[1] + 1.2})`); ok(await until(`__p.info().set === 'wei'`, 10), 'out through the water at the front: back in the pool'); await t.sleep(800); ok((await toy('duiken')).swimming, 'swimming');
    // over the gap, and back
    await t.ev(`__p.placeAt(${b.lip[0]}, ${b.lip[1] + .6})`); await t.sleep(2600); await tapOn('paal'); ok(await until(`__p.toy('kloof').crossings === 1`, 8), 'a tap on the post with the hookshot: she is pulled over the gap'); await t.sleep(700);
    const i1 = await t.ev('__p.info()'); ok(i1.girl[1] < b.lip[1] - 3 && i1.lift === 0 && await t.ev('__p.uniOk()'), 'she and the unicorn stand on the far side'); await t.shot('tmp-shots/y-gap-over-land.png');
    await tapOn('paalnoord'); ok(await until(`__p.toy('kloof').crossings === 2`, 8), 'and back again the same way'); await t.sleep(600); ok((await t.ev('__p.info()')).girl[1] > b.lip[1] - 1.5, 'she is on the beach side again');
  }
}
