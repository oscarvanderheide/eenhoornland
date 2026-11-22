// node tests/map.test.mjs  — checks the island data: everything a child can be sent to must be reachable.
import * as M from '../js/map.js';
const solids = [[3, 3, 7, 6], [21, 3, 25, 6], [3, 12, 7, 15], [21, 11, 25, 15], [12, 2, 16, 5]];
const keep = [[5, 7], [23, 7], [5, 16], [23, 16], [14, 6], [54, 33]];
const m = M.buildMap({ solids, keep });
let fail = 0; const ok = (c, msg) => { if (!c) { fail++; console.log('FAIL', msg); } };
const ch = { 0: '.', 1: ':', 2: '~', 3: '=', 4: ',', 5: '~', 6: '"', 7: '#', 8: '-', 9: '_' };
const tree = new Map(m.trees.map(t => [m.I(t.x, t.z), t.kind[0].toUpperCase()]));
const mark = new Map(); for (const [k, v] of Object.entries(m.spawns)) for (const [x, z] of v) mark.set(m.I(x, z), k[0]);
for (const v of Object.values(m.eggSpots)) for (const [x, z] of v) mark.set(m.I(x, z), '0');
if (process.argv.includes('-v')) for (let z = 0; z < M.H; z++) { let s = ''; for (let x = 0; x < M.W; x++) { const i = m.I(x, z); s += mark.get(i) || tree.get(i) || (m.block[i] && m.ground[i] !== 5 && m.ground[i] !== 2 ? 'X' : ch[m.ground[i]]); } console.log(s); }
for (const [k, v] of Object.entries(m.spawns)) { console.log(k, v.length); ok(v.length >= 8, k + ' has too few spots'); for (const [x, z] of v) ok(m.reach[m.I(x, z)] && !m.block[m.I(x, z)], k + ' spot unreachable ' + x + ',' + z); }
for (const [k, v] of Object.entries(m.eggSpots)) { console.log('egg', k, v.length); ok(v.length >= 3, 'egg ' + k + ' too few'); for (const [x, z] of v) ok(m.reach[m.I(x, z)], 'egg spot unreachable ' + k + x + ',' + z); }
for (const [x, z] of keep) ok(m.reach[m.I(x, z)], 'door unreachable ' + x + ',' + z);
for (const [k, p] of Object.entries(M.PLACES)) ok(m.reach[m.I(...p.tile)], 'place unreachable ' + k);
for (const g of M.PEN.gate) ok(m.reach[m.I(...g)], 'gate blocked');
ok(m.reach[m.I(22, 28)], 'pen interior unreachable'); ok(m.reach[m.I(30, 45)], 'pier end unreachable');
let un = 0; for (let i = 0; i < m.block.length; i++) if (!m.block[i] && !m.reach[i]) un++; ok(un === 0, un + ' walkable-but-unreachable tiles');
console.log('trees', m.trees.length, fail ? 'FAILED ' + fail : 'ALL OK'); process.exit(fail ? 1 : 0);
