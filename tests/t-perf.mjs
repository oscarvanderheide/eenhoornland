// node cdp.mjs tests/t-perf.mjs — draw calls / triangles per frame at a few spots (keep calls well under ~400 for tablets)
export default async function (t) {
  await t.go('http://127.0.0.1:8765/dev.html?go&debug');
  for (const [n, x, z] of [['dorp', 31.5, 44.5], ['bos', 31.5, 13.5], ['wei', 64.5, 45.5], ['strand', 62.5, 67.5], ['eiland', 19.5, 70.5], ['kasteel', 84.5, 13.5]]) {
    await t.ev(`__w.placeAt(${x},${z})`); await t.sleep(1200);
    const r = await t.ev(`new Promise(res=>{const i=__w.renderer.info; i.autoReset=false; i.reset(); requestAnimationFrame(()=>requestAnimationFrame(()=>{const o={calls:i.render.calls,tris:i.render.triangles}; i.autoReset=true; res(JSON.stringify(o))}))})`);
    console.log(n, r);
  }
}
