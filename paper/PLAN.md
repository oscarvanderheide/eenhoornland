# Eenhoornland in paper (2.0): the plan

The paper look tried on one island becomes the whole game. This file is the source of truth: it holds what Oscar decided, how the game is built, what exists, and what comes next. It was rewritten on 2026-11-26 (late) after a long day of Oscar playing each step and steering; the day's log is at the bottom.

Read this before any work under `paper/`. Then `paper/STYLE.md` if you draw a figure.

## Where the work lives

- **Branch `paper`**, in the worktree `.claude/worktrees/paper` of the repository. The pixel game keeps existing on `main`; never commit 2.0 work to `main`.
- Serve the worktree on its own port: `python3 serve.py 8766`, then `SERVE=8766 node cdp.mjs tests/t-paper-smoke.mjs`.
- **A push to `paper` publishes** `paper/` at https://oscarvanderheide.github.io/eenhoornland/paper/ (start in the village: `?set=dorp`; readout: `&fps`; figure sheets: `figures.html`, `animals.html`, `people.html`). The workflow `.github/workflows/pages.yml` is the same file on `main` and `paper`; change it on both or not at all. It retries the deploy step once by itself.
- **Everything the paper game loads lives under `paper/`.** The site takes only that folder from this branch; an import of `../js/...` would load the pixel game's file when live.

## What Oscar wants (all said on 2026-11-26)

| What | Decision |
|---|---|
| The look | A handmade paper diorama, as on the first test island. He approved the sisters as paper dolls on the figure sheet |
| Sets | Every island is built by hand. **The pixel game's map says roughly where things are, never the shape of anything:** nothing lies on a grid, paths wind, squares are round, side paths are stepping stones |
| Straying | "Overall it's fine to stray from the pixel art game ... this new style is so much nicer and allows much nicer, calmer, yet more interesting interactions and feel of exploration. Be critical whether it would work and creative." The inventory at the bottom of this file is a memory aid, not a contract |
| Room | Things stand far apart: `SPREAD` in `paper/lands.js` is 1.7 (1.0 and 1.5 felt cramped, 1.8 a little too much). Islands lie well apart too; the bridge between two is long |
| Camera | He loves it: shots that glide into one another, close at a door or a cave, far back on a bridge. Never turned far from north. Cuts only at doors |
| Between islands | One world. A bridge is a real bridge and nothing happens on it. He found a sheet of paper sliding across "really intrusive" |
| A tap | The first island's way is the model for everything that answers a tap: a hop or a wobble in stop-motion steps, a few bits of confetti, one soft sound, always the same. "So much better than what we had in the pixel art version" |
| More to do | "Overall there could be more things to interact with in the world." Each should be a small real action, not a menu |
| Calm | The island has a sound of its own, and it must be **continuous**: one long soft chord that slowly changes, never single notes ("the chimes make my brain think I need to pay attention to something"). Waves are heard only on the sand by the water, and softly. Small touches of sound matter to him |
| Where to look for ideas | **Lumino City and Pok Pok** ("it has nice interactions"): handmade mechanisms to work with your fingers. Cranks, levers, wheels and gears, a lift on a rope, shutters and doors with somebody behind them, bells, switches, a marble run, a seesaw, blocks to stack. Each is one clear cause and effect, with its own sound |
| Nothing by itself | The toy windmills turn only when tapped ("don't auto-blow"). The fountain runs and gusts of wind cross, because he asked for those; when adding a new thing, it waits for her unless he said otherwise |
| Flowers | She picks one at a time and holds the very flower she picked. Gardens are flowers only, laid out as if somebody planted them; no bare brown soil |
| Night | Lanterns come on by themselves; she can also light and put out each one |
| Trees in the way | A tree can fold flat out of the camera's way (`fold: true` on a set), but not in open places: "we don't really get lost behind trees anyways". He sees it for secret areas |
| No sword | "Not sure I like the idea of a sword in this style of game any more." It is out. Nothing is cut or hit |
| People | Not only animals: grown-ups who sit on benches and do funny things |
| The step | A kick scooter instead of the pixel game's bike, later, for getting about faster |
| The pixel game's rules that still hold | No text (the girls cannot read), no fail states, no timers, no counters or collection books (coins only), the world waits for the child, a missing thing hints instead of saying no |
| How to work | Fast: no full test round before a publish, publish small and often, say plainly what was not checked. He reacts to what he sees, so show real things early and label stand-ins |

Claude's picks that he has seen working and not objected to, but never said yes to one by one: every island exists at once with the far ones asleep (see "How it is built"); a second flower picked puts the first in her hair; a toy takes her over and the finger then belongs to the toy; her front door is a cut to a room that stands beside the world.

**Open questions for him** (do not build past these without asking):

1. With the sword gone, what opens the brambles on the bridge to the meadow? Proposal, being built as the default: **a full watering can makes them bloom into roses and curl aside.**
2. The pixel game's other two tools: the hookshot (the gap in the bridge to the beach) and riding the unicorn (the hole in the bridge to the castle). Proposal: the beach bridge is mended by her (planks lie about the meadow; she carries each to the gap); the castle bridge stays a jump on the grown unicorn.
3. Is the adventure (dream, egg, warm thing, hatching, fruit, riding, the castle's flowers, the rainbow, home) still the spine, or is this becoming a world to play in with the adventure as one thread through it? Everything built today is the second.

## Paper or folded card

Oscar asked whether what lives should be paper. The rule now:

- **A flat cut-paper card on a white backing card** (a "figure": drawn in code with `cut.js`, always facing the camera): everything that **lives** (the sisters, unicorns, animals, people, birds, butterflies), and everything she **holds, carries, kicks, eats or is given** (the ball, the watering can, a carrot, an egg, a bun, a fish, a kite). Also a scarecrow, because it is a somebody.
- **Folded and stacked card in three dimensions**: everything she **walks on, round, into or sits on**: land, water, bridges, houses, fences, benches, beds, the swing and slide, trees, lanterns, the fountain, the well, the picnic cloth.
- **Plants** are little three-dimensional paper makes (a stem, a cut head); a picked flower stays that same make in her hand.
- **Air** (confetti, water drops, wind curls) is loose flat paper.
- When unsure: would a child pick it up? Then it is a card.

Calls made on the night of 26 to 27 November, by that rule:

| Thing | It is | Why |
|---|---|---|
| The people, the sheep, the otter, the dolphin, the gull, the crab, the turtle, the seal | cards | they live |
| The gardener's wheelbarrow, the fisherman's crate and rod, grandma's knitting | part of their card | it is what they are doing: one drawing, so it moves with them |
| The painter's easel | a card of its own | its picture changes, and a card can show a new drawing |
| The bun, the apple she takes, the stall's basket, the paper aeroplane, the kite | cards | she holds or throws them |
| The apples lying on the stall's counter | folded (little balls) | they are part of the stall; the one she takes becomes a card |
| The balloon and its basket, the seesaw, the stall, the lighthouse, the pier, palms, parasols | folded | she climbs in, sits on, walks round or under them |
| The sandcastle, its bucket and spade | folded | she builds it; it is a place, not a thing she carries |
| The kite's string | two thin strips of card | a drawn line was a hair wide and drowned in the soft focus |
| The brambles and their roses | folded, spiky cut card | a hedge is in her way: it is part of the world |
| Coconuts, shells, pebbles | folded | they lie there; if she may pick one up one day, that one becomes a card |
| The lighthouse's beams, wool flying off a sheep, dandelion seeds | loose flat paper and light | air |

One more thing follows from the rule: **what she holds is given to the living only.** A flower is not handed to the kite, an apple not to the basket (cards that are things are marked `thing`).

Still breaking the rule: the picnic basket and apples in the forest.

## How it is built

No build step: ES modules, three.js r160 from a CDN.

| File | What it is |
|---|---|
| `paper/kit.js` | Paper, card slabs with a cut edge, hand-cut outlines (`blob`, `ribbon` for a winding path), `paper()` shared materials, `sheetOf` |
| `paper/paper.js` | The stage: light, lens and film pass, the theatre behind (sky, hills, clouds on threads), she and her unicorn, walking, way-finding, taps, the camera director, toys, doors, sound, the readout |
| `paper/lands.js` | Where each set stands in the world (`ORIGIN`), which sets are awake together (`NEAR`), `SPREAD`, the islands' outlines |
| `paper/set-*.js` | One file per place: `eiland` (the first test island, kept as the reference picture), `dorp` (village), `bos` (forest), `huis` (the room inside her house). `{ name, build(S) }` |
| `paper/props.js` | Things for more than one set: her house, flower beds, the flower in her hand, tufts and wild flowers, windmills, fountain, bench, lantern, log cabin |
| `paper/toys.js`, `farm.js`, `picnic.js`, `dog.js`, `critters.js` | The swing and slide; the farm; the picnic; the dog and her ball; the smaller animals |
| `paper/cut.js`, `kids.js`, `figures.js`, `animals.js`, `things.js`, `people.js` | Figures: the shapes and the backing card, the sisters as paper dolls, the unicorns, animals, held things, people. Sheets: `figures.html`, `animals.html`, `people.html` |

The seams, each one place in `paper.js`:

- **A set** builds everything under its own group with the toolbox `S`: `floor`, `floorBox` (a floor of height `null` is a hole), `wall`, `solid`, `tap`, `figure`, `lollipop`, `pine`, `sea`, `lamp`, `door`, `play`/`stopPlay`/`walkThen`, `free`, `heightAt`, `move`, `hand`, `head`, `offer`, `glue`, `at`. A set thinks in its own measure; the stage moves what it registers to its place in the world.
- **Gluing.** Everything that stands still is glued into one mesh per kind of paper with its colour in its corners; a thing that moves as a whole (a tree's crown, a windmill's sails) is glued inside its own group (`S.glue`). `paper()` materials are shared and never changed. Whatever moves sits in a group marked `userData.live`.
- **Two real lights, many lamps.** A set describes lamps; the stage gives its two lights to the lit lamps nearest her. Never add or remove a light or throw a material away while playing: the graphics chip rebuilds programs and the game hitches.
- **The camera director.** A set lists shots: a zone on the floor and how to look. Numbers glide. On a bridge the camera looks straight along it. A close, low shot needs a clear way to the camera: plant nothing there.
- **A toy** (`S.play(toy)`) takes her over: the finger belongs to the toy, the camera looks at the toy. One rule for every input: sideways pushes, touching her gets off. `toy.rest` makes the island's tune come closer.
- **A door** (`S.door`) is a cut between two doors of the same name. Nothing is built at a door.
- **Way-finding.** A tap is a place to go; she takes the straight line if it is free, else a way round. A held finger steers directly. She can never stay stuck: standing where she cannot walk, she steps clear.
- **Figures** are cards with frames. `f.act(tick)` picks the frame in stop-motion steps; `f.lift` and `f.lean` are smooth.
- **A pixel budget** of three million caps what is drawn on big screens.

Traps that have bitten more than once: a `// comment` at the end of a dense one-line statement swallows the rest of the line (put comments on their own line); a test hook's field called `on` is overwritten by `__p.toy()`; `placeAt` in a test puts the unicorn just north of her, on top of whatever is there.

## The world

One world. `?set=dorp` starts her at her own front door.

### The village (`dorp`): built

Her house on a terrace with a flower garden and two windmills; the room inside (beds she hops onto, a lamp); the fountain square with the dog and her ball; the playground (a real swing, a slide); the pond with ducks and benches; the unicorns' meadow; the farm in the south (well, watering can, carrots that grow and are pulled for the pig, a scarecrow and its birds, the hen and chicks); lanterns; butterflies; wild flowers to pick.

People live here now (`folk.js`): grandma knitting on the square's bench (sit on the free half and she waves), the accordion player on the square (silent until tapped), the gardener asleep in his wheelbarrow by the carrots (a tap, or a full watering can), the fisherman at the pond (a fish, a fish, a boot). The brambles on the east bridge bloom open when watered; the fountain fills the can as well as the well.

Also new: a seesaw on the playground for her and the unicorn (kick off just as she lands and the unicorn is thrown higher each time, until it turns a somersault); a paper aeroplane on the terrace that really glides; a dolphin that leaps over the long east bridge once on every crossing; the stall is a real fruit stall (an apple to give away). No grey stand-ins are left: the race arch, the zipline's pole and the bike were taken away until there is a race, a zipline and a step.

### The forest (`bos`): built as a first pass

Bigger than the pixel game's. A log cabin (no inside yet), the cave's rock with a close shot at its mouth (no inside yet), the clearing with the picnic the animals come to, the orchard, the nook, the oak with a platform. Hedgehog, owl, squirrel. To come: a fawn, a row of boar piglets, more squirrels (cards drawn); the inside of the cave and the cabin; the ride down the zipline from the oak to the village; hide and seek in the bushes; mushrooms.

### The meadow (`wei`): built as a first pass

Not a port. East over the long bridge the brambles shut. A wide meadow of flowers with a windy hill on two levels (**the kite** lies on its top: run and it climbs, on the hill the wind holds it), **the balloon on a rope** at the back (up she goes and the camera pulls far back until the islands lie below like models), the waterfall with its pool and five stepping stones that each sing a note (she hops from stone to stone), the otter in the pool, dandelion clocks to blow, the sheep's pasture (puff, then the wool flies) with a lamb, the bakery with the baker outside (he hands her a bun to give away), the painter at her easel by the pool (tap by tap: strokes, a rainbow, a unicorn). To come: the inside of the bakery, the cave behind the waterfall, bees, a bridge south to the beach (the path already ends there).

### The beach (`strand`): built as a first pass

South of the meadow over a long bridge (the beach's own). Not a port. A wide island of sand with a green dune. **The sandcastle**: every tap she builds a piece more (tower, tower, wall and gate, big tower, flag); it stays; a tap on the finished castle and she jumps on it. **The lighthouse** on its rock: a tap lights it and two beams turn over the sea; at night it is on by itself. The pier, with the gull on its posts (it flies from post to post, every other time with a fish) and the seal on a rock (claps; a tap on the clapping seal: a ball on its nose). The crab (dances; a tap on the dancing crab, or running at it: it digs in and comes up elsewhere). The turtle (tucks in, then walks on). Palms (a tap shakes one; the first time a coconut drops), parasols, benches, shells. To come: the boat to the rainbow island, shells to hold to her ear, something to dig up, the dolphin for this bridge (the dolphin code only knows bridges that run east-west).

### The rainbow island (`eiland` in the pixel game), the castle (`kasteel`): after that

Rainbow island: paint puddles and coloured footprints, bouncy mushrooms, the rainbow tree, flamingos, the parrot, the rabbit. Castle: a walk-in hall, the garden, the carousel, the peacock, the little dragon, somebody funny at the gate. The cards for all six animals are drawn (`animals2.js`).

### How many islands exist at once

All of them, built once at the start (`WORLDS` in `lands.js`: the first test island is a world of its own, everything else is one world). Every set is stepped all the time. A set the camera cannot see is not drawn (its root is hidden: `view.intersectsBox` in the frame loop); without that the far islands cost about 200k triangles at her door. The sea is glued in pieces of 44 by 22 steps, and a piece the camera cannot see is not drawn either. `?set=wei` starts on the meadow with every gate open.

## Order of work

Done: the paper things and forest animals; all sets at once; the brambles; the meadow; people; the beach; the first things with a little real mechanism in them (seesaw, aeroplane, kite, balloon, sandcastle).

1. More things to work with her fingers, Lumino City and Pok Pok style, one per place: a lift on a rope up the oak (and the zipline down), a crank, a marble run down the windy hill, shutters with somebody behind them.
2. The rainbow island; the castle.
3. The insides: the cave, the cabin, the bakery.
4. The thread of the adventure, once Oscar has answered the open questions.
5. What a game needs round it: the start screen with the two sisters, saves, the on-screen stick and buttons, the controller, bedtime.

## How to work

- **Tests.** `tests/t-paper-smoke.mjs` is the half-minute look (loads, every named place can be walked to, pictures of a few places: `AT=fountain,swing SET=bos`). `tests/t-paper-play.mjs` has one part per thing to play with (`ONLY=swing|slide|house|dog|animals|farm|forest|flowers|meadow|people|seesaw|plane|beach`). `tests/t-paper-look.mjs` guards the first island's picture: run it when the stage's light, lens or gluing changes. `t-paper.mjs` (first island), `t-paper-dorp.mjs`, `t-paper-cross.mjs` are older and longer; the last two still carry places from before the spreading out.
- **Never a full round before a publish.** Check what changed, look at a picture, push.
- **Helpers** draw figures well from `STYLE.md` and a precise brief: new files only, their own browser port (`PORT=9555`), no commits. Their sheets go to Oscar.
- **Phone.** He holds it lying down: 750 by 313 points. He has not yet read the frame rate on the phone with the big world; on his laptop it was 60 after the pixel budget. Watch draws (about 180 at her door now).

## Log of 2026-11-26 (as it happened; the sections above are the summary)

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
  9. **Oscar's laptop, the village, 2026-11-26:** 45 frames a second at her door, 40 on the east bridge, built in 82 ms. A laptop window at x2 is five to seven million pixels against the phone's one, and soft focus, shadows and the film pass are paid per pixel. With the budget below he reads 60 at both spots. So the picture now has a **budget of three million pixels** (`BUDGET` in `paper/paper.js`; `?px=0` switches it off, `?px=4` sets another): over it, the picture is drawn coarser and stretched. The phone is under it and unchanged. The test browser could not show his 40 (it reads 54 to 60 at the same size, `tests/t-paper-cost.mjs`); his own reading settled it. He says the phone tends to run better than the laptop.
  10. **The village's paths are cut by hand** after Oscar saw the first blockout's tile rectangles: `ribbon()` in the kit for a winding path, blobs for the square, the sand and the patch, stepping stones for side paths; lanterns stand beside paths, not on the old grid.
  11. **A sheet of paper between sets, built and taken out again the same day.** The first gate swapped the village for the forest mid-bridge behind a sliding sheet. Oscar: it gets in the way, and the islands feel very close. It is gone (the commit before this one has it, `stepGate`, should a door ever want it).
  12. **One world** (`loadWorld` in `paper/paper.js`; `tests/t-paper-cross.mjs`). Each set file still thinks in its own measure; the stage puts it at `ORIGIN[name]` and moves whatever it registers (floors, walls, solids, shots' zones, places, lamps). `?set=dorp` builds the village and its `NEAR` neighbour the forest, about 110 ms together on the Mac. The stage asks every set that exists for floor, walls, taps and shots; which set she stands on (`set`) decides only the shot for "everywhere else", and whose trees are drawn loose. Rules this sets:
      - **A shared thing has one owner.** The north bridge, its floor and its far shot are the village's, all the way to the forest's shore. The forest builds no bridge.
      - **One sea** for everything that exists (`buildSea`): each set says what water it wants, the stage makes the rows once.
      - **Two real lights, many lamps.** A set makes lamp descriptions (`S.lamp`); the stage gives its two lights to the two lit lamps nearest her.
      - **The shadow sheet follows the camera** on these sets (`shadow: { follow: 20 }`), moved in whole stitches so shadows do not crawl. The island keeps its own still sheet.
      - **The trees of a set she is not on are one glued piece** (`glueTrees`), swapped for the loose, tappable trees when she steps onto it; a test holds her mid-bridge and checks the picture is the same either way (0.005%). From her door, with the forest in view: about 85 draws and 160k triangles on the phone's shape.
      - **The bridge's length is one number**, `NORTH_GAP` in `paper/lands.js`, now 13 steps (it was 6): about six seconds of walking, in the far shot. Oscar has not seen this length yet.
      - Who lives on a set (`S.figure`) stands in the world's measure: use `S.at(x, z)` for where.
  13. **The forest blockout** (`paper/set-bos.js`, `/paper/?set=bos` starts her there): real ground, 46 real trees, the cave's rock with a dark mouth, the clearing, orchard and nook, winding paths, and in grey the atelier, the seven bushes and the oak with the treehouse. At the cave's mouth the camera comes close and low (she is 84 points tall there on the phone's shape). **A close, low shot needs a clear way to the camera:** no tree is planted between the mouth and where the camera stands, or she is hidden behind it. The cave is not a room yet: the mouth is a dark card.
  14. **A tree is one draw** (two with its shadow): trunk and crown share shadow flags and paper side. Trunks now take the shadow of their own crown, which changed 0.05% of the island's picture; the reference shots were taken again on purpose (2026-11-26).
  15. Walking the whole bridge both ways: two changes of shot each way, the longest frame 17 ms on the Mac, no program built, nothing left behind after three more crossings.
  16. **Making the two islands rich before adding a third** (Oscar, 2026-11-26: animals, interactions, the slide and swing, going into the house; "with this new style we can have much more meaningful interactions"). In three slices, each published for him to react to:
      - **Done: the swing and the slide** (`paper/toys.js`; `tests/t-paper-play.mjs`). A toy takes her over through one seam in the stage (`S.play(toy)`, `toy.step(dt, inp)`): while she plays the finger belongs to the toy, and the camera looks at the toy so the picture holds still. One rule for every input: sideways pushes (the stick, or a finger held left or right of her), touching her (or the jump key) gets off. The swing is a real pendulum: a finger held one way for six seconds leaves her under half height, pushing in time takes her to the top. Letting go throws her as the swing moves (a good bit harder than a real swing would); thrown into the pond or the sea she lands there with a splash and hops back out. A close shot with a toy in it needs a clear way to the camera, like the cave's mouth.
      - **Done: walking into her house** (`paper/set-huis.js`; doors in `paper/paper.js`). The girls' bedroom is a set of its own, built like a doll's house with the front off, standing far beside the world where no camera of the world reaches (and the world's cameras do not reach it: 18 draws inside). `S.door(name, zone, stand, dir)`: two doors of the same name on two sets are one doorway; walking into one in its direction is a cut to the other, with a short dip to dark, and nothing is built. Her front door opens by itself when she comes close; walking along the house does not take her in; inside, walking down off the front of the room anywhere is the way out. A bed is a toy: she hops on and shuts her eyes, a push and she is up. The lamp answers a tap. `reach()` goes through doors.
      - **She finds her way round things** (`wayTo` in `paper/paper.js`). A tap used to send her in a straight line, and she stuck behind the flower pots on the way to her own door. Now: the straight line if it is free; otherwise a flood over the floor from where she stands (a few steps beyond the goal at most) and the corners cut. A finger held down still steers her directly.
      - Then: the animals. Eight are drawn on a sheet of their own (`paper/animals.js`, `/paper/animals.html`, `tests/t-animals.mjs`; made by a helper from the rules in `paper/STYLE.md`): dog, hen, chick, pig, pond duck, hedgehog, owl, squirrel, each with its frames. **Waiting for Oscar's yes on the sheet.** The helper's own doubts: the duck's dive is the weakest drawing, the walks are subtle at phone size, the hen's nest pose has no nest. The dog gets its part first, and with depth.
      - **Done: the animals have parts** (`paper/dog.js`, `paper/critters.js`). The dog waits on the square, says hello, comes along (over the bridge, into the house), sits when she stops, rolls over, and fetches the ball she kicks (a ball that really rolls and bounces). The hen lays an egg, chicks hop, the pig gets up out of its mud, ducks dive and swim on, the hedgehog curls up when she comes close and rolls when tapped, the owl sleeps by day and hoots when woken, the squirrel runs up the oak for an acorn. Oscar has the sheet's link; no word on the drawings yet.
      - **A tree between the camera and her can fold down flat**, like a page of a pop-up book, and stand up again when she has passed. **Switched off for now:** Oscar liked how it is made but found it odd on the open starting island ("we don't really get lost behind trees anyways"); he sees it for secret areas. A set turns it on with `fold: true`. So views are kept clear by not planting trees in them.
      - **She can never be stuck:** if she ever stands where she could not walk (the slide once let her off inside a tree: Oscar's bug), the stage steps her to the nearest spot where she can.
  17. **Oscar's steer, 2026-11-26, after playing the above:**
      - **Everything felt cramped.** Both islands are now spread out by one number (`SPREAD` in `paper/lands.js`): 1.5 at first, 1.8 after his second look ("spacing can be even more"); things keep their size. The pond moved to the middle of the west lobe, away from the playground. **Paths start inside the square's outline** so they are joined to it, and benches and lanterns stand beside paths, never on them (he saw a path stop short of the square with a bench on it). The dog stands on the square in the open. The camera's spans are unchanged, so there is simply more ground between things.
      - **The path to the mud floated on over the sand** where the green ends. A path now lies at the level of what it crosses: the green part ends at the edge, a second piece lies on the sand.
      - **Sound:** a soft wash of waves that grows as she comes near the sea or the pond and is gone indoors (`startWash`, `stepWater`). More sound to come: he asked for calm, small touches like this.
      - **A flower garden by her house** (his idea): two beds on the terrace (`flowerBed` in `paper/props.js`), on lighter grass thick with tufts: the first version stood in brown soil, which he found not cosy.
      - **The grass is not bare** (he missed the first island's tufts): `meadow()` scatters tufts in twos and threes and a flower here and there over both islands, never on a path; they are glued, so they cost no draws.
      - **Toy windmills** (his idea): `pinwheel()`, three in the garden, one by the playground, one by the pond, one in the forest clearing. A tap spins one, and so does running past it; it turns in stop-motion steps and slows by itself.
      - **Stray from the pixel game where paper does it better.** "This new style is so much nicer and allows much nicer, calmer, yet more interesting interactions and feel of exploration": port with judgement, drop what does not suit, propose new things. The list above is no longer a contract.
      - **Fewer test runs.** No full round before a publish. `tests/t-paper-smoke.mjs` is the half-minute look; run a longer test only when what it covers changed. **`t-paper-dorp.mjs`, `t-paper-cross.mjs` and `t-paper-play.mjs` still carry places from before the spreading and will fail until their numbers are multiplied by `__p.spread`.**
  18. **Oscar's list of ideas, 2026-11-26** ("feel free to take it and make your own things out of it"). What becomes of each:
      - *The pig's corner has nothing but the pig* + *what happened to the farm, the scarecrow and the birds; watering and growing carrots*: **the south of the village becomes the farm**: the well, the watering can, rows of carrots that grow when watered and can be pulled and fed to the pig, the scarecrow with its birds, the hen and her chicks. Being built first.
      - *A well to throw coins in, for something special later*: the farm's well. For now the can is filled there; the coins come with the coins.
      - *The forest larger, with more animals and things to do; a cabin of logs instead of a normal house; a picnic blanket*: being built second: the forest's land grows, the grey atelier becomes a log cabin, and at the picnic blanket she sits down and the forest's animals come and sit with her.
      - *A treehouse with a zipline again*: the oak has its platform; the ride over the water to the village is a piece of its own, after the above.
      - *Butterflies floating around*: a few, by the flowers; one lands on her head when she stands still.
      - *Gusts of wind over the sea, with dark spirally things*: now and then a gust crosses with paper curls in it; where it passes, windmills spin and tree crowns sway.
      - *A pink unicorn onesie in the shop*: goes on the list of things to wear, to be drawn with the stall.
      - *A step (a kick scooter) instead of the bike*, not necessarily on the first island, for going faster later: noted in place of the bike; needs her drawn riding it.
      - ***No sword any more*** ("not sure I like the idea of a sword in this style of game"). The sword and its stone are out. The brambles on the bridge to the meadow then need another key. Claude's proposal, not yet put to him: **water them**: a full watering can on the withered bramble and it blooms into roses and curls aside. It uses the toy she already knows, and nothing is cut.
  19. **Built from that list and from his next looks, 2026-11-26:**
      - **The farm** (`paper/farm.js`; the `farm` part of `tests/t-paper-play.mjs`): the south of the village is green now and holds the well, the watering can, three rows of carrots, the scarecrow with three birds, the pig's mud and the hen. The loop: tap the can (she carries it in front of her), tap the well (the bucket goes down, the can is full, good for two rows), tap a row (she pours, the carrots grow in two steps), tap grown carrots (she pulls one and it flies to the pig, who eats it); an emptied row is seedlings again after a while. With empty hands or an empty can the can gives a hop: no wrong. The birds fly up when she comes close and settle when she has gone.
      - **Spacing 1.7** (1.8 was a little too much).
      - **On the swing she tilts with the ropes** (she leaned the other way): a toy's lean now turns her about the point she sits on.
      - **The ball is cut from paper** like the figures: a round card with a white band that turns as it rolls.
      - **The unicorns' meadow stands wholly on the green** (a corner of its fence hung over the sand).
      - **The fountain** has a basin, a pillar and a bowl of pale stone and water leaping in paper drops (three cut-outs shown in turn); a tap is a big splash.
      - **Benches** are painted wood and can be sat on: a tap, she walks round, hops on; a push and she is up.
      - **Lanterns** are a post with a paper lamp: a tap lights one, a tap puts it out; lit ones near her give real light (the stage's two lights go to the nearest lit lamps).
      - **The flower garden is flowers only**, of five kinds and many sizes (daisy, tulip, tall sunflower, rose, a stalk of bells). **The big ones can be picked:** up to five make a bunch in her hand, and whoever she taps next is given it (`S.offer`). A picked flower grows back.
      - Draws at her door went from about 110 to about 175 with all this (pickable flowers, lamps, birds, drops are loose pieces). Still unknown on the phone; if it costs frames, the birds and the flowers are the first to glue further.
      - **The forest is bigger** (its land about a fifth wider and a quarter deeper than the pixel game's, 84 trees) and has **a cabin of logs** where the atelier stood (`cabin` in `paper/props.js`; a tap knocks and the chimney puffs; no inside yet).
      - **The picnic** (`paper/picnic.js`) in the clearing: a tap on the checked cloth and she sits; the hedgehog and the squirrel come over and sit with her (they are asked through `guest` in `paper/critters.js`), a little cheer when both are there; a push and she is up, and they go home.
      - **Butterflies** (`butterfly` in `paper/critters.js`): five, by the garden, the farm and the forest's flowers. When she stands still near one for a moment it comes and sits on her head, and flies off when she walks on.
      - **Gusts of wind** (`stepWind` in `paper/paper.js`): now and then dark curls of paper cross the picture from the left; trees they pass sway, and a set's `wind(x, z)` spins its windmills. Out of doors only. `__p.wind(true)` sends one now.
      - Still open from his list: the ride down the zipline from the treehouse, the coins for the well, the unicorn onesie, the step, and what opens the brambles now that the sword is gone.
  20. **From his next looks, 2026-11-26:**
      - **Sound.** The island has a tune of its own, slow and calm (`stepTune`): soft notes far apart over a low hum; resting on a bench or the picnic cloth it comes closer (a second voice, `toy.rest`); lower and slower in the evening; only the hum indoors. **The wash of waves plays only down on the sand or on planks over the water**, not on the grass.
      - **Benches:** a tap sits her down, and so does walking into one from the front (he could not sit).
      - **Lanterns come on by themselves at night** and go off in the morning; a tap still does either.
      - **The day and night button** shows one picture: an svg does not hide by the `hidden` attribute alone, so the moon hung under the sun.
      - **The ball** is a beach ball in six wedges of colour and turns about its middle (turned about its foot it was under the ground half the time).
      - **No darker card under the islands** on the big sets: out in the water it showed as brown ledges between the waves.
      - **Flat cards that overlap lie at slightly different heights** (`lay` in the set files): at the same height they flickered where a path crossed a clearing.
      - **His question: should what lives or is held be paper too?** Claude's answer, adopted as a rule: **everything that lives, and everything she holds or kicks, is a flat cut-paper card on a white backing card** (figures, the ball, the can, the scarecrow, birds, a carrot, an egg); **the world she walks in is folded and stacked card in three dimensions** (land, houses, furniture, trees, toys she sits on). The can, the scarecrow, its birds and the small things are being redrawn as cards, with a fawn and a boar piglet for the forest (a helper, on `paper/animals.html`).
      - Still to do from this look: the flower gardens laid out as if somebody planted them, flowers picked anywhere and not only in the beds.
  21. After that, in this order: Oscar's phone readings (the village at her door, on the east bridge and halfway over the north bridge; with everything on, with `shadows=0`, with `dof=0`; and "built in ... ms"); then the bedroom, the inside of the cave (a door is a cut), the swing, the dog, the sword. Known rough spots: the ends of sea rows show beside narrow land, no animal lives in the village or the forest yet, every set file is fetched at the start, and a third island will need sets built aside and thrown away (see the Loading row). The full test round takes about eight minutes because the tests walk her in real time: while changing one thing, run the one test that covers it, and the full round once before a push.
- Before any figure work is handed to a cheaper model, the style rules have to be written down (palette, how pieces are layered and shaded, sizes against a girl, frame rates); the code in `cut.js` and `kids.js` is the only statement of them so far.

## Log of the night of 2026-11-26 to 27 (Oscar asleep; Claude building on its own)

What was asked: go on with the rest of the world, more to interact with, people doing funny things, think about paper or folded card, look at Lumino City and Pok Pok, rewrite this plan to match.

**Nothing below was heard by ear or tried on the phone.** Every sound is untested by a person; the frame rate with the bigger world is unmeasured (on the test machine it stays at 60; triangles are 350k to 480k depending on where she stands, of which the sea is 120k). Each slice was checked by its own short part of `t-paper-play.mjs` and by looking at pictures, never by a full round.

1. **The meadow** (`set-wei.js`), as described above. The bridge is the village's, all the way over.
2. **The brambles** (`bramble` in `props.js`): dry and thorny; a tap with empty hands and they shake and show a watering can; watered they turn green, then bloom into roses and curl aside for good. The fountain fills the can too.
3. **One thing in her hands** (`hands` in `paper.js`, `S.hands`): taking the kite puts the can down; with her hands full a picked flower goes straight into her hair. Every new thing to carry uses this.
4. **A toy may bring its own camera** (`toy.shot`): the balloon pulls it far back; the haze and the far end of the picture go back with it.
5. **Sets out of view are not drawn.**
6. **People** (`folk.js`, drawn in `people.js`, sheet `people.html`). Nobody makes a sound by themselves. The accordion's notes swell and fade and come out of the island's chord of the moment (`sfx.squeeze`), because single plucked notes were what Oscar disliked.
7. **Sheep, lamb, otter** (`critters2.js`, drawn in `animals2.js`, sheet `animals2.html`). Also drawn and waiting: bee, crab, gull, turtle, dolphin, seal, rabbit, parrot, flamingo, peacock, baby dragon.
8. **The balloon was moved to the back of the meadow**: in front it stood between her and the camera and filled the screen. Rule for sets: nothing tall south of where she plays.
9. **The dolphin** (`dolphin` in `critters2.js`): Oscar's wish. Once on every crossing of the east bridge; a tap on it in the air is a flip.
10. **The seesaw** (`seesaw` in `toys.js`): the plank is a small real sum (where it is, how fast it turns, her side a little heavier). A touch kicks off; kicking off within a third of a second of landing counts as well timed and builds a streak. The unicorn rides the other end (`uni.busy` stops it following her).
11. **The paper aeroplane** (`plane` in `toys.js`): Oscar's wish. Speed and nose angle with lift that grows with speed, so it swoops and climbs. It stays where it lands; from the sea or anywhere she cannot stand it comes back to the terrace.
12. **The beach** (`set-strand.js`, `beach.js`), as described above.
13. **The sea in pieces**, and **the fruit stall**; the last grey stand-ins taken away.

### What to look at first, and what is not right yet

- **Listen.** The accordion (`sfx.squeeze`), the hello of the people (`sfx.hello`), the singing stones (`sfx.note`): none was heard by a person. If any of them is a chime that asks for attention, say so and it goes.
- **The phone.** Five islands now exist at once. Triangles are 300k at her door and up to 480k on the meadow; draws about 200. Nothing was measured on the phone.
- **The unicorn stands in the way** now and then: it walks onto the sandcastle's heap and in front of things she wants to tap.
- **Trees can hide her** on the meadow and the beach where I did not clear a view (the tree-folding is still switched off, as asked).
- **From the balloon the sea has an edge** on the far right: the waves stop and flat deep water goes on.
- **The bridge to the beach has no dolphin**, the bakery, the cave and the cabin have no inside, the lighthouse cannot be climbed.
- **The seesaw's kick is a push to the side** (stick, key, or a finger held beside her), by the one rule of the toys; a touch on her gets off. A finger simply held keeps it going gently; a push in time with the landing builds the streak. Whether small hands find that, only playing will tell.
- **Two things share one rule that may surprise**: with the can or the kite in her hands a picked flower goes into her hair; taking an apple or a bun puts the can down where she stands.
- **Older tests** (`t-paper-dorp.mjs`, `t-paper-cross.mjs`, and the swing, slide, house, dog, animals parts of `t-paper-play.mjs`) were not run tonight and may carry places from before the world grew.

## Appendix: what the pixel game had (a memory aid, not a contract)

Verdicts: **keep** (same idea, built in paper), **redesign** (the idea stays, the form changes), **later** (after the adventure plays through), **cut**. "Spine" means the adventure cannot be finished without it.

Oscar agreed to these verdicts on the morning of 2026-11-26; by the evening he had said to stray freely, and the sword (and with it "sword cuts grass") is out. Kept for what it reminds us of.

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
| A dolphin leaping over the north bridge when she is halfway | new | It answers her being there, once per crossing; needs the dolphin drawn | Oscar's idea, 2026-11-26 |
| A paper aeroplane | new | A toy of its own: she throws it from the terrace by her house and it glides over the village; where it lands she can throw it again | Oscar's idea, 2026-11-26 ("dunno where to add them") |

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

