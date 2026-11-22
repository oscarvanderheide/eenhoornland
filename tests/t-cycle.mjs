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
  const toolsAsked = [], sig = () => t.ev(`__w.M.trees.filter(t=>t.x>30&&t.z<22).map(t=>t.kind+t.x+','+t.z).join(';')`), dorp = () => t.ev(`__w.M.trees.filter(t=>t.x>1&&t.x<27&&t.z>1&&t.z<21).map(t=>t.kind+t.x+','+t.z).join(';')`);
  const forest0 = await sig(), dorp0 = await dorp();
  const grant = async () => {
    for (let g = 0; g < 8; g++) {
      s = await q(); const w = s.w.find(w => w.have < w.need && w.t !== 'wei'); if (!w) break;
      if (w.t === 'tool') { const p = JSON.parse(await t.ev(`JSON.stringify(__w.tools.spot('${w.id}'))`)); ok(!!p, w.id + ' lies somewhere'); toolsAsked.push(s.stage + ':' + w.id); await t.ev(`__w.placeAt(${p[0]},${p[1]})`); await settle(); ok(await t.ev(`__w.Q.hasTool('${w.id}')`), 'picked up the ' + w.id); }
      else if (w.t === 'egg') { const e = JSON.parse(await t.ev('JSON.stringify(__w.extras.info().egg)')); await t.ev(`__w.placeAt(${e[0]},${e[1] + .6})`); await settle(); }
      else if (w.t === 'item') await collect(w.id, w.need - w.have);
      else if (w.t === 'act') {
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
  // the new cycle woke up to a new island: same village, different forest, tools kept, gates grown back, nothing doubled
  ok(/^baby:schaar (jong|groot):hamer$/.test(toolsAsked.join(' ')), 'tools were asked for in order: ' + toolsAsked.join(' '));   // the hammer already at 'jong' when the wish is the bakery at the castle
  ok(await t.ev('__w.seed') !== 0 && await t.ev('__w.seed === __w.Q.mapSeed()'), 'world rebuilt for the new island');
  ok(await sig() !== forest0, 'the forest is laid out differently'); ok(await dorp() === dorp0, 'the village is the same');
  ok(await t.ev(`__w.Q.hasTool('schaar') && __w.Q.hasTool('hamer') && __w.tools.info().lying.length === 0`), 'tools are kept');
  ok(await t.ev(`__w.M.obstacles.filter(o=>o.gate).every(o=>__w.M.block[__w.M.I(o.x,o.z)]===3)`), 'gates have grown back');
  ok(await t.ev(`document.querySelectorAll('#labels .blabel').length`) === 0 && await t.ev(`document.querySelectorAll('#who .who').length`) === 2 && await t.ev(`document.querySelectorAll('#b-jump').length`) === 1, 'no doubled labels or buttons');
  const egg = JSON.parse(await t.ev('JSON.stringify(__w.extras.info().egg)')); ok(!!egg, 'a new egg is hidden');
  await t.ev('__w.placeAt(25.5,8.5)'); await settle(800); const [gx, gz] = JSON.parse(await t.ev(`JSON.stringify([[33,8],[33,7],[34,8],[34,7],[35,8]].find(([x,z])=>__w.walkable(x,z)))`)); await t.ev(`__w.walkTo(${gx},${gz})`); for (let i = 0; i < 60; i++) { await t.sleep(500); if (!(await t.ev('__w.info().path'))) break; } await settle(800);
  await t.ev(`__w.walkTo(${gx},${gz})`); for (let i = 0; i < 60; i++) { await t.sleep(500); if (!(await t.ev('__w.info().path'))) break; }
  ok(await t.ev('__w.kid.pos.x') > 32, 'with the shears the regrown brambles are cut on the way ' + JSON.stringify(await t.ev('__w.info()')) + ' gate ' + await t.ev('__w.M.block[__w.M.I(28,8)]')); await shot('14-new-island');
  await t.ev(`document.querySelector('#b-map').click()`); await settle(600); await shot('15-new-map'); await t.ev(`document.querySelector('#modal [data-close]').click()`);
  ok(!t.logs.some(l => /EXC|Error/.test(l)), 'no page errors');
  console.log(fail ? 'FAILED ' + fail : 'CYCLE OK');
}
