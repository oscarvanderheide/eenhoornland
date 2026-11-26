# Eenhoornland 2.0: the paper game

The whole game rebuilt as a handmade paper diorama, with cameras that change to give a sense of scale. The pixel game (1.x, `index.html` + `js/`) stays playable and untouched until 2.0 takes over.

Read this before any work under `paper/`. Status at the bottom.

## Decided

| What | Decision | By |
|---|---|---|
| World | Every island is a **hand-built set**, not a re-skin of the tile map | Oscar, 2026-11-26 |
| Scenes | No 2D side-view scenes. Big moments happen in the world with a camera move | Oscar, 2026-11-26 |
| Opening | The girls in bed in the house, dreaming of the egg, then waking up | Oscar, 2026-11-26 |
| Figures | Simple cut-paper shapes on a white backing card, dot eyes, ponytails with bows | Oscar, 2026-11-26 |
| New world each cycle | Gone (a hand-built set cannot be reshuffled). A cycle changes where the egg lies, the egg kind and the weather | follows from "hand-built sets" |

Still Claude's picks, not yet confirmed by Oscar:

| What | Pick | Why |
|---|---|---|
| Camera | Smooth moves that never turn far from north; hard cuts only at doors | "Up" on the stick must always mean away from us; a cut mid-walk flips the controls |
| House games | Houses are walk-in rooms first; bakery, funfair, atelier and stable games come last | They touch neither the map nor the adventure |
| Saves | 2.0 keeps its own saves and starts fresh | 1.x stays playable beside it; positions cannot carry over anyway |
| Set size | Smaller and denser than the tile islands (start the village at about 60% of its old footprint, on two or three levels) | The paper island works because everything is close together |
| Figure poses | A jointed rig (separate paper parts with pivots) instead of redrawing every frame | Outfits and new poses then cost little; the walk is already drawn from one parameter |

## What carries over, what does not

- **Carries over as-is** (checked: no imports from the map or the pixel art): `js/state.js`, `js/audio.js`, `js/gamepad.js` (it presses the on-screen buttons by id, so 2.0 keeps those ids).
- **Carries over with small changes:** `js/quest.js` (stages, tools, coins, outfits owned). `mapSeed()` goes; `q.zone` and `q.spot` then pick one of the egg spots a set offers; its `rng` import moves out of `js/pixel.js`. `js/saves.js` keeps its rules but draws its pictures with pixel art today, so those are redrawn.
- **Every set must offer** egg spots (the egg of a cycle lies in bos, wei, strand, eiland or dorp, by kind), the meadow a spot for each kind's warm thing, and the rainbow island each kind's food on the tree (`Q.KINDS`, `Q.WARM`, `Q.FOOD`: five kinds).
- **Rebuilt with the old file as the spec:** every `js/world-*.js`. Drawing and tile rules are woven together in them, so they cannot be reused by swapping the renderer.
- **Redrawn:** all art. Paper has 6 figures today; the game has 2 girls with 11 outfits, 18 animals with their own acts, the unicorn family and each island's plants and props.
- **Design rules stay:** everything in the project skill's "Rules of the game design" (no text, no fail states, the world waits for the child, one toy per island, one rule per thing for every input, coins only).

## The three risks the first test piece must answer

1. **Frame rate on the phone** with shadows, paper grain and soft focus on a set many times the size of the test island.
2. **Camera changes against steady controls.** Stick and hold-to-steer must not flip when the view changes.
3. **Figure size when the camera pulls back.** She is already small on a phone at the test island's distance (roughly 50 px tall, read off one screenshot, not measured); a wide shot makes her and every tap target smaller. Measure it in the test piece.

Two smaller questions for the same piece:

- How big a set can be before it stops feeling handmade.
- Whether a hand-built set can sit on the old tile coordinates, so the `MAP.*` spots and the old tests' positions keep their meaning. The set-size pick above points to no; try it on the village before giving it up, because a yes would save rewriting 30 of the 33 browser tests.

## Order of work

1. **The list below, marked by Oscar.** It is the spec.
2. **Figures, with outfit layers.** Body, hair, dress, head, neck, hand and back pieces are separate paper parts from the start (the stall sells exactly those five slots). Poses come from a rig, not from redrawing each frame. Judged on the figure sheet (`paper/figures.html`).
3. **The test piece ("the morning"):** bedroom, out the door, the village at real size, one bridge, one cave room, the swing, the dog, the sword pulled from its stone. Judged on Oscar's phone.
4. **The kit, pulled out of the test piece and then frozen:**
   - paper materials and card building blocks (slab, card, cut edge, printed paper);
   - the figure rig, views and outfit layers;
   - a set as data (ground shapes with heights, solids, things, exits, camera zones, light);
   - the camera director; input (tap, hold, stick, controller: one rule);
   - a test handle like `__w` (`placeAt`, `walkTo`, `tap`, `info`) and a page that shows any one set alone;
   - style rules written into the project skill (palette, card thickness, door height against a figure, frame rates).
5. **One island at a time, in adventure order:** dorp, bos + cave, wei + waterfall cave, strand + sea, eiland, kasteel + garden + the ending. Each goes:
   1. grey-card blockout with its camera shots (Oscar judges composition and scale before any art);
   2. dressing;
   3. its toys and animals;
   4. tests and phone screenshots;
   5. Oscar and the girls play it.
6. **Everything marked "later" below**, then 2.0 becomes the front page and the pixel game moves to its own address.

## Who does what

- **Main session:** steps 1 to 4, and every change to the kit afterwards.
- **One session per island** from step 5, each with this file, the kit's style rules, its rows of the list and the old `js/` files as the spec. An island session never edits the kit; it asks the main session.
- **A figure workshop session** in parallel from step 5: animals and outfits on the figure sheet.
- **Oscar:** the gate at every blockout and every finished island. Tests show that it works, not that it is wonderful.

## The list

Verdicts: **keep** (same idea, built in paper), **redesign** (the idea stays, the form changes), **later** (after the adventure plays through), **cut**. "Spine" means the adventure cannot be finished without it.

Oscar: change any verdict; an empty "Oscar" cell means agreed.

### The whole game

| Thing | Verdict | In paper | Oscar |
|---|---|---|---|
| The adventure's stages, tools, gates | keep (spine) | Gates sit on the links between sets | |
| Two sisters, switched by their faces | keep | | |
| Tap to walk, hold to steer, stick, controller, the four buttons | keep | Same rules; buttons redrawn as paper | |
| Action button showing the nearest thing | keep | | |
| Picture bubbles | keep | Small paper cards | |
| Coins and the stall's outfits | keep | Paper-doll clothes | |
| Day, evening, bedtime | keep | The paper island already has it | |
| Jumping, tops to stand on | keep | Sets have real levels and steps | |
| Carrying and throwing animals | keep | | |
| Riding the unicorn | keep (spine) | | |
| Three saves | keep | Own saves for 2.0 | |
| New world each cycle | cut | Egg place, egg kind and weather change instead | |
| The map screen | cut | Nothing opens it today | |
| Big stones to lift (about 200 along the shores) | redesign | Three or four per island, placed by hand | |
| Sword cuts grass and flowers | redesign | Hand-placed patches of paper tufts, far fewer | |
| Swimming along every shore | redesign, later | Only at marked beaches, between the first wave rows | |
| Flying | redesign, later | A high, wide shot of all the islands as tiny models; she picks where to land | |
| Weather (rain, autumn, snow) | later | Paper leaves, confetti snow, rain on threads | |
| Old unicorns' five powers | later | | |
| Bike with trailer | later | | |
| A tool becomes hers: it flies up, she holds it over her head, rays, fanfare | keep (spine) | A close shot | |
| Her egg or unicorn following her, and waiting while she plays | keep (spine) | | |
| Coins lying around, in chests and bottles | keep | Placed by hand per set, back every day | |
| Logs and puddles she jumps over | keep | A few per set | |
| Trees, bushes and props that shake when tapped (leaves, an apple she eats, a startled bird) | keep | Every set's trees answer a tap | |
| Birds that fly up, butterflies that follow, fish that jump | redesign | One of these per set at most: the world waits for her | |
| Rare jokes (a nut on her head, a nap after three throws, a twirl, the unicorn's burp) | later | | |
| An old unicorn from the pen walking along for a day | later | Comes with the powers | |

### Opening

| Thing | Verdict | In paper | Oscar |
|---|---|---|---|
| Start screen | redesign | Two paper dolls to pick from | |
| The dream | redesign (spine) | In bed in the house; the egg appears above the bed; she wakes | |
| Waking at the front door | redesign | She gets up and walks out of the bedroom | |

### Dorp (the village)

| Thing | Verdict | In paper | Oscar |
|---|---|---|---|
| The girls' bedroom, going to bed | redesign (spine) | A walk-in room with a close camera | |
| Sword in its stone | keep (spine) | The pull is a close-up in the world, same tapping | |
| The pen where the unicorn lives afterwards | keep (spine) | | |
| Swing and slide | keep | The swing first: it is the proven hit | |
| Watering can and flower pots | keep | | |
| The stall | keep | | |
| Fountain (splash, wishing pebble) | keep | | |
| Duck pond, benches, ducks | keep | | |
| Dog (rolls, digs, fetches) and chicken (egg, chick) | keep | | |
| Mud pool and the pig to wash | keep | | |
| Balls | keep | With the dog | |
| Scarecrow and the carrot patch | keep | Dressing that answers a tap | |
| Lanterns | keep | They light up in the evening, like the house lamp on the test island | |
| The unicorn race | later, redesign | A run along a path, seen from above and behind | |

### Bos (the forest)

| Thing | Verdict | In paper | Oscar |
|---|---|---|---|
| The cave: two rooms, the crate, the egg | keep (spine) | Close camera | |
| Brambles on the bridge | keep (spine) | | |
| Treehouse: telescope, acorns, hammock | keep | The telescope cuts to wide shots of other islands | |
| Zipline to the village | keep | A wide shot: a moment of scale | |
| Hide and seek in the bushes | keep | | |
| Hedgehog, owl, squirrel | keep | | |
| The clearing, the orchard, the nook | keep | Dressing: places for the egg and the apples | |
| The atelier (sticker maker) | later | | |

### Wei (the meadow)

| Thing | Verdict | In paper | Oscar |
|---|---|---|---|
| The shy star, and the hatching | redesign (spine) | Catching stays; the hatching happens in the meadow with a camera push-in | |
| Waterfall cave: crystals, buttons, switches, the hookshot | keep (spine) | Three close shots | |
| Waterfall and singing stepping stones | keep | Falling paper strips | |
| Kite and dandelions | keep | | |
| The cricket's fiddle and the log bench | keep | | |
| Sheep, deer, otter | keep | | |
| The bakery | later | | |

### Strand (the beach) and the sea

| Thing | Verdict | In paper | Oscar |
|---|---|---|---|
| The gap in the bridge (hookshot) | keep (spine) | | |
| The boat to the rainbow island | redesign (spine) | A wide shot with a tiny boat; she still steers; a much smaller sea | |
| Sailing round the lagoon for fun | later | | |
| Bucket, sand towers, shovel | keep | | |
| Fishing at the pier | keep | | |
| The little islands with hook posts | keep | | |
| Turtle nest | keep | | |
| Crab and gull | keep | | |
| At sea: lighthouse, whale, singing jellyfish, dolphins | keep | Four things, each answering a tap | |
| At sea: seals, the fishing bear, the turtle, floating chests, the palm islet | later | Fewer things, each richer | |
| The funfair tent | later | | |

### Eiland (the rainbow island)

| Thing | Verdict | In paper | Oscar |
|---|---|---|---|
| Rainbow tree and fruit, and the feeding | redesign (spine) | Shaking stays; the feeding and first ride happen under the tree | |
| Paint puddles and footprints | keep | Paint on paper | |
| Bouncy mushrooms | keep | | |
| Flamingo lagoon | keep | | |
| Rabbit and parrot | keep | | |

### Kasteel (the castle)

| Thing | Verdict | In paper | Oscar |
|---|---|---|---|
| The hole in the bridge (jumped while riding) | keep (spine) | | |
| Castle hall and the golden door | keep (spine) | | |
| The garden: six flowers, the rainbow, her family, the walk home | redesign (spine) | A walk-in set; the rainbow rises over the whole castle in a wide shot | |
| Carousel | keep | | |
| Faces at the castle windows | keep | | |
| Peacock and little dragon | keep | | |
| Treasure room | later | | |
| The stable (feed, wash, brush, recolour) | later | | |

### Only reached with an old unicorn's power

| Thing | Verdict | In paper | Oscar |
|---|---|---|---|
| Under the sea | later, redesign | A shadow-box set with depth, not a flat side view | |
| Up in the clouds | later, redesign | Clouds on threads | |

## Figures to draw

Each girl and unicorn needs a side, front and back view.

- **Anna and Fenna:** stand, walk, sit, arms up (a tool is hers), carrying overhead, riding, swimming, asleep, climbing. Eleven outfit pieces in five slots.
- **Unicorns:** the egg (per kind), the baby, the friend she rides (with wings), the mama, the old unicorns.
- **Animals, by island:** dog, chicken and chick, ducks, pig; hedgehog, owl, squirrel; sheep, deer, cricket, otter; crab, gull, turtle and babies; rabbit, parrot, flamingo; peacock, dragon; whale, dolphins, jellyfish.

## Status

- 2026-11-26: plan written, and the list checked against every `js/world-*.js`, `js/act-*.js` and the named places in `js/map.js`; the list waits for Oscar's marks. The test island and figure sheet exist (`paper/index.html`, `paper/figures.html`; `node cdp.mjs tests/t-paper.mjs`).
