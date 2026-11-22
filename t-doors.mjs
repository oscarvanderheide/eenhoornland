export default async function (t) {
  await t.go('http://127.0.0.1:8765/dev.html?go&debug');
  await t.ev(`__w.Q._reset({ stage: 'baby' }); 0`); // the stal only opens once a unicorn has hatched
  const fps = await t.ev(`new Promise(r=>{let n=0;const s=performance.now();const f=()=>{n++; if(performance.now()-s<1000) requestAnimationFrame(f); else r(n)}; requestAnimationFrame(f)})`);
  console.log('fps', fps);
  // tap on the ROOF of each house (the part that used to be untappable)
  for (const id of ['stal', 'bakkerij', 'atelier', 'kermis']) {
    await t.ev(`(()=>{const a=__w.kid; const b=__w.BUILDINGS.find(b=>b.id==='${id}'); __w.placeAt(b.door[0]+.5, b.door[1]+3.5);})()`); await t.sleep(400);
    const pt = await t.ev(`(()=>{const b=__w.BUILDINGS.find(b=>b.id==='${id}'); return b.tent? __w.screen(b.cx,3,b.cz) : __w.screen(b.x+b.w/2, b.h+b.rh*.6, b.z+b.d/2)})()`);
    const onScreen = pt[0] > 0 && pt[0] < 1200 && pt[1] > 0 && pt[1] < 750;
    if (onScreen) await t.click(pt[0], pt[1]); else await t.ev(`__w.walkTo(...__w.BUILDINGS.find(b=>b.id==='${id}').door, __w.BUILDINGS.find(b=>b.id==='${id}'))`);
    await t.sleep(200); const mid = await t.ev('JSON.stringify(__w.info())');
    let open = false; for (let i = 0; i < 60 && !open; i++) { await t.sleep(500); open = await t.ev(`!document.querySelector('#act').hidden`); }
    console.log(id, onScreen ? 'roof tap' : 'label tap', mid, '-> activity open:', open);
    if (open) { await t.ev(`document.querySelector('#act-close').click()`); await t.sleep(800); console.log('   after exit', JSON.stringify(await t.ev('__w.info()'))); }
  }
  // keyboard: walk into a lantern / tree / building edge and try to get away
  await t.ev(`(()=>{const a=__w.kid; a.pos.set(11.5,0,8.5); a.path=[];})()`); await t.sleep(300);
  await t.key('ArrowDown', 1500); const p1 = await t.ev('JSON.stringify(__w.info().pos)');
  await t.key('ArrowLeft', 1500); const p2 = await t.ev('JSON.stringify(__w.info().pos)');
  await t.key('ArrowUp', 1500); const p3 = await t.ev('JSON.stringify(__w.info().pos)');
  console.log('keyboard', p1, p2, p3);
  await t.shot('t-world.png');
}
