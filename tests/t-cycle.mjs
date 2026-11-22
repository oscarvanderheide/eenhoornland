// node cdp.mjs tests/t-cycle.mjs — plays one whole cycle in a real browser (teleporting instead of walking,
// because headless WebGL is slow) and checks the game reacts at every step. Screenshots go to tmp-shots/.
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const q = async () => JSON.parse(await t.ev('JSON.stringify({stage:__w.Q.quest.stage,w:__w.Q.wishes(),bed:__w.Q.bedtime(),herd:__w.Q.quest.herd.length,coins:__w.Q.quest.coins,uni:__w.uni.g.visible,night:document.querySelector("#quest .bed")!==null,day:__w.Q.quest.day})'));
  const settle = async (ms = 1500) => { await t.sleep(ms); };
  const shot = n => t.shot(`tmp-shots/c-${n}.png`);
  await t.go('http://127.0.0.1:8765/dev.html?go&debug'); await t.ev('localStorage.clear()'); await t.go('http://127.0.0.1:8765/dev.html?go&debug');
  let s = await q(); ok(s.stage === 'zoek' && !s.uni && s.herd === 0, 'fresh game: searching, no companion'); await shot('1-start');
  await t.ev(`document.querySelector('#b-map').click()`); await settle(600); ok(await t.ev(`!!document.querySelector('.kaart-pin')`), 'map opens'); await shot('2-map');
  await t.ev(`document.querySelector('#modal [data-close]').click()`);
  const collect = async (type, n) => { for (let k = 0; k < n; k++) { const it = JSON.parse(await t.ev(`JSON.stringify(__w.extras.items().find(i=>i.type==='${type}')||null)`)); if (!it) return ok(false, 'no ' + type + ' left'); await t.ev(`__w.placeAt(${it.x},${it.z})`); await settle(1200); } };
  const grant = async () => {
    for (let g = 0; g < 8; g++) {
      s = await q(); const w = s.w.find(w => w.have < w.need && w.t !== 'wei'); if (!w) break;
      if (w.t === 'egg') { const e = JSON.parse(await t.ev('JSON.stringify(__w.extras.info().egg)')); await t.ev(`__w.placeAt(${e[0]},${e[1] + .6})`); await settle(); }
      else if (w.t === 'item') await collect(w.id, w.need - w.have);
      else if (w.t === 'act') {
        await t.ev(`__w.placeAt(14.5,9.5); __w.walkTo(...__w.BUILDINGS.find(b=>b.id==='${w.id}').door, __w.BUILDINGS.find(b=>b.id==='${w.id}'))`);
        await t.ev(`(()=>{const b=__w.BUILDINGS.find(b=>b.id==='${w.id}'); __w.placeAt(b.door[0]+.5,b.door[1]+.5); __w.walkTo(b.door[0],b.door[1],b)})()`); await settle(2500);
        const open = await t.ev(`!document.querySelector('#act').hidden`); ok(open, 'activity ' + w.id + ' opens'); await shot('act-' + w.id + '-' + s.stage);
        await t.ev(`__w.Q.activityDone('${w.id}')`); await t.ev(`document.querySelector('#act-close').click()`); await settle(800);
      }
    }
  };
  const sleep = async tag => {
    await t.ev(`(()=>{const b=__w.BUILDINGS.find(b=>b.id==='huisje'); __w.placeAt(b.door[0]+.5,b.door[1]+.5); __w.walkTo(b.door[0],b.door[1],b)})()`); await settle(2500);
    ok(await t.ev(`!document.querySelector('#act').hidden && document.querySelector('#act-title').textContent==='Ons Huisje'`), 'bedroom opens'); await shot(tag + '-bed');
    await t.ev(`document.querySelector('.act-huisje .tool').click()`); await t.sleep(3000); await shot(tag + '-sleeping');
    let done = false; for (let i = 0; i < 40 && !done; i++) { await t.sleep(700); done = await t.ev(`!!document.querySelector('.act-huisje .btn')`); if (i === 11) await shot(tag + '-reveal'); }
    ok(done, 'morning arrives'); await shot(tag + '-morning'); await t.ev(`document.querySelector('.act-huisje .btn').click()`); await settle(1500);
  };
  // egg
  await grant(); s = await q(); ok(s.stage === 'ei' && s.uni, 'egg found, egg follows'); await shot('3-egg-found');
  await grant(); s = await q(); ok(s.bed && s.night, 'nest done: bedtime, bed button shown'); await settle(2500); await shot('4-evening');
  await sleep('5'); s = await q(); ok(s.stage === 'baby' && s.uni && !s.bed, 'hatched: baby follows, day again'); await shot('6-baby');
  await grant(); s = await q(); ok(s.bed, 'baby wishes done'); await sleep('7'); s = await q(); ok(s.stage === 'jong', 'grew to jong'); await shot('8-jong');
  await grant(); s = await q(); ok(s.bed, 'jong wishes done'); await sleep('9'); s = await q(); ok(s.stage === 'groot', 'grew to groot'); await shot('10-groot');
  await grant(); s = await q(); ok(!s.bed && await t.ev('__w.Q.weiOpen()'), 'meadow wish opens');
  await t.ev(`__w.placeAt(17.5,29)`); await settle(2500); s = await q(); ok(s.stage === 'feest' && s.herd === 1 && !s.uni && s.bed, 'delivered: party, herd 1'); await shot('11-party');
  await sleep('12'); s = await q(); ok(s.stage === 'zoek' && s.day === 5, 'new egg, day 5 (got day ' + s.day + ')'); await shot('13-new-cycle');
  ok(!(await t.ev('__w.info().paused')), 'world running at the end');
  console.log(fail ? 'FAILED ' + fail : 'CYCLE OK');
}
