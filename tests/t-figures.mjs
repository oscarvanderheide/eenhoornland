// The sheet of cut-paper figures (paper/figures.html): node cdp.mjs tests/t-figures.mjs -> tmp-shots/p-figures.png (the whole sheet)
// It draws, every piece the stall sells shows on both sisters in every view, every pose is its own drawing, and
// nothing is cut off by the edge of a card.
export default async function (t) {
  const fs = await import('node:fs'); fs.mkdirSync('tmp-shots', { recursive: true });
  await t.send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 760, deviceScaleFactor: 1, mobile: false });
  await t.go(`http://127.0.0.1:${process.env.SERVE || 8765}/paper/figures.html`);
  for (let i = 0; i < 60 && !(await t.ev('!!window.__ready')); i++) await t.sleep(300);
  const ok = (c, m) => console.log((c ? 'ok   ' : 'FAIL ') + m);
  ok(await t.ev('!!window.__ready'), 'the sheet draws');
  const bad = await t.ev('window.__bad') || ['no checks ran'];
  ok(!bad.length, bad.length ? bad.slice(0, 12).join('; ') : 'every piece shows in every view, every pose is its own, nothing is cut off');
  await t.shot('tmp-shots/p-figures.png');
  const h = await t.ev('document.documentElement.scrollHeight');
  await t.send('Emulation.setDeviceMetricsOverride', { width: 1400, height: h, deviceScaleFactor: 1, mobile: false });
  await t.sleep(300); await t.shot('tmp-shots/p-figures-all.png');
}
