// node cdp.mjs tests/t-bed.mjs — bedroom at every stage (STAGE=ei,baby,vriend,feest) + phone layout numbers
export default async function (t) {
  await t.go('http://127.0.0.1:8765/dev.html?go&debug');
  for (const st of (process.env.STAGE || 'ei,baby,feest').split(',')) {
    await t.ev(`__w.Q._reset({stage:'${st}', kind:'zee', zone:'strand'}); 0`);
    if (st !== 'ei') await t.ev(`Object.assign(__w.Q.quest, {}), Object.assign(JSON.parse('{}'), {}), (()=>{const s=__w.Q; })()`);
    await t.ev(`(()=>{const b=__w.BUILDINGS.find(b=>b.id==='huisje'); __w.placeAt(b.door[0]+.5,b.door[1]+.5); __w.walkTo(b.door[0],b.door[1],b)})()`); await t.sleep(2500);
    await t.shot(`tmp-shots/bed-${st}-0.png`);
    await t.ev(`document.querySelector('.act-huisje .tool').click()`);
    let done = false; for (let i = 0; i < 40 && !done; i++) { await t.sleep(500); done = await t.ev(`!!document.querySelector('.act-huisje .btn')`); if (i === 17) await t.shot(`tmp-shots/bed-${st}-1.png`); }
    await t.shot(`tmp-shots/bed-${st}-2.png`); console.log(st, 'morning', done, await t.ev('__w.Q.quest.stage'));
    await t.ev(`document.querySelector('#act-close').click()`); await t.sleep(1500);
  }
  await t.sleep(1500);
  console.log('render', await t.ev('JSON.stringify(__w.renderer.info.render)'), 'mem', await t.ev('JSON.stringify(__w.renderer.info.memory)'));
}
