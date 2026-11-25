// node cdp.mjs tests/t-draaimolen.mjs — the carousel on the castle island (tmp-shots/m-*.png)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const until = async (expr, ms = 30000) => { for (let i = 0; i < ms / 200; i++) { if (await t.ev(expr)) return true; await t.sleep(200); } return false; };
  const URL = 'http://127.0.0.1:8765/dev.html?go&debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL); await t.sleep(2000);
  if (process.env.CYCLE) { await t.ev(`__w.Q._reset({ cycle: ${+process.env.CYCLE}, seed: 777 }); 0`); await t.go(URL); await t.sleep(2000); }
  const C = await J('__w.MAP.CAROUSEL'); const tapAt = async (x, y, z) => { const p = await J(`__w.screen(${x}, ${y}, ${z})`); await t.click(p[0], p[1]); };
  await t.ev(`__w.placeAt(${C.on[0] + .5}, ${C.on[1] + 2.5})`); await t.sleep(1500); await t.shot('tmp-shots/m-1-carousel.png');
  ok(await t.ev('__w.molen.spin()') === 0, 'it stands still until she comes');
  await tapAt(C.cx + .5, 2.9, C.cz + .5);
  ok(await until('__w.molen.riding()', 6000), 'a tap: she walks up and climbs on'); await t.sleep(2500); await t.shot('tmp-shots/m-2-ride.png');
  ok(await t.ev('__w.molen.spin() > .5') && await t.ev('__w.kid.lift > .4'), 'round it goes, she rides on a unicorn');
  ok(await until('!__w.molen.riding() && !__w.busy()', 12000), 'it slows down and she hops off');
  ok(await t.ev(`__w.walkable(Math.floor(__w.kid.pos.x), Math.floor(__w.kid.pos.z))`), 'on her feet');
  ok(await t.ev(`__w.action() && __w.action().key`) === 'draaimolen', 'in front of it the action button gets her on again');
  if (fail) console.log('  DRAAIMOLEN FAILED ' + fail);
}
