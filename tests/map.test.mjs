// node tests/map.test.mjs [-v] [seed]  — checks the world data: everything a child can be sent to must be reachable,
// the adventure must be solvable in order, and that holds for every cycle's reshuffled world.
import * as M from '../js/map.js';
const solids = Object.values(M.HOUSES).map(M.houseRect);
const keep = Object.values(M.HOUSES).map(M.houseDoor).concat([M.CASTLE.door]);
const seedArg = +(process.argv.find(a => /^\d+$/.test(a)) || 0);
const m = M.buildMap({ solids, keep, seed: seedArg });
let fail = 0; const ok = (c, msg) => { if (!c) { fail++; console.log('FAIL', msg); } };
const ch = { 0: '.', 1: ':', 2: 'w', 3: '=', 4: ',', 5: ' ', 6: '"', 7: '#', 8: '-', 9: '_' };
const tree = new Map(m.trees.map(t => [m.I(t.x, t.z), t.kind[0].toUpperCase()]));
const mark = new Map(); for (const [k, v] of Object.entries(m.spawns)) for (const [x, z] of v) mark.set(m.I(x, z), k[0]);
for (const v of Object.values(m.eggSpots)) for (const [x, z] of v) mark.set(m.I(x, z), '0');
for (const o of m.obstacles) mark.set(m.I(o.x, o.z), o.type === 'low' ? '^' : o.kind === 'bramble' ? '%' : o.kind === 'gat' ? '?' : '@');
for (const s of m.starSpots) mark.set(m.I(...s), '*');
mark.set(m.I(...m.toolSpots.zwaard), '1'); mark.set(m.I(...m.toolSpots.hamer), '2');
for (const h of Object.values(M.HOUSES)) mark.set(m.I(...M.houseDoor(h)), 'D');
if (process.argv.includes('-v')) for (let z = 0; z < M.H; z++) { let s = ''; for (let x = 0; x < M.W; x++) { const i = m.I(x, z); s += mark.get(i) || tree.get(i) || (m.block[i] && m.ground[i] !== 5 && m.ground[i] !== 2 ? 'X' : ch[m.ground[i]]); } console.log(s); }
for (const [k, v] of Object.entries(m.spawns)) console.log(k, v.length);
for (const [k, v] of Object.entries(m.eggSpots)) console.log('egg', k, v.length);
console.log('obstacles', m.obstacles.length, '| gates', m.obstacles.filter(o => o.gate).map(o => o.kind + '@' + o.x + ',' + o.z).join(' '), '| tools', JSON.stringify(m.toolSpots), '| stars', JSON.stringify(m.starSpots));
for (const p of M.validate(m, keep)) ok(false, p);
ok(m.seed === seedArg, 'seed ' + seedArg + ' was skipped');
// every later cycle: the world must stay solvable, the village must not move, everything else must
const sig = (mm, zone) => mm.trees.filter(t => mm.zone[mm.I(t.x, t.z)] === zone).map(t => t.kind + t.x + ',' + t.z).join(';');
let skipped = 0, same = 0; const N = 300;
for (let s = 1; s <= N; s++) {
  const want = s * 7919 + 13, mm = M.buildMap({ solids, keep, seed: want });
  for (const p of M.validate(mm, keep)) ok(false, 'seed ' + s + ': ' + p);
  if (mm.seed !== want) skipped++;
  ok(sig(mm, 'dorp') === sig(m, 'dorp'), 'seed ' + s + ' changed the village');
  if (sig(mm, 'bos') === sig(m, 'bos')) same++;
}
ok(same === 0, same + ' seeds gave the same forest'); ok(skipped < N / 10, skipped + ' of ' + N + ' seeds had to be skipped');
console.log('trees', m.trees.length, '|', N, 'seeds checked,', skipped, 'skipped |', fail ? 'FAILED ' + fail : 'ALL OK'); process.exit(fail ? 1 : 0);
