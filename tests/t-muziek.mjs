// node cdp.mjs tests/t-muziek.mjs — the cricket in the flower meadow plays the fiddle when she comes near; ✕ next to it
// sits her on the log to listen, the meadow's animals come and sit round; a step gets her up (tmp-shots/mz-*.png)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const until = async (expr, ms = 4000) => { for (let i = 0; i < ms / 100; i++) { if (await t.ev(expr)) return true; await t.sleep(100); } return false; };
  const URL = 'http://127.0.0.1:8765/dev.html?go&debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL); await t.sleep(1500);
  await t.ev(`__w.Q._reset({ stage: 'vriend' }); __w.Q.giveTool('zwaard'); __w.Q.giveTool('haak'); __w.setMount(null); 0`); await t.sleep(400);
  const S = await J('__w.MAP.MUSIC');
  await t.ev(`__w.placeAt(${S.x - 14.5}, ${S.z + 2.5})`); await t.sleep(600); ok(!(await J('__w.muziek.info().playing')), 'far away the cricket rests');
  await t.ev(`__w.placeAt(${S.x + .5}, ${S.z + 1.5})`); await t.sleep(800); ok(await J('__w.muziek.info().playing'), 'close by it plays'); await t.shot('tmp-shots/mz-1-near.png');
  ok(await t.ev('__w.action().key') === 'muziek', '✕ next to it: sit down and listen (' + await t.ev('__w.action().key') + ')');
  await t.ev('__w.action().run()'); ok(await until('__w.muziek.listening()', 5000), 'she sits on the log and listens');
  ok(await until('__w.muziek.info().crowd.length > 0', 2000), 'the animals come over: ' + await J('__w.muziek.info().crowd'));
  await t.sleep(5000); await t.shot('tmp-shots/mz-2-listening.png');
  await t.key('ArrowDown', 400); ok(await until('!__w.muziek.listening()', 2000), 'a step and she is up again');
  ok(await J('__w.muziek.info().crowd.length') === 0, 'and the animals go back to what they were doing');
  console.log(fail ? `${fail} FAILED` : 'ALL OK'); for (const l of t.logs.filter(l => /error|fail/i.test(l) && !/favicon/.test(l)).slice(0, 8)) console.log('  log', l);
}
