# Eenhoornland 2.0: the paper game

The whole game rebuilt as a handmade paper diorama, with cameras that change to give a sense of scale. The pixel game (1.x, `index.html` + `js/`) stays playable and untouched until 2.0 takes over.

Read this before any work under `paper/`. Status at the bottom.

## Where the work lives

- **Branch `paper`**, in the worktree `.claude/worktrees/paper` of the repository. Oscar, 2026-11-26: the pixel game keeps existing on `main`; 2.0 is committed on its own branch. Never commit 2.0 work to `main`.
- This copy of the plan (on `paper`) is the current one; the copy on `main` stopped at the commit where the branch began.
- Serve the worktree on its own port for tests: `python3 serve.py 8766`, then `SERVE=8766 node cdp.mjs tests/t-paper.mjs` (the main checkout's server on 8765 serves the pixel game's folder).
- **Publishing (set up 2026-11-26 with Oscar's yes):** `.github/workflows/pages.yml`, the same file on `main` and on `paper`, builds the site on every push to either branch: the pixel game from `main` at the root (https://oscarvanderheide.github.io/eenhoornland/), this branch's `paper/` folder at `/paper/` (figure sheet: `/paper/figures.html`). So a push to `paper` puts it online; commit and push after the tests pass, as for the pixel game. Hidden files and folders are not published. Settings changed for this: Pages build type `workflow` (was `legacy`), and `paper` added to the branches the `github-pages` environment may deploy from. To undo: set the build type back to `legacy` with source `main` `/`. If the workflow file changes, change it on both branches.
- **Everything the paper game loads must live under `paper/`.** The site takes only this branch's `paper/` folder; `/js/` on the site is `main`'s. An import of `../js/quest.js` would pass every local test and load the pixel game's copy when live. Modules carried over from the pixel game (quest, state, saves, audio, gamepad) are copied into `paper/` and changed there.
- A push to `main` publishes only while branch `paper` exists and has `paper/index.html`: the workflow checks both and stops otherwise, leaving the site as it was.

## Decided

| What | Decision | By |
|---|---|---|
| World | Every island is a **hand-built set**, not a re-skin of the tile map | Oscar, 2026-11-26 |
| Scenes | No 2D side-view scenes. Big moments happen in the world with a camera move | Oscar, 2026-11-26 |
| Opening | The girls in bed in the house, dreaming of the egg, then waking up | Oscar, 2026-11-26 |
| Figures | Simple cut-paper shapes on a white backing card, dot eyes, ponytails with bows | Oscar, 2026-11-26 |
| New world each cycle | Gone (a hand-built set cannot be reshuffled). A cycle changes where the egg lies, the egg kind and the weather | follows from "hand-built sets" |
| The list below | Every verdict agreed as written | Oscar, 2026-11-26 |
| Figure poses | A jointed rig (separate paper parts with pivots) instead of redrawing every frame | Oscar, 2026-11-26 (on the figure sheet) |
| Carrying | She holds an animal in her arms in front of her (pose `hold`), not over her head as in the pixel game | Oscar, 2026-11-26 (on the figure sheet) |
| Blinking | The sisters blink now and then while they stand | Oscar, 2026-11-26 (on the figure sheet) |
| The balloon | Its own little card on a thread tied to her hand, not part of her card | Oscar, 2026-11-26 (on the figure sheet) |
| The bought bow (`strik`) | A big red bow with white dots on top of her head | Oscar, 2026-11-26 (on the figure sheet) |
| Camera | Shots that glide into each other and never turn far from north; hard cuts only at doors and between sets. "Up" on the stick is always away from the camera | Oscar, 2026-11-26, on the village blockout: "i really love the camera movement" |
| Shapes | Nothing lies on a grid. The old map gives where things are, never the shape of anything: paths wind, squares are round, side paths are stepping stones | Oscar, 2026-11-26: the tiled square and streets of the first blockout "no longer really have to be like so tiled" |
| What a tap feels like | The island's way is the model for everything that answers a tap: a wobble or a hop in stop-motion steps, a few bits of paper confetti, one soft sound, always the same | Oscar, 2026-11-26: "so much better than what we had in the pixel art version" |

Claude's picks. Oscar has seen them and has not objected, but has not said yes to each either:

| What | Pick | Why |
|---|---|---|
| House games | Houses are walk-in rooms first; bakery, funfair, atelier and stable games come last | They touch neither the map nor the adventure |
| Saves | 2.0 keeps its own saves and starts fresh | 1.x stays playable beside it; positions cannot carry over anyway |
| Set size | Smaller and denser than the tile islands (start the village at about 60% of its old footprint, on two or three levels) | The paper island works because everything is close together |
| Loading | Only the set she is on exists. A bridge (or a door, or the boat) is the gate: the next set is built while she crosses, in a wide shot, and the old one is thrown away. Other islands show on the horizon as flat card cutouts | Oscar asked whether loading the whole world at once is wise; this is the answer he got |

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

Smaller questions for the same piece:

- How long a set takes to build on the phone, and whether a bridge crossing hides it.
- How big a set can be before it stops feeling handmade.
- (Answered 2026-11-26: yes, see the status.) Whether a hand-built set can sit on the old tile coordinates, so the `MAP.*` spots and the old tests' positions keep their meaning. The set-size pick above points to no; try it on the village before giving it up, because a yes would save rewriting 30 of the 33 browser tests.

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
- **Which model** (Oscar asked on 2026-11-26 whether a cheaper one could take some of it):
  - a cheaper, faster model (Sonnet) for work that is well specified and judged from a screenshot: animals and props on the figure sheet once the style rules are frozen, dressing an island after its blockout is approved, tests, running the browser checks;
  - the strongest model for what sets the look or is built on by everything else: the test piece, the kit, cameras, each island's blockout.

## The list

Verdicts: **keep** (same idea, built in paper), **redesign** (the idea stays, the form changes), **later** (after the adventure plays through), **cut**. "Spine" means the adventure cannot be finished without it.

Oscar agreed to every verdict on 2026-11-26. A later change goes in the "Oscar" column.

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
| Flying | redesign, later | A set of its own: all the islands as tiny card models seen from high up; she picks where to land, and that set is then built | |
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
| Treehouse: telescope, acorns, hammock | keep | The telescope shows each other island as a small card model made for the telescope (the real set is not loaded) | |
| Zipline to the village | keep | A wide shot: a moment of scale. It is a gate: the village is built while she slides, the far end shown as its horizon cutout until then | |
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

- 2026-11-26: plan written, and the list checked against every `js/world-*.js`, `js/act-*.js` and the named places in `js/map.js`; Oscar agreed to the list.
- 2026-11-26: step 2 (figures with outfit layers) built, **approved by Oscar on the figure sheet** (2026-11-26), with the four choices made along the way (carrying in front, the dotted bow, the balloon on its thread, blinking).
  - The sisters are paper dolls (`paper/kids.js`): poses stand, walk, sit, hold, up; eyes that shut and blink; all eleven things the stall sells in five slots, in side, front and back view. Plain, they are pixel for pixel what Oscar approved (checked against the old drawing code, all 13 frames of all three views).
  - Points on her card (`kidPoints`: hand, between her hands, top of her head, seat) for things she holds or sits on.
  - On the island: `?who=fenna`, `?wear=kroon,ketting,jurkregenboog,vleugels,ballon`; in the console `__p.wear([...])`, `__p.pose('sit')`.
  - Shared shapes and the backing card moved to `paper/cut.js`.
  - Seen at phone size on the island: dresses, wings, hat, crown, bow, wreath and balloon read; the necklace does not and the rabbit barely does. That is risk 3 above, left for the test piece.
  - Still to draw for later steps: riding, swimming, climbing, asleep in bed (lying down), and every unicorn pose. The test island and figure sheet exist (`paper/index.html`, `paper/figures.html`; `node cdp.mjs tests/t-paper.mjs`).
- 2026-11-26: step 3 (the test piece) started in the main session. Sorted by which risk each part answers. Done so far:
  1. **A readout for the phone** (`/paper/?fps`, also with `?set=dorp`): frames a second and the slowest frame, how tall she is in points and which shot is on, draws and triangles; switches `?shadows=0`, `?dof=0`, `?post=0`, `?dpr=1`, `?bake=0` to see what costs what.
  2. **Oscar's phone, the test island, 2026-11-26** (before the gluing of item 3 went further): everything on 53 frames a second (slowest 45), 202 draws, 45k triangles, she is 58 points tall; without shadows and soft focus 60 (slowest wobbling round 30), 116 draws. What that says: 60 is the cap, so the full look had no room to spare on the smallest set; the pair cannot tell shadows from soft focus apart. **Asked for, not yet in:** the village with everything on, with `shadows=0` alone and with `dof=0` alone. Do not pick what to trim before those are in.
  3. **He holds the phone lying down: 750 by 313 points at x2.** Every phone test uses that shape first (upright is second). 750 and not the full width means the page does not draw under the notch; look at that when the on-screen buttons come.
  4. **Pieces are glued** (`bake` in `paper/paper.js`): everything outside a group marked `userData.live` becomes one mesh per kind of paper, each piece's colour kept in its corners (`sheetOf` in `paper/kit.js`); a thing that moves as a whole (a tree's crown, a cloud on its thread) is glued the same way inside its own group; the sea is one mesh, rocked on the graphics chip. The island went from 757 draws to 69, the village blockout draws about 120. The picture is unchanged.
  5. **The look is guarded** (`tests/t-paper-look.mjs`): six still shots of the island (day and evening; desktop, phone lying down, phone upright) against reference shots, passing only under 0.02% of the picture (two untouched runs differ in 0.001%). `PRE=ref` takes new references; run it around every change to the stage.
  6. **A set can be built and thrown away.** `paper/kit.js` is the kit (paper, card, outlines), `paper/paper.js` the stage (light, lens, theatre, she and her unicorn, walking and tapping), `paper/props.js` things that stand on more than one set (her house), `paper/set-*.js` one file per set: `{ name, build(S) }`, where `S` is the stage's toolbox (`floor`, `floorBox`, `wall`, `solid`, `tap`, `figure`, `lollipop`, `pine`, `sea`, `lamp`). `?set=dorp` picks one; `__p.load(name)` swaps it. Rules this sets, to keep when the kit is frozen:
     - `paper()` materials are shared and never changed after making. A material a set changes (a glowing pane) is made once at the top of its file and kept.
     - Whatever moves sits in a group marked `live`. Taps still find the hidden glued pieces.
     - The stage owns exactly two lamps (`S.lamp(0 | 1, ...)`), dark when unused. Adding or removing a light, or throwing a material away, makes the graphics chip build programs again: a hitch at every gate. Figure and sea materials are therefore kept and handed to the next set. `tests/t-paper-dorp.mjs` goes island, village, island six times and fails if anything piles up or any program is built twice.
     - A floor with height `null` is a hole (the pond). The first floor that holds a spot counts.
     - The village builds in about 65 ms on the Mac; the phone's time is the last thing on the readout's third line ("built in ... ms"); it counts the building and gluing, not the first frame's upload to the graphics chip.
  7. **The village blockout** (`paper/set-dorp.js`, live at `/paper/?set=dorp`): everything where `js/map.js` has it, by `T(x, z) = ((x - 31) * .6, (z - 42) * .6)`, on three levels (beach, green, and a terrace in the north with her house and two stairs). Real ground paper, her real house, 30 real trees, sea and shadows at village size; fountain, stall, benches, lanterns, swing, slide, pond, pen, arch, sword stone, pole, mud and the two bridges in grey card. 16 named places of the old map can all be walked to (a flood over the floor, `__p.reach()`). **That settles the tile-coordinate question for now: yes**, a set can sit on the old map through one linear map, so `MAP.*` spots keep their meaning; at 0.6 the village is about 25 by 20 steps and does not feel empty or crowded in the blockout. The south lobe and the west lobe are the thin parts. Oscar saw the first shot and found the grey house bland beside the island's; told it was a stand-in he said "ahh ok". The real house and real ground are in because they cost nothing.
  8. **The camera director** (top of the set section in `paper/paper.js`; the shots themselves in each set file). A shot is a zone on the floor plus how to look: span (how wide the picture is, so how small she is), rise, a small yaw, how far it follows her, soft focus. All numbers glide from one shot to the next; a new set is a cut. The stick is turned by the camera's yaw, so 'up' is always away from the camera; her left/right and front/back drawings follow the screen too. A shot's zone has a wider way out than in (`pad`). Tested on the village by walking her over every border both ways with a key held (that proves one change per crossing; that she keeps her heading is true by construction there), and with a finger held still on the glass onto the east bridge and into the playground, where the camera turns (`tests/t-paper-dorp.mjs`). The island's one shot is its old camera exactly.
     - **On a bridge the camera looks straight along it.** With a yaw, 'up' walks her into the railing. Yaw only where she has room.
     - **How tall she is, at the size of Oscar's phone (points; measured in the test browser at 750 by 313, not read off his phone):** at her door 76, pond 65, mud 64, playground 59, pen 58, the village's wide default 51, the two bridges 26 and 27. The floor the test holds: 40 wherever there are things to tap, 22 where she only walks through (`play: false`).
     - **A finger that just misses still counts** (`nearTap`): anything that answers a tap is at least 48 points across on the screen, however far back the camera stands.
     - Confetti is cut from the shared paper and never thrown away, and one bit is drawn out of sight at the start, so the first tap on an animal builds nothing while she watches.
  9. **Oscar's laptop, the village, 2026-11-26:** 45 frames a second at her door, 40 on the east bridge, built in 82 ms. A laptop window at x2 is five to seven million pixels against the phone's one, and soft focus, shadows and the film pass are paid per pixel. So the picture now has a **budget of three million pixels** (`BUDGET` in `paper/paper.js`; `?px=0` switches it off, `?px=4` sets another): over it, the picture is drawn coarser and stretched. The phone is under it and unchanged. The test browser cannot show his 40 (it reads 54 to 60 at the same size, `tests/t-paper-cost.mjs`), so whether three million is the right number is his to read. He says the phone tends to run better than the laptop.
  10. **The village's paths are cut by hand** after Oscar saw the first blockout's tile rectangles: `ribbon()` in the kit for a winding path, blobs for the square, the sand and the patch, stepping stones for side paths; lanterns stand beside paths, not on the old grid.
  11. Next, in this order: Oscar's three readings of the village on the phone; the gate (walk onto the north bridge, the forest shore is built while she crosses, the village thrown away: the build must hide inside the wide shot; time it on the phone); then the bedroom, the cave room, the swing, the dog, the sword. Known rough spots in the blockout: the ends of sea rows show beside narrow land, the shadow sheet covers the whole village and is softer than the island's (it should follow the camera), and no village animal stands there yet.
- Before any figure work is handed to a cheaper model, the style rules have to be written down (palette, how pieces are layered and shaded, sizes against a girl, frame rates); the code in `cut.js` and `kids.js` is the only statement of them so far.
