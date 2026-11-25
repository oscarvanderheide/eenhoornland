// node cdp.mjs tests/t-castle.mjs — the old unicorns in the village, the castle garden and the race (tmp-shots/c-*.png: look at them)
import fs from 'node:fs';
export default async function (t) {
  fs.mkdirSync('tmp-shots', { recursive: true });
  let fail = 0; const ok = (c, m) => { console.log(c ? '  ok  ' : '  FAIL', m); if (!c) fail++; };
  const J = async e => JSON.parse(await t.ev(`JSON.stringify(${e})`));
  const shot = n => t.shot(`tmp-shots/c-${n}.png`), place = (x, z) => t.ev(`__w.placeAt(${x},${z})`);
  const until = async (expr, ms = 30000) => { for (let i = 0; i < ms / 400; i++) { if (await t.ev(expr)) return true; await t.sleep(400); } return false; };
  const only = process.env.ONLY ? process.env.ONLY.split(',') : null, run = n => !only || only.includes(n);
  const URL = 'http://127.0.0.1:8765/dev.html?go&debug';
  await t.go(URL); await t.ev('localStorage.clear()'); await t.go(URL);
  const herd = `[{body:'#FFC8DD',mane:'#9B72E8',horn:'#F7C548',name:'Roosje',kind:'bos'},{body:'#BFE3FF',mane:'rainbow',horn:'#D3DAE6',name:'Wolkje',kind:'zee'},{body:'#FFF0A6',mane:'#FF7EB6',horn:'#FF9EC7',name:'Zonnetje',kind:'bloem'}]`;
  await t.ev(`__w.Q._reset({ stage: 'vriend', herd: ${herd} }); __w.Q.giveTool('zwaard'); __w.Q.giveTool('hamer'); 0`); await t.sleep(800);
  // canvas taps in an activity: logical coordinates of the pixel stage
  const tap = async (x, y) => { const r = await J(`(()=>{const c=document.querySelector('.pstage canvas'),r=c.getBoundingClientRect();return {l:r.left,t:r.top,w:r.width,h:r.height,cw:c.width/2,ch:c.height/2}})()`); await t.click(r.l + x / r.cw * r.w, r.t + y / r.ch * r.h); };
  const P = await J('__w.MAP.PEN'), C = await J('__w.MAP.CASTLE'), R = await J('__w.MAP.RACE');

  if (run('wei')) {   // the unicorns of earlier adventures live next to the start
    await place(P.gate[0][0] + 1, P.z0 - 1.5); await t.sleep(2500); await shot('01-pen');
    ok((await J('__w.extras.info()')).herd === 3, 'three old unicorns live in the village');
    ok(await t.ev(`__w.walkTo(${P.x0 + 3}, ${P.z0 + 2})`) === true, 'the gate is open: she can walk in');
  }
  if (run('kasteel')) {
    await place(C.door[0] + .5, C.door[1] + 1.5); await t.ev(`__w.setMount('uni')`); await t.sleep(2500); await shot('02-castle-door');
    await t.ev(`__w.walkToBuilding('kasteel')`); ok(await until(`__w.info().pos[1] > 102`, 20000), 'riding up to the gate goes into the hall'); await t.sleep(2000); await shot('03a-hall'); await t.ev(`__w.walkTo(70, 107)`); ok(await until(`!!document.querySelector('.act-kasteel canvas')`), 'the golden door at the back leads to the garden'); await t.sleep(600); await shot('03-gate-opens'); await t.sleep(2500); await shot('04-garden');
    await tap(95, 100); ok(await until(`__w.Q.quest.blooms.length === 1`, 8000), 'a tap on a sleeping flower: the unicorn wakes it'); await t.sleep(900); await shot('05-first-colour');
    await t.ev(`document.querySelector('#act-close').click()`); await t.sleep(800); ok(await t.ev(`__w.Q.quest.stage`) === 'vriend', 'leaving halfway changes nothing');
    ok(await until(`__w.info().pos[1] > 102`, 5000), 'leaving the garden: back in the hall'); await t.sleep(1000); await t.ev(`__w.walkTo(70, 107)`); await until(`!!document.querySelector('.act-kasteel canvas')`); await t.sleep(2600); await shot('06-back-again');
    for (const i of [0, 1, 3, 4, 5]) { await tap(35 + i * 30, 100); await until(`__w.Q.quest.blooms.includes(${i}) || __w.Q.quest.stage === 'feest'`, 8000); await t.sleep(300); }
    ok(await t.ev(`__w.Q.quest.stage`) === 'feest' && await t.ev(`__w.Q.quest.herd.length`) === 4, 'six flowers awake: the rainbow is whole, that is the party'); await t.sleep(1500); await shot('07-rainbow'); await t.sleep(2500); await shot('08-party');
    await tap(35, 100); await t.sleep(400); await tap(196, 40); await t.sleep(500); await shot('09-toy');
    await tap(15, 80); await t.sleep(1500); ok(await t.ev(`!document.querySelector('.act-kasteel canvas')`), 'the golden door in the garden leads back into the hall');
    // the hall: coins on the floor and a chest
    const c0 = await t.ev(`__w.Q.quest.coins`), n0 = (await J('__w.rooms.info()')).coins; await place(62.5, 113.5); await t.sleep(1500); ok(await t.ev(`__w.Q.quest.coins`) === c0 + 1 && (await J('__w.rooms.info()')).coins === n0 - 1, 'walking over a coin picks it up');
    for (let k = 0; k < 4; k++) { await t.ev(`__w.rooms.openChest()`); await t.sleep(400); } ok(await t.ev(`__w.Q.quest.coins`) === c0 + 4, 'the chest holds three real coins a day'); await place(72.5, 111); await t.sleep(1500); await shot('09c-hall-chest');
    await place(70.5, 119.5); await t.ev(`__w.walkTo(70, 120)`); ok(await until(`__w.info().pos[1] < 20`, 20000), 'out through the door in the front wall'); await t.sleep(2500); await shot('10-outside-evening');
    ok(await t.ev(`__w.Q.bedtime() && !__w.uni.g.visible`), 'outside it is evening, she lives in the meadow now'); ok((await J('__w.extras.info()')).herd === 4, 'and stands with the others');
    await place(P.gate[0][0] + 1, P.z0 - 1.5); await t.sleep(2500); await shot('11-pen-four');
  }
  if (run('race')) {
    await t.ev(`__w.Q._reset({ stage: 'zoek' }); 0`); await place(R[0], R[1] - 1.2); await t.sleep(2000); await shot('12-arch');
    await t.ev(`__w.walkTo(30,45)`); await t.sleep(300);
    await t.ev(`__w.Q._reset({ stage: 'ei', herd: ${herd} }); 0`); await place(R[0] - 1.5, R[1] - 1); await t.sleep(1500);
    const a = await J(`__w.screen(${R[0]}, 1.5, ${R[1]} - .07)`); await t.click(a[0], a[1]);
    ok(await until(`!!document.querySelector('.act-race canvas')`, 12000), 'a tap on the arch starts the race'); await t.sleep(1200); await shot('13-pick');
    const c0 = await t.ev(`__w.Q.quest.coins`);
    await tap(120, 80); await t.sleep(3500); await shot('14-go');
    for (let k = 0; k < 150; k++) { await tap(120, 60); await t.sleep(330); if (k === 12) await shot('15-running'); if (k === 40) await shot('16-running2'); if (await t.ev(`__w.Q.quest.coins`) > c0) break; }
    ok(await t.ev(`__w.Q.quest.coins`) > c0, 'everybody reaches the finish and gets coins'); await t.sleep(3500); await shot('17-podium');
    await t.ev(`document.querySelector('#act-close').click()`); await t.sleep(1200);
  }
  console.log(fail ? 'CASTLE FAILED ' + fail : 'CASTLE OK');
}
