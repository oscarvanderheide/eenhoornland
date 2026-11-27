// The snow island: a bonus far in the north (Oscar: "a bonus area like a snow area with a santa and iglo's, penguins,
// reindeer, christmas trees, sleigh, snowball throwing"). A first plain island; set-sneeuw.js is filled in by its own round.
import { THREE, paper, slab, edgeMat } from './kit.js';
import { shore } from './props.js';
import { sneeuwLand } from './lands.js';

const H = 0;

export default {
  name: 'sneeuw',
  build(S) {
    const { SNOW } = sneeuwLand();
    shore(S, [[SNOW, H, .87, paper('#f4f7fb')]]);
    S.sea({ land: [SNOW], x0: -40, x1: 40, z0: -30, z1: 30, deep: [230, 180, 0, 0], fine: 1.8 });
    S.floor(H, SNOW, .22);
    return {
      start: [0, 6], uni: [-1, 6.4],
      shadow: { follow: 20 }, sky: 2.6,
      shots: [{ name: 'sneeuw', span: 15, tall: 8.5, rise: .32 }],
      places: { start: [0, 6] },
    };
  },
};
