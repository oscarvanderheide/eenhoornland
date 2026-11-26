// node cdp.mjs tests/t-haak.mjs — the hookshot: a chest in the forest opens when both buttons in front of it carry weight
// (the big stones beside it, an animal, herself); △ at the gap in the bridge pulls her across to the post; it pulls her
// over to a big stone and pulls an animal to her (tmp-shots/hk-*.png)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const until = async (expr, ms = 4000) => { for (let i = 0; i < ms / 100; i++) { if (await t.ev(expr)) return true; await t.sleep(100); } return false; };
  const URL = 'http://127.0.0.1:8765/dev.html?go&debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL); await t.sleep(1500);
  await t.ev(`__w.Q._reset({ stage: 'ei' }); __w.Q.giveTool('zwaard'); 0`); await t.sleep(300);
  ok(!(await J('__w.haak.info().shown')), 'before the unicorn hatched there is no chest');
  ok(await t.ev(`getComputedStyle(document.getElementById('b-hook')).visibility === 'hidden'`), 'and no hook button');
  await t.ev(`__w.Q._reset({ stage: 'baby' }); __w.Q.giveTool('zwaard'); 0`); await t.sleep(400);
  const H = await J('__w.haak.info()'); ok(H.shown && !H.open, 'once it hatched the chest stands in the forest: ' + H.chest);
  ok(JSON.stringify(await J(`__w.tools.spot('haak')`)) === JSON.stringify(H.chest), 'the map knows where it is');
  // walking to the gap without the hookshot: it does not let her across
  await t.ev(`__w.placeAt(70.5, 55.5)`); await t.sleep(400); await t.key('ArrowDown', 1200);
  ok(await t.ev('__w.kid.pos.z') < 57, 'the gap in the bridge stops her: ' + await t.ev('__w.kid.pos.z'));
  ok(await t.ev('__w.hook()') === false, 'no hookshot yet: △ does nothing'); await t.shot('tmp-shots/hk-1-gap.png');
  // the puzzle: one stone on a button, herself on the other
  const [cx, cz] = H.chest, P = H.plates;
  await t.ev(`__w.placeAt(${cx + .5}, ${cz + 3.5})`); await t.sleep(600); await t.shot('tmp-shots/hk-2-chest.png');
  const st = await J(`__w.keien.stones().filter(s => s.tag === 'puzzle').map(s => [s.id, s.x, s.z])`); ok(st.length === 2, 'two stones beside the chest');
  // carry the west stone onto the west button
  await t.ev(`__w.placeAt(${st[0][1] + .5}, ${st[0][2] + 1.5})`); await t.sleep(400);
  await t.ev(`__w.keien.lift(__w.keien.stones()[${st[0][0]}])`); await t.sleep(300);
  await t.ev(`__w.placeAt(${P[0][0] + .5}, ${P[0][1] - .5}); __w.kid.face = 1`); await t.sleep(300);
  await t.ev(`__w.stick(0, 1)`); await t.sleep(60); await t.ev(`__w.stick(0, 0)`); await t.ev(`__w.keien.putDown()`); await t.sleep(500);
  ok(JSON.stringify(await J(`__w.keien.info().stones[${st[0][0]}]`)) === JSON.stringify(P[0]), 'a stone on the first button: ' + await J(`__w.keien.info().stones[${st[0][0]}]`));
  ok(await until(`__w.haak.info().pressed[0] && !__w.haak.info().open`, 1500), 'it goes down, the chest stays shut'); await t.shot('tmp-shots/hk-3-one.png');
  await t.ev(`__w.placeAt(${P[1][0] + .5}, ${P[1][1] + .5})`);
  ok(await until(`__w.haak.info().open && __w.Q.hasTool('haak')`, 2500), 'she stands on the other: the chest opens, the hookshot is hers'); await t.sleep(400); await t.shot('tmp-shots/hk-4-open.png');
  ok(await until(`getComputedStyle(document.getElementById('b-hook')).visibility !== 'hidden'`, 1000), 'the △ button shows');
  // across the gap
  await t.ev(`__w.placeAt(70.5, 55.5); __w.kid.face = 1`); await t.sleep(600);
  await t.ev('__w.hook()'); await t.sleep(250); await t.shot('tmp-shots/hk-5-fly.png');
  ok(await until(`__w.kid.pos.z > 60 && !__w.busy()`, 4000), 'the hookshot pulls her across: ' + await J('__w.info().pos'));
  ok(await t.ev(`__w.walkable(Math.floor(__w.kid.pos.x), Math.floor(__w.kid.pos.z))`), 'she lands on the bridge'); await t.sleep(400); await t.shot('tmp-shots/hk-6-across.png');
  await t.ev(`__w.kid.face = -1; __w.stick(0, -1)`); await t.sleep(50); await t.ev('__w.stick(0, 0)'); await t.ev('__w.hook()'); ok(await until(`__w.kid.pos.z < 57 && !__w.busy()`, 4000), 'and back again');
  // a big stone comes to her
  const S = await J(`(() => { const s = __w.keien.stones().find(s => s.zone === 'dorp'); return [s.id, s.x, s.z]; })()`);
  const from = await J(`(() => { const [x, z] = [${S[1]}, ${S[2]}]; for (const dx of [-4, 4, -3, 3]) if (__w.walkable(x + dx, z)) { let clear = true; for (let k = 1; k < Math.abs(dx); k++) if (!__w.walkable(x + Math.sign(dx) * k, z)) clear = false; if (clear) return [x + dx + .5, z + .5, Math.sign(-dx)]; } return null; })()`);
  if (from) {
    await t.ev(`__w.placeAt(${from[0]}, ${from[1]}); __w.kid.face = ${from[2]}`); await t.sleep(400); await t.ev(`__w.stick(${from[2]}, 0)`); await t.sleep(40); await t.ev('__w.stick(0, 0)'); await t.ev(`__w.placeAt(${from[0]}, ${from[1]})`); await t.sleep(200);
    await t.ev('__w.hook()'); await t.sleep(1500);
    const now = await J(`__w.keien.info().stones[${S[0]}]`), me = await J('[__w.kid.pos.x, __w.kid.pos.z]');
    ok(now[0] === S[1] && now[1] === S[2], 'the stone stays where it lies: ' + now);
    ok(Math.hypot(me[0] - S[1] - .5, me[1] - S[2] - .5) < 1.2 && Math.abs(me[0] - from[0]) > 2 && !(await t.ev('__w.busy()')), 'the hookshot pulls her over to the stone: ' + me.map(v => v.toFixed(1)));
    ok(await t.ev(`__w.walkable(Math.floor(__w.kid.pos.x), Math.floor(__w.kid.pos.z))`), 'she lands beside it on open ground'); await t.shot('tmp-shots/hk-7-stone.png');
  } else console.log('  (no straight line to a stone; skipped)');
  // an animal comes flying
  await t.ev(`__w.placeAt(30.5, 46.5); __w.kid.face = 1`); await t.sleep(300);
  await t.ev(`(a => { a.pos.set(34.5, 0, 46.5); a.path = []; a.wait = 30; a.fly = null; a.swim = null; window.__a = a; })(__w.animals.find(a => a.g.visible && !a.water && !a.uniKind && !a.way && !a.dog))`); await t.sleep(300);
  await t.ev(`__w.stick(1, 0)`); await t.sleep(40); await t.ev('__w.stick(0, 0)'); await t.ev(`__w.placeAt(30.5, 46.5)`); await t.sleep(100);
  await t.ev('__w.hook()'); await t.sleep(300); await t.shot('tmp-shots/hk-8-animal.png'); await t.sleep(1200);
  ok(await t.ev(`Math.hypot(__a.pos.x - __w.kid.pos.x, __a.pos.z - __w.kid.pos.z) < 1.4 && !__a.held`), 'an animal is pulled in front of her: ' + await J('[__a.pos.x, __a.pos.z]'));
  console.log(fail ? `${fail} FAILED` : 'ALL OK'); for (const l of t.logs.filter(l => /error|fail/i.test(l) && !/favicon/.test(l)).slice(0, 8)) console.log('  log', l);
}
