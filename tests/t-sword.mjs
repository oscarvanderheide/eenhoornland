// node cdp.mjs tests/t-sword.mjs — the sword is a slash she makes herself: □ / the sword button / F. It cuts grass and
// flowers (they grow back), brambles only fall to a slash, walking into them never cuts (tmp-shots/sw-*.png)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const until = async (expr, ms = 4000) => { for (let i = 0; i < ms / 100; i++) { if (await t.ev(expr)) return true; await t.sleep(100); } return false; };
  const URL = 'http://127.0.0.1:8765/dev.html?go&debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL); await t.sleep(1500);
  await t.ev(`__w.Q._reset({ stage: 'zoek' }); 0`); await t.sleep(300);
  ok(await t.ev(`getComputedStyle(document.getElementById('b-sword')).visibility === 'hidden'`), 'no sword yet: no sword button');
  ok(await t.ev(`__w.slash()`) === false, 'and no slash');
  await t.ev(`__w.Q.giveTool('zwaard'); 0`); await t.sleep(400);
  ok(await t.ev(`getComputedStyle(document.getElementById('b-sword')).visibility !== 'hidden'`), 'with the sword: the □ button shows');
  // grass: find a spot in the village with tufts right of her
  const spot = await J(`(() => { const M = __w.M; for (let z = 44; z < 54; z++) for (let x = 36; x < 46; x++) if (__w.walkable(x, z) && M.zone[M.I(x + 1, z)] === 'dorp' && M.ground[M.I(x + 1, z)] === 0) return [x + .5, z + .5]; return [40.5, 47.5]; })()`);
  let cut = 0;
  for (const [x, z] of [[spot[0], spot[1]], [44.5, 48.5], [38.5, 50.5], [60.5, 46.5], [62.5, 40.5]]) {
    await t.ev(`__w.placeAt(${x}, ${z}); __w.kid.face = 1`); await t.sleep(350);
    await t.ev(`__w.slash()`); await t.sleep(70); if (!cut) await t.shot('tmp-shots/sw-1-slash.png'); await t.sleep(400);
    await t.ev(`__w.kid.face = -1`); await t.ev(`__w.slash()`); await t.sleep(450);
    cut = await t.ev('__w.sword.info().cut'); if (cut) break;
  }
  ok(cut > 0, 'a slash cuts the grass in front of her: ' + cut); await t.shot('tmp-shots/sw-2-cut.png');
  await t.ev(`__w.sword.regrowNow()`); ok(await until(`__w.sword.info().cut === 0`, 3000), 'and it grows back');
  // F on the keys slashes too
  const n0 = await t.ev('__w.sword.info().count'); await t.key('f', 80); ok(await until(`__w.sword.info().count > ${n0}`, 800), 'F slashes');
  // brambles: walking into them never cuts, a slash does
  await t.ev(`__w.Q._reset({ stage: 'ei' }); __w.Q.giveTool('zwaard'); 0`); await t.sleep(300);
  const br = await J(`(() => { const i = __w.M.obstacles.findIndex(o => o.type === 'break' && o.tool === 'zwaard'); const b = __w.M.obstacles[i]; for (const [dx, dz] of [[-1,0],[1,0],[0,1],[0,-1]]) if (__w.walkable(b.x + dx, b.z + dz)) return { i, x: b.x + dx + .5, z: b.z + dz + .5, bx: b.x + .5, bz: b.z + .5 }; })()`);
  await t.ev(`__w.placeAt(${br.x}, ${br.z})`); await t.sleep(500);
  await t.ev(`__w.stick(${Math.sign(br.bx - br.x)}, ${Math.sign(br.bz - br.z)})`); await t.sleep(1500); await t.ev('__w.stick(0, 0)');
  ok(!(await t.ev(`__w.Q.quest.broken.includes(${br.i})`)), 'walking into the brambles does not cut them');
  await t.ev(`__w.placeAt(${br.x}, ${br.z}); __w.kid.face = -1`); await t.sleep(400); await t.shot('tmp-shots/sw-3-bramble.png');
  await t.ev(`__w.slash()`); await t.sleep(90); await t.shot('tmp-shots/sw-4-bramble-slash.png'); await t.sleep(1200);
  ok(await t.ev(`__w.Q.quest.broken.includes(${br.i})`), 'standing still next to it (even looking away), a slash cuts it');
  console.log(fail ? `${fail} FAILED` : 'ALL OK'); for (const l of t.logs.filter(l => /error|fail/i.test(l) && !/favicon/.test(l)).slice(0, 8)) console.log('  log', l);
}
