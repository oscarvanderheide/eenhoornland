// node cdp.mjs tests/t-houses.mjs — a screenshot at every house (one per area), and of taking turns (tmp-shots/h-*.png)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  await t.go('http://127.0.0.1:8765/dev.html?go&debug'); await t.ev('localStorage.clear()'); await t.go('http://127.0.0.1:8765/dev.html?go&debug');
  await t.ev(`__w.Q._reset({ stage: 'jong' }); __w.Q.giveTool('schaar'); __w.Q.giveTool('hamer'); 0`); await t.sleep(800);
  ok(await t.ev(`document.querySelectorAll('.blabel').length`) === 0, 'no signs above the houses');
  for (const id of ['huisje', 'stal', 'atelier', 'bakkerij', 'kermis']) {
    await t.ev(`(()=>{const b=__w.BUILDINGS.find(b=>b.id==='${id}'); __w.placeAt(b.door[0]+.5,b.door[1]+2.5)})()`); await t.sleep(2500); await t.shot(`tmp-shots/h-${id}.png`);
    ok(await t.ev(`(()=>{const b=__w.BUILDINGS.find(b=>b.id==='${id}'); return __w.walkTo(b.door[0],b.door[1],b)})()`) === true, id + ': the door can be walked to');
    let open = false; for (let i = 0; i < 40 && !open; i++) { await t.sleep(500); open = await t.ev(`!document.querySelector('#act').hidden`); }
    ok(open, id + ' opens'); await t.ev(`document.querySelector('#act-close').click()`); await t.sleep(900);
  }
  // taking turns
  await t.ev(`__w.placeAt(14.5,15.5)`); await t.sleep(1200);
  ok(await t.ev('__w.who()') === 'anna', 'Anna starts'); const h0 = await t.ev('__w.kid.frames.idle.height'); await t.shot('tmp-shots/h-who-anna.png');
  await t.ev(`document.querySelectorAll('#who .who')[1].click()`); await t.sleep(1500);
  ok(await t.ev('__w.who()') === 'fenna' && await t.ev('__w.kid.frames.idle.height') > h0, 'Fenna takes over and is the taller one'); await t.shot('tmp-shots/h-who-fenna.png');
  ok(await t.ev(`document.querySelectorAll('#who .who.on').length`) === 1, 'one face is lit');
  await t.go('http://127.0.0.1:8765/dev.html?go&debug'); await t.sleep(800); ok(await t.ev('__w.who()') === 'fenna', 'still Fenna after a reload');
  await t.ev(`document.querySelectorAll('#who .who')[0].click()`); await t.sleep(500); ok(await t.ev('__w.who()') === 'anna', 'and back to Anna');
  // side by side on one spot: each has a depth of their own (this used to flicker)
  ok(await t.ev('__w.kid.zBias !== (__w.uni.zBias||0)'), 'girl and unicorn never share a depth');
  ok(!t.logs.some(l => /EXC|Error/.test(l)), 'no page errors' + t.logs.filter(l => /EXC|Error/.test(l)).join('|'));
  console.log(fail ? 'FAILED ' + fail : 'HOUSES OK');
}
