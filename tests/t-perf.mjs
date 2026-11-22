// node cdp.mjs tests/t-perf.mjs — draw calls / triangles per frame at a few spots (keep calls well under ~400 for tablets)
export default async function (t) {
  await t.go('http://127.0.0.1:8765/dev.html?go&debug');
  for (const [n, x, z] of [['dorp', 14.5, 15.5], ['bos', 48.5, 14.5], ['strand', 15.5, 39.5], ['kasteel', 54.5, 36.5], ['wei', 16.5, 29.5]]) {
    await t.ev(`__w.placeAt(${x},${z})`); await t.sleep(1200);
    const r = await t.ev(`new Promise(res=>{const i=__w.renderer.info; i.autoReset=false; i.reset(); requestAnimationFrame(()=>requestAnimationFrame(()=>{const o={calls:i.render.calls,tris:i.render.triangles}; i.autoReset=true; res(JSON.stringify(o))}))})`);
    console.log(n, r);
  }
}
