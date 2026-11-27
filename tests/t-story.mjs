// The sheet of the cut-paper cards of the story (paper/story.html): PORT=9999 SERVE=8766 node cdp.mjs tests/t-story.mjs
// -> tmp-shots/w-story.png (the whole sheet), w-story-<name>.png (one row, twice as big; a small thing on its own, six times as big), w-story-phone.png (the phone strip, four times as big),
//    w-story-small.png (every frame at phone size, three times as big), w-story-marks.png (the witch with the points the world needs ringed: the bowl of her spoon, her open hand, her feet)
// It draws, every frame has a name and is its own drawing, nothing comes within 6 units of the edge of a card, and the witch's spoon and open hand are where STORY says.
// ONLY=heks,ster clips just those rows.
export default async function (t) {
  const fs = await import('node:fs'); fs.mkdirSync('tmp-shots', { recursive: true });
  const url = `http://127.0.0.1:${process.env.SERVE || 8765}/paper/story.html`;
  await t.send('Emulation.setDeviceMetricsOverride', { width: 1500, height: 2000, deviceScaleFactor: 1, mobile: false });
  await t.go(url);
  for (let i = 0; i < 60 && !(await t.ev('!!window.__ready')); i++) await t.sleep(300);
  const ok = (c, m) => console.log((c ? 'ok   ' : 'FAIL ') + m);
  ok(await t.ev('!!window.__ready'), 'the sheet draws');
  const bad = await t.ev('window.__bad') || ['no checks ran'];
  ok(!bad.length, bad.length ? bad.slice(0, 12).join('; ') : 'nothing is cut off or near an edge, every frame is its own drawing and has a name, the spoon and the hand are where the card says');
  console.log('     empty units between card and canvas edge, left top right bottom (the card itself is 5): ' + JSON.stringify(await t.ev('window.__room')));
  // the whole sheet in one picture
  const h = await t.ev('document.documentElement.scrollHeight');
  await t.send('Emulation.setDeviceMetricsOverride', { width: 1500, height: Math.max(2000, h), deviceScaleFactor: 1, mobile: false });
  await t.sleep(300); await t.shot('tmp-shots/w-story.png');
  // one row at a time and the phone strip, enlarged, to judge the drawings
  const clip = async (sel, file, scale) => {
    const r = await t.ev(`(() => { const e = document.querySelector('${sel}'); if (!e) return null; const b = e.getBoundingClientRect(), w = Math.max(...[...e.querySelectorAll('canvas, span')].map(c => c.getBoundingClientRect().right)) + 24; return [b.left, b.top + scrollY, w - b.left, b.height]; })()`);
    if (!r) return;
    const s = await t.send('Page.captureScreenshot', { format: 'png', clip: { x: r[0], y: r[1], width: Math.min(r[2], 1500), height: r[3] + 8, scale } });
    fs.writeFileSync(file, Buffer.from(s.result.data, 'base64'));
  };
  const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
  for (const k of await t.ev('[...document.querySelectorAll("#sheet .row")].map(e => e.id.slice(4))')) if (!only || only.includes(k)) {
    // a small thing is clipped without Anna and six times as big
    const fr = await t.ev(`(() => { const b = [...document.querySelectorAll('#row-${k} .fr')].map(e => e.getBoundingClientRect()); return [Math.min(...b.map(r => r.left)) - 12, Math.min(...b.map(r => r.top)) + scrollY - 12, Math.max(...b.map(r => r.right)) + 12, Math.max(...b.map(r => r.bottom)) + scrollY + 6]; })()`);
    if (fr[3] - fr[1] > 130) { await clip('#row-' + k, `tmp-shots/w-story-${k}.png`, 2); continue; }
    const s = await t.send('Page.captureScreenshot', { format: 'png', clip: { x: fr[0], y: fr[1], width: fr[2] - fr[0], height: fr[3] - fr[1], scale: 6 } });
    fs.writeFileSync(`tmp-shots/w-story-${k}.png`, Buffer.from(s.result.data, 'base64'));
  }
  await clip('#phone', 'tmp-shots/w-story-phone.png', 4);
  // every frame at phone size (a third of the sheet's), enlarged: does each pose still read as its own?
  await t.ev('document.querySelectorAll("#sheet canvas").forEach(c => { c.style.width = parseFloat(c.style.width) / 3 + "px"; c.style.height = parseFloat(c.style.height) / 3 + "px"; })');
  await t.sleep(200); await clip('#kaarten', 'tmp-shots/w-story-small.png', 3);
  // the witch with the points the world needs ringed
  await t.go(url + '?marks');
  for (let i = 0; i < 60 && !(await t.ev('!!window.__ready')); i++) await t.sleep(300);
  await clip('#row-heks', 'tmp-shots/w-story-marks.png', 2);
}
