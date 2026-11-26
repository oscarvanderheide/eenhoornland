// What costs what, at a given screen: the village's frames a second at her door and on the east bridge, with each switch.
//   SERVE=8766 W=1512 H=860 X=2 node cdp.mjs tests/t-paper-cost.mjs        (default: a laptop's browser window at x2)
// It only reports; a headless browser on this machine is not Oscar's own browser, so read the differences, not the numbers.
export default async function (t) {
  const port = process.env.SERVE || 8765, W = +(process.env.W || 1512), H = +(process.env.H || 860), X = +(process.env.X || 2);
  await t.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: X, mobile: false });
  console.log(`screen ${W} x ${H} at x${X}: ${(W * H * X * X / 1e6).toFixed(1)} million pixels`);
  for (const q of (process.env.Q || ',&dof=0,&shadows=0,&dof=0&shadows=0,&post=0,&dpr=1').split(',')) {
    await t.go(`http://127.0.0.1:${port}/paper/?set=dorp&fps${q}`); for (let i = 0; i < 20 && !(await t.ev('!!window.__p')); i++) await t.sleep(500);
    await t.sleep(4200); const door = await t.ev('__p.stats()');
    await t.ev('__p.placeAt(10.2, 2.4)'); await t.sleep(5200); const bridge = await t.ev('__p.stats()');
    console.log(`${(q || 'everything on').padEnd(22)} door ${door.fps.toFixed(0).padStart(3)}  bridge ${bridge.fps.toFixed(0).padStart(3)}  (${bridge.calls} draws, ${(bridge.px / 1e6 || 0).toFixed(1)} million pixels drawn)`);
  }
}
