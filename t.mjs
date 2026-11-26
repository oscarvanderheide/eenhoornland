// The test runner: only what belongs to the island you are working on, several tests side by side.
//   node t.mjs strand            everything about the beach (toy, animals, fishing, a screenshot)
//   node t.mjs dorp bos          two islands
//   node t.mjs look kasteel wei  only screenshots of those islands (tmp-shots/<island>.png)
//   node t.mjs adventure         the whole adventure; also: gamepad saves jump life pickup powers weather houses bed castle perf zee
//   node t.mjs all               everything
// The unit tests (map + quest, a second) always run first. Starts the dev server if it is not running.
import { spawn, spawnSync } from 'node:child_process';
import net from 'node:net';

const ISLANDS = {
  dorp: [['t-toys', 'dorp,fiets'], ['t-ways', 'dorp'], ['t-varken'], ['t-bank'], ['t-speeltuin'], ['t-areas', 'dorp']],
  bos: [['t-toys', 'bos'], ['t-ways', 'bos'], ['t-boomhut'], ['t-areas', 'bos']],
  wei: [['t-toys', 'wei'], ['t-ways', 'wei'], ['t-castle', 'wei'], ['t-waterval'], ['t-areas', 'wei']],
  strand: [['t-toys', 'strand,vissen'], ['t-ways', 'strand'], ['t-schildpad'], ['t-areas', 'strand']],
  eiland: [['t-toys', 'eiland'], ['t-ways', 'eiland'], ['t-eiland'], ['t-areas', 'eiland']],
  kasteel: [['t-toys', 'kasteel'], ['t-ways', 'kasteel'], ['t-castle', 'kasteel,race'], ['t-draaimolen'], ['t-areas', 'kasteel']],
  zee: [['t-toys', 'boot'], ['t-ways', 'zee'], ['t-swim']],
};
const WHOLE = { adventure: 't-adventure', gamepad: 't-gamepad', life: 't-life', pickup: 't-pickup', powers: 't-powers', weather: 't-weather', houses: 't-houses', bed: 't-bed', castle: 't-castle', perf: 't-perf', areas: 't-areas', toys: 't-toys', ways: 't-ways', jump: 't-jump', fly: 't-fly', swim: 't-swim', boomhut: 't-boomhut', waterval: 't-waterval', eiland: 't-eiland', schildpad: 't-schildpad', varken: 't-varken', bank: 't-bank', speeltuin: 't-speeltuin', draaimolen: 't-draaimolen', saves: 't-saves', sword: 't-sword', keien: 't-keien', haak: 't-haak', muziek: 't-muziek' };
const PARALLEL = 3;

const args = process.argv.slice(2); if (!args.length) { console.log('usage: node t.mjs <island|look|adventure|all ...>   islands: ' + Object.keys(ISLANDS).join(' ')); process.exit(1); }
const jobs = [];
if (args[0] === 'look') jobs.push(['t-areas', args.slice(1).join(',') || undefined]);
else if (args[0] === 'all') for (const f of Object.values(WHOLE)) { if (f !== 't-perf' && f !== 't-areas') jobs.push([f]); }
else for (const a of args) { if (ISLANDS[a]) jobs.push(...ISLANDS[a]); else if (WHOLE[a]) jobs.push([WHOLE[a]]); else { console.log('unknown: ' + a); process.exit(1); } }

// the dev server
const up = await new Promise(r => { const s = net.connect(8765, '127.0.0.1', () => { s.end(); r(true); }); s.on('error', () => r(false)); });
if (!up) { spawn('python3', ['serve.py'], { detached: true, stdio: 'ignore' }).unref(); await new Promise(r => setTimeout(r, 800)); console.log('(started the dev server on :8765)'); }
spawnSync('python3', ['build-dev.py'], { stdio: 'ignore' });

let fails = 0;
for (const u of ['map.test.mjs', 'quest.test.mjs']) { const r = spawnSync('node', ['tests/' + u], { encoding: 'utf8' }); if (!/ALL OK/.test(r.stdout)) { fails++; console.log('FAIL ' + u + '\n' + r.stdout.split('\n').filter(l => /FAIL/.test(l)).join('\n')); } }
console.log(fails ? '' : 'unit tests ok');

const t0 = Date.now();
function run([file, only], k) {
  return new Promise(res => {
    const t1 = Date.now(), env = { ...process.env, PORT: String(9400 + k) }; if (only) env.ONLY = only;
    const p = spawn('node', ['cdp.mjs', `tests/${file}.mjs`], { env }); kids.add(p); let out = '';
    p.stdout.on('data', d => out += d); p.stderr.on('data', d => out += d);
    p.on('close', () => { kids.delete(p);
      const lines = out.split('\n'), bad = lines.filter(l => /FAIL|TEST ERROR|EXC |Error/.test(l) && !/favicon/.test(l));
      const name = file + (only ? ' [' + only + ']' : ''), secs = ((Date.now() - t1) / 1000).toFixed(0) + 's';
      if (bad.length) { fails++; console.log(`✗ ${name} ${secs}\n  ` + bad.slice(0, 12).join('\n  ')); } else console.log(`✓ ${name} ${secs}`);
      res();
    });
  });
}
const kids = new Set(); for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => { for (const p of kids) p.kill('SIGTERM'); process.exit(1); });
let next = 0; await Promise.all(Array.from({ length: Math.min(PARALLEL, jobs.length) }, async (_, w) => { while (next < jobs.length) { const k = next++; await run(jobs[k], k); } }));
console.log(`${fails ? fails + ' failed' : 'all ok'} in ${((Date.now() - t0) / 1000).toFixed(0)}s — screenshots in tmp-shots/`);
process.exit(fails ? 1 : 0);
