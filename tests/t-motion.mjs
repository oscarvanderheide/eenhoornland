// The game ignores the system's "reduce motion": with it forced on, CSS animations still run.
export default async function (t) {
  await t.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await t.go('http://localhost:8765/?debug');
  const r = await t.ev(`({ reduce: matchMedia('(prefers-reduced-motion: reduce)').matches, running: document.getAnimations().filter(a => a.playState === 'running').length })`);
  const ok = r.reduce && r.running > 0;
  console.log((ok ? 'ok  ' : 'FAIL') + ' reduce motion is on and ' + r.running + ' CSS animations run');
  if (!ok) console.log('MOTION FAILED');
}
