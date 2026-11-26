// The paper island (paper/): loads without errors, she walks, the animals and the house answer a tap, day and evening.
// node cdp.mjs tests/t-paper.mjs   (screenshots in tmp-shots/p-*.png; PHONE=1 for an iPhone-sized view)
export default async function (t) {
  const port = process.env.SERVE || 8765, fs = await import('node:fs'); fs.mkdirSync('tmp-shots', { recursive: true });
  if (process.env.PHONE) await t.send('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 2, mobile: true });
  else await t.send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 750, deviceScaleFactor: 1, mobile: false });
  const pre = process.env.PHONE ? 'tmp-shots/p-phone-' : 'tmp-shots/p-';
  await t.go(`http://127.0.0.1:${port}/paper/`);
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
}
