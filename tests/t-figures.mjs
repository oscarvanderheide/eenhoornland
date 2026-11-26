// The sheet of cut-paper figures (paper/figures.html): node cdp.mjs tests/t-figures.mjs -> tmp-shots/p-figures.png
export default async function (t) {
  const fs = await import('node:fs'); fs.mkdirSync('tmp-shots', { recursive: true });
  await t.send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 760, deviceScaleFactor: 1, mobile: false });
  await t.go(`http://127.0.0.1:${process.env.SERVE || 8765}/paper/figures.html`);
  for (let i = 0; i < 20 && !(await t.ev('!!window.__ready')); i++) await t.sleep(300);
  console.log(await t.ev('!!window.__ready') ? 'ok   the sheet draws' : 'FAIL the sheet draws');
  await t.shot('tmp-shots/p-figures.png');
}
