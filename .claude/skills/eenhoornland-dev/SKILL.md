---
name: eenhoornland-dev
description: How to add features to or fix bugs in Eenhoornland (the HD-2D pixel-art unicorn game for two young children) and prove they work. Use for any change to js/*.js, new areas, items, animals, quest stages, sprites, or when asked to test or screenshot the game.
---

# Working on Eenhoornland

The players are two young children who cannot read. A bug that blocks them ends the fun, so every change is verified in a real browser before it is called done.

## Rules of the game design
- Every island has its own plants, rocks and animals (`map.js` vegetation per zone, `art-isles.js`): nothing grows or lives on two islands. A new thing for an island gets new art.
- Nothing the adventure needs just lies around: every tool and goal item comes with a small funny moment (sword in a stone, sleepy gnome, shy star, fruit shaken out of a tree).
- No fail states, no timers, no text-only information: nobody can read and the voice is off (`audio.js`), so every goal is a picture chip, a picture bubble, or a marker on the map. `speak()` calls stay (for a later voice). `bubble(c, text, icon)` shows only bubbles with an icon (small, no text); text-only calls show nothing (Oscar found word balloons too big and useless).
- A tool turns up only when it is needed (`Q.toolReady`): the sword in its stone once the egg is found, the hammer next to the sleeping gnome once the unicorn has hatched. While it waits it glows and sparkles (it is the goal of the moment).
- Thrown animals never spin: they lean a little along the arc (a full turn pivots around their feet and sinks them into the ground).
- Holding a finger down on the ground (`steer` in `world.js`, after 220 ms) makes her walk towards the finger until it lets go; a short tap still walks to the spot.
- Anything a child can be sent to must be reachable. `map.js` fills unreachable pockets and `tests/map.test.mjs` asserts it, in the order of the adventure.
- State changes are saved first, animated after (see `act-huisje.js`), so closing a screen mid-animation never loses progress.
- The houses are only for fun: nothing in the adventure depends on them. The unicorn never grows into the big sprite.
- The world waits for the child (learned from Pok Pok and DUPLO World): nothing bobs, spins or makes a sound by itself except the goal of the moment. Things react when touched or when she comes close, always the same way and with the same sound, and what she changed stays changed (saved in `quest.js`).
- Every island has one toy of its own (table below). Do not copy a toy to a second island; give a new place a new thing to do.
- A toy is a short loop of real actions (fetch the can, fill it, pour, see it grow, pick). When something is missing, the missing thing wiggles and its picture shows in a bubble; there is no "wrong" sound.
- Each kind of egg has its own warm thing and food (`Q.WARM`/`Q.FOOD`, `ART.warmItem`/`ART.foodItem`); the forest egg of the first adventure keeps the star and the rainbow fruit.
- Never show completion: no found/total counters, collection grids or locked markers. Secrets just happen (Oscar: no FOMO).
- Coins are the only thing collected or counted (Oscar: "no collection shit except for coins"). They lie around, come from chests, bottles, the clam, and a coin pops up when a house game is played well (`ui.reward`). The stall sells things to wear for coins (`Q.SHOP`), shown as rows of coins, never numbers. No bag, no sticker book, no counters. Things found that are not coins are a moment: an apple is eaten on the spot, a caught fish flips back into the sea, a picked flower makes her sneeze.
- Fewer things, each richer (Oscar: "zelda on gameboy like exploration combined with pok pok style interaction"). Deepen an existing creature or toy before adding one.
- A toy's next step shows itself while she is near it (`nextStep()` in `world-toys.js`: a soft glow on the can, the fountain, a thirsty pot, the bucket; a dotted see-through tower where the bucket will go). A tap on the goal does the missing steps itself (a pot tapped with an empty can: she fetches water first). With the bucket on the sand, putting it down flips it into a tower.

## The adventure (one cycle)
Start screen (pick Anna or Fenna) → dream (`dream.js`) → a quiet morning at her front door (`world.wakeUp()`: close camera, warm light, village animals asleep until she walks past, goal chip after 6 s) → `zoek`: the egg lies in the cave in the forest (`MAP.ROOMS.grot`) → `ei`: pull the sword out of its stone in the village (it is only there from now on), slash the brambles on the bridge, catch the shy warm thing in the flower meadow (it hops away twice) → `baby`: wake the gnome in the forest for his hammer (it only stands next to him from now on), smash the boulders, sail the boat yourself across the open sea (arrow by the boat points the way) to the rainbow island, shake the fruit out of the rainbow tree → `vriend`: she can be ridden (tap her or the ride button), jump the hole in the bridge to the castle, go in through the gate into the hall (`MAP.ROOMS.hal`), through its golden door into the garden, and wake the six sleeping flowers (`act-kasteel.js`, `Q.bloom`) → `feest`: the rainbow is whole, she goes to live with the unicorns of earlier adventures in the meadow in the village (`MAP.PEN`, next to the start), a rainbow mends the bridge, go to bed → new dream, new egg (on another island), new world seed. Tools are kept; gates close again every cycle.

## Where things live
| File | Role |
|---|---|
| `js/map.js` | The world as pure data: islands (`ISLES`), ground, blocked tiles, bridges (`deck`), gates, trees/props, spawn spots, egg / star / tool spots. No DOM. |
| `js/quest.js` | The stages above, tools, coins, herd. Pure logic, emits events. `wishes()` is the list of goal chips. |
| `js/art.js` | Ground painter, prop/item/animal sprites, eggs, the little unicorn, star, fruit, bike, ball. |
| `js/world.js` | three.js scene, sea (distance-to-land mask), movement, riding (`setMount`), input, camera. Hands a toolbox (`ctx`) to the files below. |
| `js/world-extras.js` | Fence, castle, animals, collectibles, hidden egg, star + hatching, fruit, meadow herd. |
| `js/world-tools.js` | Logs and puddles (jumped), brambles and boulders (tool), the hole in the bridge (ridden unicorn), the two tools. |
| `js/world-play.js` | Bike (bell on the jump button, trailer for animals, ramps), balls, the boat (takes her across when she is on her way there, otherwise she steers it by tapping, inside `MAP.LAGOON`), floating chests, the whale. |
| `js/world-toys.js` | One toy per island: watering can + flower pots and the stall (dorp), hide and seek in the bushes (bos), kite + dandelions (wei), bucket + sand towers (strand), paint puddles and footprints (eiland), faces at the castle windows (kasteel). Things she carries (`take` / `putDown`). |
| `js/shop.js` | The stall's screen: buy with coins, put on, take off. Outfits are drawn by `PX.kidSprite(who, frame, blink, wear)`. |
| `js/world-life.js` | Just for fun: pick up and throw animals, birds (scarecrow), tappable trees/bushes/props, butterflies, jumping fish. Friends: an old unicorn from the meadow follows her for the day. Rare jokes (nut on her head, squirrel/frog, nap after 3 throws, twirl on 3 taps, unicorn burp). Things on things: hits shake trees (`hitAt`), paint puddles paint animals, the dog chases kicked balls and fetches pebbles, pebble in the fountain = a coin a day (`Q.wish`), ducks come to a plop. Old unicorns from the meadow (`c.uniKind`): a tap = come along, a second tap = her power (bos: trees shake + mushroom ring, bloem: flowers in her footsteps, regenboog: rainbow slide to somewhere she can walk back from, zee: `act-zee` near the sea, ster: `act-wolken`). |
| `js/world-weather.js` | `Q.weather()` per day (first day sunny): rain (+ frogs), herfst (falling leaves, piles to kick, one hides the hedgehog), sneeuw (white ground, flakes, heaps to stomp, snowman whose nose the rabbit eats). Kicked piles saved per day (`Q.kickPile`). Force with `Q.quest.wxForce = 'sneeuw'; __w.weather.sync()`. |
| `js/act-zee.js`, `js/act-wolken.js` | Side-view places only an old unicorn's power reaches: under the sea (fish, octopus ink, pufferfish, clam pearl and chest coin once a day via `Q.giftOnce`) and the clouds (bouncy rain clouds, rainbow under the rain, sleepy moon, balloon bear, stars → coins). The rider's look is `state.extra.power.look`. `?debug` exposes `__zee` / `__wolk` with `tap(x, y)`. |
| `js/dream.js` | The opening dream cutscene. |
| `js/cutscene.js` | Full-screen side-view scenes for hatching and for the rainbow fruit (`?scene=hatch` / `?scene=feed` to watch). `main.js` `show()` saves the stage, then plays them. |
| `js/hud.js` | Goal chips, coins, bed and ride buttons, the map with the goal marker. |
| `js/act-kasteel.js` | Inside the castle: the garden with the six flowers and the rainbow (the end of the adventure, afterwards a toy) and the treasure room (coin heap, a chest with three real coins a day). |
| `js/act-race.js` | The unicorn race, started at the arch in the village (`MAP.RACE`): tap to jump, nobody loses, the place and the stars become coins. Rides `Q.raceMounts()`. |
| `js/world-rooms.js` | Walk-in rooms (`MAP.ROOMS`, carved into rock rows below `MAP.OUT_H`): the cave (a friendly grotto: light lavender stone, moss, glowing mushrooms and crystals, no bats; Oscar found the dark one too scary; two rooms, the crate puzzle, the egg in the back room) and the castle hall (coins on the floor, chest, golden door to the garden). Door tiles are handled by `goThrough` in `world.js`; indoors the light dims (`stepIndoor`). |
| `js/world-sea.js` | The open sea east of the beach, all of it answering a tap (also from the boat: `world.js` hands taps on meshes with `userData.sea` to them instead of steering): the lighthouse (beam turns), the seals play ball (tap a seal, the ball flies to it), five jellyfish that each sing a note and glow, dolphins (tap one mid-leap: a flip, and the pod keeps playing), the fishing boat's bear throws her a fish (`Q.giftOnce('beervis')`), the turtle swims beside the boat for a while, the palm islet chest, and the rainbow arrow while the fruit is the goal. Nothing at sea calls out by itself. |
| `js/world-ways.js` | Two animals per island, each with its own way of saying hello and something more if she keeps playing (first tap; the next tap within 6 s lifts it, unless the way is `repeat`): dorp hondje (rolls over; every third hello digs: a coin once a day, else a boot) and kip (egg, chick follows; ducks dive in the pond); bos egel (ball; a tap bowls it, what it bumps shakes) and uil (asleep by day; tapped while awake: stars); wei schaap (fluff until poof) and hertje (stand still: it nuzzles her, flowers come up); strand krab (dances, copies her jumps, digs in) and meeuw (fetches her a fish); eiland konijn (down a hole, up another; tap it while it peeks: found) and papegaai (on her shoulder, repeats her sounds); kasteel pauw (fans its tail, every tap a new colour) and draakje (smoke ring, smoke ring, flame: fireworks). `far` ways (hertje, meeuw, papegaai) start without her walking over. Art in `js/art-ways.js`. `c.way` makes `world.js` skip the animal's wandering; `c.sq` scales its sprite. |
| `js/world-fly.js` | Flying: a grown unicorn has wings (hers once `Q.canRide()`, or an old unicorn friend walking along). The wing button (`#b-fly`, hud.js) takes off and lands; while up every button lands, a tap or held finger steers, the joystick and keys fly. The map flies her when the place is far (`world.travel`). She only lands where she could have walked from where she took off (`reachable`: gates stay gates, the boat counts, doors do not); a landing over a closed place glides to the nearest open tile. The flyer is its own character (`makeFlyer`); her unicorn or the friend is hidden meanwhile. `__w.fly` (`start`, `land`, `info`, `can`); `node t.mjs fly`. Art in `js/art-wild.js`. |
| `js/world-boomhut.js` | The treehouse in the forest's east lobe (`MAP.TREEHOUSE`, room `MAP.ROOMS.hut`, up the ladder): a telescope (each tap a blink to another island: `ctx.peek`), the squirrel's acorns (a coin once a day), a hammock to swing in, and at the back the zipline (`MAP.ZIP`, the room's `zip` tile): she slides over the water down to a pole in the village. The squirrel (Eekhoorn, world-ways.js) runs up the oak and tosses her acorns. `__w.hut`; `node t.mjs boomhut`. |
| `js/world-fish.js` | Fishing at the end of the old pier (`MAP.FISH`): cast, the float bobs, a tap or the jump key reels in a fish (it flips back into the sea), a boot, seaweed, a duck, a shell, a bottle with a coin once a day. |
| `js/art-isles.js` | The plants, rocks and animals that make each island its own. |
| `js/act-*.js` | One activity per building: `export const meta`, `export function open(root, api)` returning a cleanup fn. |

New art goes in `art.js`, new rules in `quest.js`, new places in `map.js`; keep `world.js` edits to small hooks.

## Islands, gates and the world per cycle
- Every area is its own island (`MAP.ISLES`: dorp, bos, wei, strand, eiland, kasteel; an island can have extra lobes in `more`). Ways between them: wooden bridges, the boat (`MAP.BOAT`), the zipline from the treehouse to the village (one way, both open from the start), and flying on a grown unicorn. Every new way must keep the gate tiers (`flood` in map.js): join islands of the same tier or carry the same gate.
- `block[]` in `map.js`: 0 free, 1 solid, `LOW` (jumped over automatically, in a straight line), `BREAK` (needs the tool in `TOOL_FOR`), `GAP` (only jumped while riding; walkable once the stage is `feest`).
- `reach0` / `reach1` / `reach2` / `reach`: what can be reached with nothing / shears / shears + hammer (incl. boat) / riding too. `validate` checks nothing leaks.
- One house per island with people (`MAP.HOUSES`). No labels on houses, only twinkles at the door.
- One girl is on screen (`kid` in `world.js`); the sisters switch with the two faces in the HUD (`world.setWho`, saved in `state.extra.who`). Anna is the small blond one, Fenna the taller one with brown hair.
- `Q.mapSeed()` is 0 in the first cycle and new for every later one; `buildMap({ seed })` reshuffles everything outside the village and skips seeds that fail `MAP.validate`. `main.js` destroys and rebuilds the world when the seed changes (on leaving the huisje).
- Anything added to the world must go away in `destroy()`: pass `listen` to `addEventListener`, return an unsubscribe from `Q.on`.

## Verify: `node t.mjs <island>` first
Work island by island: `node t.mjs strand` runs the unit tests plus every browser test section about that island, three side by side, in about a minute (it starts `serve.py` if needed). `node t.mjs look bos wei` only screenshots islands; `node t.mjs adventure|life|pickup|powers|weather|houses|bed|castle|zee` runs one theme; `node t.mjs all` runs everything (about 10 minutes): do that once before committing. Headless Chrome renders on the Mac's GPU (Metal) at 60 fps, ten times faster than SwiftShader (`GL=soft` brings that back). Because it runs at real speed now, timing-dependent bugs show up as on a phone (a thrown pebble flew out of the dog's fetch range; only seen at 60 fps).

Single files still work (server: `python3 serve.py` in the project folder; plain `python3 -m http.server` drops connections under load):
```bash
node tests/map.test.mjs            # add -v for an ASCII map
node tests/quest.test.mjs          # 12 full cycles without a browser
node cdp.mjs tests/t-adventure.mjs # start screen, dream and one whole adventure in headless Chrome, screenshots in tmp-shots/a-*.png
node cdp.mjs tests/t-toys.mjs      # every island's toy, the stall, bike and boat (ONLY=dorp,fiets,bos,wei,strand,boot,eiland,kasteel; tmp-shots/y-*.png)
node cdp.mjs tests/t-houses.mjs    # every house opens, taking turns between the girls (tmp-shots/h-*.png)
node cdp.mjs tests/t-areas.mjs     # screenshot every island (ONLY=bos,strand to limit)
node cdp.mjs tests/t-bed.mjs       # bedroom per stage (STAGE=ei,baby,vriend,feest)
node cdp.mjs tests/t-perf.mjs      # draw calls per island
node cdp.mjs tests/t-castle.mjs    # old unicorns in the village, castle garden + treasure room, race (ONLY=wei,kasteel,race; tmp-shots/c-*.png)
node cdp.mjs tests/t-pickup.mjs    # real pointer: drag and tap to pick up an animal, puddle splash, riding left with the keys
node cdp.mjs t-doors.mjs           # tapping/walking into every building
node cdp.mjs tests/t-life.mjs      # feeding/friends, naps, jokes, dog fetch, fountain, paint (tmp-shots/l-*.png)
node cdp.mjs tests/t-powers.mjs    # old unicorns come along and use their power, under the sea, the clouds (tmp-shots/u-*.png)
node cdp.mjs tests/t-weather.mjs   # rain/frogs, leaf piles, snow + snowman (tmp-shots/w-*.png)
node cdp.mjs tests/t-ways.mjs      # every animal's own way, and the sea from the boat (ONLY=dorp,bos,wei,strand,eiland,kasteel,zee; tmp-shots/w-*.png)
./shot.sh "?go" out.png 390 700    # any viewport, e.g. phone
```
Always look at the screenshots; passing asserts do not show a sprite drawn in the wrong place.

- `?go` skips the start screen, the dream and the wake-up, `?dream` replays the dream, `?debug` exposes `window.__w` (`placeAt(x,z)`, `Q`, `MAP`, `extras.info()` (egg, star, fruit, gate), `tools.spot(id)`, `play.info()`, `setMount`, `renderer`).
- Jump to any stage: `__w.Q._reset({ stage: 'vriend' })` (then `giveTool` if the gates should open).
- Teleport with `placeAt` instead of walking. `cdp.mjs` takes `PORT=` (t.mjs gives each test its own port and profile), so several can run at once (they used to share a port).
- New sprites: add them to `tmp-art.html`-style sheet and screenshot it before using them in the world (`tmp-toys.html` has the toys and every outfit).
- `__w.toys.info()` / `__w.play.info()` show the state of every toy; `__w.toys.take('gieter' | 'emmer' | 'vlieger')`, `usePot(i)`, `build(x, z)`, `rustle(i)`, `peek()`, `openStall()`, `__w.play.steer(x, z)` drive them without tapping.
- `dev.html` is generated by `build-dev.py` from `index.html` (the test scripts and shot.sh rebuild it).

## Pitfalls already hit
- `speak()` cancels the previous sentence: say everything for one moment in a single call.
- Two billboards at the same depth flicker: every character has its own `zBias`.
- World characters are scaled through `c.baseScale`, not `mesh.scale` (the breathing animation overwrites it).
- Hidden characters are still hit by the raycaster; the tap handler skips `!c.g.visible`.
- Vegetation is instanced per (kind, seed); things that must be tappable or animated need their own mesh.
- Trees directly south of a walkable spot hide the player and items; `map.js` thins them in front of trails and never spawns items behind something tall.
- The stal only opens once a unicorn has hatched; tests that enter it must set a stage first.
- A teleport or boat arrival next to water: pass `placeAt(x, z, dx, dz)` so the follower lands on land.
- Characters go through `ART.hd` (2x pixels, eye glints) in `makeChar`; use `charGeom`, not `spriteGeom`, for their meshes.
- Riding must never have to be discovered: after the fruit scene she is mounted, and walking up to the hole in the bridge mounts her and jumps (`world-tools.js`).
- Cutscenes run several times slower in headless Chrome: tests tap `#scene` to advance or click `#scene .skip`.
- When ridden, the girl is drawn behind the unicorn (`seat()` in `world.js`), otherwise in front.
- A trailing `// comment` added by a scripted edit on a one-line `{ ... });` swallows the closing braces: check every module with `node --input-type=module --check < file`.
- While she is in the boat `busy` is true (no walking, no keys) but taps still arrive: `world.js` hands them to `play.steer`.
- Toys are plain sprites that do not block: never change `M.block` at runtime for them (reachability is checked once, in `map.js`).
- The first tap on an animal shows its own way (`world-ways.js`), the second lifts it (she carries it above her head; tap it again or the jump button throws it, tap her puts it down); dragging and Enter lift at once. Things must not need discovering. Tests that want a lift set `a.wayAt = performance.now()` first.
- Calm: of the old unicorns in the meadow only the nearest looks up when she comes by. Animals wander every 3-8 s, old unicorns every 7-15 s.
- Headless Chrome can be slow: the opening dream took ~60 s there on 2026-11-23 (tests wait 90 s). Random animal spots make tests flaky; put animals on a fixed open tile (e.g. 32.5, 46.5).
- An old unicorn from the meadow is not lifted by a tap (it comes along); other animals are. `life.update` drops friends that `syncHerd` removed.
- Rain puddles (`M.puddles`) block nothing: walking through splashes, jumping in splashes a lot. Only logs are jumped over.
- The stable (feed, wash, brush) stands on the castle island; it is open in `baby`, `vriend` and `feest` (`Q.stalOpen`).
- Small things that roll or lie around (balls, star, fruit) go through `ctx.seeThrough` so they show through whatever stands in front; star and tool spots need `clearView` in `map.js`.
- Map rows `OUT_H`..`H` (96..123) are rock with the rooms (the hall at z 108-119, the cave at z 109-119); anything that picks spots outdoors must stay below `OUT_H` (`pick` in map.js does). The map screen shows only rows `< OUT_H`.
- The boat is steered by the child (keys or taps); it never sails off by itself. Docks: east end of the beach ↔ west pier of the rainbow island.
- `rm` and `cp` are aliased to ask first in this shell: use `command rm -f`.
- The round button bottom right (and Space) is the action button: `action()` in `world.js` picks what fits right here and the HUD shows its picture (polled every 120 ms): reel in, bell, throw / put down what she holds, sword or hammer on brambles/boulders and the waiting tool (`tools.nearAction`), splash in the water, hop into the pond or fountain, hello (talk icon) to her unicorn, an old unicorn or the gnome, lift the animal or pebble next to her (its own picture; ducks and animals busy with their hello are skipped), take a toy, get on the bike, else jump. A sand tower, puddle or leaf pile under her always means jump. `__w.action().key` tells tests what it would do.
- The joystick (bottom left, `#stick` in `hud.js`) feeds `world.stick(x, z)`; it is read in `frame()` like the arrow keys (also steers the boat). The tools row sits above it.
- Jumping is a real leap (`leap()` in `world.js`): while she moves (input in the last 0.25 s or a path) the action button always jumps, forwards up to 1.6 tiles (`clearLeap`: never across water or walls, only over LOW things). Standing still it jumps onto a top within reach (`tops`: stumps, hay bales, beach rocks, the cave crate) or does the context action. She stands on a top (`perch`, `kid.lift` = its height); any step off is a jump down. Leaping at an animal bounces her off its back (it squashes, says its sound, hops). Landing stomps towers and leaf piles. Under the rainbow tree with the fruit the button jumps (that shakes it).
- The cave (`MAP.ROOMS.grot`) has two rooms split by `wall` with a crystal gate (`gate`, blocked at runtime only, so `map.js` reachability still holds). Push the crate (`box`) onto the button (`plate`): walking into it pushes one tile, a tap pushes it the right way (`nextPush` searches), a crate that can no longer reach the button puffs back home. Solved stays solved (`state.extra.grotOpen`). The egg lies in the back room. Walking to the back room while it is shut goes to the crate (`rooms.towardGate`). `__w.rooms.puzzle()` / `tapBox()` / `reset()` for tests; `node t.mjs jump`.
- Hidden meshes in `pick` no longer take taps (the gnome's hammer used to swallow taps on the stump next to it).
- The duck pond is a place to stay, not a cutscene (`world-life.js` `WATERS`); the fountain is not (she vanished behind its rim: Oscar found it buggy). A tap on the fountain splashes, with the can it fills it: she hops in (`dip(kind, x, z)` puts a jump point in `kid.path`), lands with a splash, paddles freely inside the `swim` circle (keys, held finger, taps in the water) and is never busy; walking against the edge or a tap on land hops her out (`landToward` in `world.js`) and `resume` walks her on. Her unicorn waits on the shore. `life.swimming()` says where she is.
- Enter (or E) is the pick-up key: `grabKey` runs `action(true)`, the same choice as the action button minus every jump, so the two can never disagree. The nearest thing wins (animal, pebble or toy alike); ducks are never lifted. Space jumps.
- One rule per thing for every input (Oscar: hitboxes felt wrong when tap, button and key each had their own rules): what a tap on a toy does, the action button and E next to it do too, and walking into it does too where that makes sense (the can by a pot pours, `toys.nearUse` / `toys.bumpAt`). The can fills by itself at the water and pours by itself when she stops next to a thirsty pot; never make a step depend on a button the child has to guess.
- Things that stand (sword stone, gnome, waiting hammer, flower pots, hiding bushes, the atelier's easel, the stable's hay) are solid at runtime via `ctx.solid(x, z, on)` (a set checked by `walkable`, not `M.block`). `solid` refuses (returns false) where it would cut a way in two (the free tiles around it must stay one ring), so reachability from `map.js` still holds in every reshuffled cycle; a bush that is refused stands a tile further. Animals, the bike, carried toys, pebbles, the race arch and doors stay walk-through on purpose. Never let her walk through or stand on something that looks solid.
- Thrown into the water: an animal swims back (`c.swim`), a pebble sinks and washes up again at its spot, a ball floats and a gust blows it ashore. Animals and pebbles are see-through behind trees (`c.ghost`).
- Sprites are depth-tested as an upright card at their spot (`flatDepth` in `world.js`), so a leaning card can never poke into a house or castle wall and lose a head. Every standing sprite must get its material from `spriteMat` (or `flatDepth`); things lying flat on the ground (`lean` > 1) keep the ordinary depth test. Sprites sort by the z of their spot: something drawn over another must stand a little further south (e.g. a carried animal at +.1, the girl's `zBias` is .06).
