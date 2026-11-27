// The paper island (paper/): loads without errors, she walks, the animals and the house answer a tap, day and evening.
// node cdp.mjs tests/t-paper.mjs   (screenshots in tmp-shots/p-*.png; PHONE=1 for an iPhone-sized view, WHO=fenna for Fenna)
export default async function (t) {
  const port = process.env.SERVE || 8765, fs = await import('node:fs'); fs.mkdirSync('tmp-shots', { recursive: true });
  if (process.env.PHONE) await t.send('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 2, mobile: true });
  else await t.send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 750, deviceScaleFactor: 1, mobile: false });
  const pre = process.env.PHONE ? 'tmp-shots/p-phone-' : 'tmp-shots/p-';
  await t.go(`http://127.0.0.1:${port}/paper/?set=eiland${process.env.WHO ? '&who=' + process.env.WHO : ''}`);   // WHO=fenna plays Fenna
  for (let i = 0; i < 20 && !(await t.ev('!!window.__p')); i++) await t.sleep(500);
  const ok = (c, m) => console.log((c ? 'ok   ' : 'FAIL ') + m);
  ok(await t.ev('!!window.__p'), 'the island loads');
  await t.sleep(1500); await t.shot(pre + 'day.png');
  const a = await t.ev('__p.info()');
  await t.ev('__p.walkTo(-1.5, 1.6)'); await t.sleep(2500);
  const b = await t.ev('__p.info()');
  ok(Math.hypot(b.girl[0] - a.girl[0], b.girl[1] - a.girl[1]) > 1.5, `she walks (${a.girl.map(v => v.toFixed(1))} -> ${b.girl.map(v => v.toFixed(1))})`);
  await t.ev('__p.walkTo(-2.55, -1.15)'); await t.sleep(3000);
  const c = await t.ev('__p.info()');
  ok(!(Math.abs(c.girl[0] + 2.55) < 1.2 && Math.abs(c.girl[1] + 1.15) < .9), 'the house is solid');
  await t.ev('__p.placeAt(2.3, 1.2)'); await t.ev('__p.walkTo(2.3, -2.2)'); await t.sleep(3500);
  const d = await t.ev('__p.info()');
  ok(d.girl[2] > .4, `up the stairs onto the hill (y ${d.girl[2].toFixed(2)})`);
  await t.ev('__p.placeAt(3.5, 4.6)'); await t.ev('__p.walkTo(3.5, 7.0)'); await t.sleep(1500);
  const e = await t.ev('__p.info()'); ok(e.girl[1] > 6.2, `out on the jetty (z ${e.girl[1].toFixed(1)})`);
  // she shows her front walking towards us, her back walking away, her side walking across
  const views = [];
  for (const [x0, z0, x1, z1] of [[-.5, -0.3, -.5, 3.2], [-.5, 3.2, -.5, -0.2], [-3, 2.4, 1.5, 2.4]]) { await t.ev(`__p.placeAt(${x0}, ${z0}); __p.walkTo(${x1}, ${z1})`); await t.sleep(700); views.push(await t.ev('__p.view()')); }
  ok(views.join() === 'front,back,side', `front, back and side views (${views})`);
  await t.ev('__p.placeAt(-.5, -0.3); __p.walkTo(-.5, 3.2)'); await t.sleep(700); await t.shot(pre + 'front.png');
  await t.ev('__p.placeAt(.2, 1.6)'); await t.sleep(1200);
  const f0 = await t.ev('__p.info()'); await t.click(...(process.env.PHONE ? [250, 560] : [760, 470])); await t.sleep(1500);
  const f1 = await t.ev('__p.info()'); ok(Math.hypot(f1.girl[0] - f0.girl[0], f1.girl[1] - f0.girl[1]) > .5, 'a real tap on the meadow walks her there');
  await t.ev('__p.placeAt(.2, 1.6)'); await t.sleep(1200);
  await t.click(...await t.ev("__p.screen('sheep')")); await t.sleep(150);
  ok(await t.ev("__p.hop('sheep')") > .1, 'a real tap on the sheep makes it jump'); await t.shot(pre + 'sheep.png');
  await t.click(...await t.ev("__p.screen('house')")); await t.sleep(900);
  ok((await t.ev('__p.info()')).door === 1, 'a tap opens the door');
  await t.ev("__p.tap('duck')"); await t.sleep(400);
  // the unicorn keeps up over the stairs and out onto the jetty, and always stands on something
  await t.ev('__p.placeAt(.5, 1.8)'); await t.sleep(800);
  let lost = false;
  for (const [x, z, ms] of [[2.3, .9, 1800], [2.3, -2.4, 2500], [2.3, 1.4, 2500], [3.5, 3.0, 1800], [3.5, 7.2, 2500]]) {
    await t.ev(`__p.walkTo(${x}, ${z})`); for (let i = 0; i < ms / 250; i++) { await t.sleep(250); if (!(await t.ev('__p.uniOk()'))) lost = true; }
  }
  const u = await t.ev('__p.info()'); ok(!lost && Math.hypot(u.uni[0] - u.girl[0], u.uni[1] - u.girl[1]) < 2.5, `the unicorn keeps up and never stands in the sea (girl ${u.girl.map(v => v.toFixed(1))}, unicorn ${u.uni.map(v => v.toFixed(1))})`);
  await t.ev('__p.evening(true)'); await t.sleep(1200); await t.shot(pre + 'evening.png');
  await t.ev('__p.placeAt(3.5, 6.6)'); await t.sleep(1500); await t.shot(pre + 'jetty-evening.png');
  // the paper doll: things to wear from the stall, poses, shut eyes, the balloon on its thread
  await t.ev('__p.evening(false)'); await t.ev('__p.placeAt(.2, 1.9)'); await t.sleep(900);
  const w = await t.ev("__p.wear(['kroon', 'ketting', 'jurkregenboog', 'vleugels', 'ballon'])");
  ok(w.head === 'kroon' && w.neck === 'ketting' && w.dress === 'jurkregenboog' && w.back === 'vleugels' && w.hand === 'ballon', 'she puts on one thing in each of the five slots');
  for (let i = 0; i < 40 && (await t.ev('__p.doll()')).warm; i++) await t.sleep(250);
  const d1 = await t.ev('__p.doll()');
  ok(d1.warm === 0, 'her new drawings are all made');
  ok(d1.balloon && d1.balloon[1] > d1.hand[1] + .6 && Math.abs(d1.balloon[0] - d1.hand[0]) < .5, `the balloon floats above her hand (${d1.balloon && d1.balloon.map(v => v.toFixed(2))} over ${d1.hand.map(v => v.toFixed(2))})`);
  await t.ev("__p.face('front')"); await t.sleep(400); await t.shot(pre + 'dressed.png');
  await t.ev('__p.walkTo(-2.4, 2.6)'); await t.sleep(900); await t.shot(pre + 'dressed-walk.png'); await t.sleep(1500);
  const d2 = await t.ev('__p.doll()'); ok(d2.balloon && Math.hypot(d2.balloon[0] - d2.hand[0], d2.balloon[2] - d2.hand[2]) < .8, 'the balloon comes along when she walks');
  await t.ev("__p.pose('sit')"); await t.sleep(500); ok((await t.ev('__p.doll()')).pose === 'sit', 'she sits down'); await t.shot(pre + 'sit.png');
  await t.ev('__p.walkTo(-1.2, 2.2)'); await t.sleep(1200); ok((await t.ev('__p.doll()')).pose !== 'sit', 'a step and she is up again');
  await t.ev("__p.wear(['hoed', 'jurkblauw', 'knuffel'])"); await t.ev("__p.pose('up'); __p.face('front')"); await t.sleep(1500);
  const d3 = await t.ev('__p.doll()'); ok(d3.pose === 'up' && !d3.balloon, 'arms up, and the balloon is gone with the other outfit'); await t.shot(pre + 'up.png');
  await t.ev("__p.pose(null); __p.sleep(true)"); await t.sleep(500); ok((await t.ev('__p.doll()')).eyes === 'shut', 'her eyes shut'); await t.ev('__p.sleep(false)');
  // the readout for a phone (?fps) and the switches that tell what costs what
  await t.ev('__p.wear([])'); await t.sleep(2600);
  const s0 = await t.ev('__p.stats()'); ok(s0.fps > 5 && s0.her > 15 && s0.calls > 20 && s0.shadows && s0.dof && s0.post, `it measures itself (${s0.fps.toFixed(0)} frames a second, she is ${s0.her.toFixed(0)} points tall, ${s0.calls} draws)`);
  await t.go(`http://127.0.0.1:${port}/paper/?set=eiland&fps&shadows=0&dof=0&dpr=1`);
  for (let i = 0; i < 20 && !(await t.ev('!!window.__p')); i++) await t.sleep(500);
  await t.sleep(2600);
  const s1 = await t.ev('__p.stats()'); ok(!s1.shadows && !s1.dof && s1.dpr === 1 && s1.calls < s0.calls && s1.fps > 5, `without shadows and soft focus it still draws, with fewer draws (${s1.calls} against ${s0.calls})`);
  ok(await t.ev("!!document.getElementById('stat') && document.getElementById('stat').textContent.includes('frames a second')"), 'the readout shows'); await t.shot(pre + 'readout.png');
  await t.go(`http://127.0.0.1:${port}/paper/?set=eiland&fps&post=0`);
  for (let i = 0; i < 20 && !(await t.ev('!!window.__p')); i++) await t.sleep(500);
  await t.sleep(2600); ok((await t.ev('__p.stats()')).fps > 5, 'without the lens pass it still draws'); await t.shot(pre + 'nolens.png');
}
