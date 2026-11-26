// The sheet of cut-paper animals and things (paper/animals.html): PORT=9555 SERVE=8766 node cdp.mjs tests/t-animals.mjs
// -> tmp-shots/a-animals.png (the whole sheet), a-animals-<name>.png (one row, twice as big), a-animals-phone.png (the phone strip, four times as big),
//    a-animals-small.png and a-animals-small-dingen.png (every frame at phone size, three times as big: the animals, the things)
// It draws, every frame has a name and is its own drawing, and nothing is cut off by the edge of a card.
export default async function (t) {
  const fs = await import('node:fs'); fs.mkdirSync('tmp-shots', { recursive: true });
  await t.send('Emulation.setDeviceMetricsOverride', { width: 1500, height: 2000, deviceScaleFactor: 1, mobile: false });
  await t.go(`http://127.0.0.1:${process.env.SERVE || 8765}/paper/animals.html`);
  for (let i = 0; i < 60 && !(await t.ev('!!window.__ready')); i++) await t.sleep(300);
  const ok = (c, m) => console.log((c ? 'ok   ' : 'FAIL ') + m);
  ok(await t.ev('!!window.__ready'), 'the sheet draws');
  const bad = await t.ev('window.__bad') || ['no checks ran'];
  ok(!bad.length, bad.length ? bad.slice(0, 12).join('; ') : 'nothing is cut off, every frame is its own drawing');
  console.log('     empty units between card and canvas edge, left top right bottom (the card itself is 5): ' + JSON.stringify(await t.ev('window.__room')));
  // the whole sheet in one picture
  const h = await t.ev('document.documentElement.scrollHeight');
  await t.send('Emulation.setDeviceMetricsOverride', { width: 1500, height: Math.max(2000, h), deviceScaleFactor: 1, mobile: false });
  await t.sleep(300); await t.shot('tmp-shots/a-animals.png');
  // one row at a time and the phone strip, enlarged, to judge the drawings (ONLY=hond,kip for a few)
  const clip = async (sel, file, scale) => {
    const r = await t.ev(`(() => { const e = document.querySelector('${sel}'); if (!e) return null; const b = e.getBoundingClientRect(), w = Math.max(...[...e.children].map(c => c.getBoundingClientRect().right)) + 24; return [b.left, b.top + scrollY, w - b.left, b.height]; })()`);
    if (!r) return;
    const s = await t.send('Page.captureScreenshot', { format: 'png', clip: { x: r[0], y: r[1], width: Math.min(r[2], 1500), height: r[3] + 8, scale } });
    fs.writeFileSync(file, Buffer.from(s.result.data, 'base64'));
  };
  const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
  for (const k of await t.ev('[...document.querySelectorAll("#sheet .row")].map(e => e.id.slice(4))')) if (!only || only.includes(k)) await clip('#row-' + k, `tmp-shots/a-animals-${k}.png`, 2);
  await clip('#phone', 'tmp-shots/a-animals-phone.png', 4);
  // every frame at phone size (a third of the sheet's), enlarged: does each pose still read as its own?
  await t.ev('document.querySelectorAll("#sheet canvas").forEach(c => { c.style.width = parseFloat(c.style.width) / 3 + "px"; c.style.height = parseFloat(c.style.height) / 3 + "px"; })');
  await t.sleep(200); await clip('#dieren', 'tmp-shots/a-animals-small.png', 3); await clip('#dingen', 'tmp-shots/a-animals-small-dingen.png', 3);
}
