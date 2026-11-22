---
name: eenhoornland-dev
description: How to add features to or fix bugs in Eenhoornland (the HD-2D pixel-art unicorn game for two young children) and prove they work. Use for any change to js/*.js, new areas, items, animals, quest stages, sprites, or when asked to test or screenshot the game.
---

# Working on Eenhoornland

The players are two young children who cannot read. A bug that blocks them ends the fun, so every change is verified in a real browser before it is called done.

## Rules of the game design
- No fail states, no timers, no text-only information: nobody can read and the voice is off (`audio.js`), so every goal is a picture chip, a picture bubble, or a marker on the map. `speak()` calls stay (for a later voice).
- Anything a child can be sent to must be reachable. `map.js` fills unreachable pockets and `tests/map.test.mjs` asserts it, in the order of the adventure.
- State changes are saved first, animated after (see `act-huisje.js`), so closing a screen mid-animation never loses progress.
- The houses are only for fun: nothing in the adventure depends on them. The unicorn never grows into the big sprite.

## The adventure (one cycle)
Start screen (pick Anna or Fenna) → dream (`dream.js`) → `zoek`: the egg lies in the forest → `ei`: shears appear in the village, cut the brambles on the bridge, a fallen star in the flower meadow hatches the egg → `baby`: hammer appears in the forest, smash the boulders, take the boat to the rainbow island, eat the rainbow fruit → `vriend`: she can be ridden (tap her or the ride button), jump the hole in the bridge to the castle, ride to the unicorn meadow → `feest`: a rainbow mends the bridge, go to bed → new dream, new egg (on another island), new world seed. Tools are kept; gates close again every cycle.

## Where things live
| File | Role |
|---|---|
| `js/map.js` | The world as pure data: islands (`ISLES`), ground, blocked tiles, bridges (`deck`), gates, trees/props, spawn spots, egg / star / tool spots. No DOM. |
| `js/quest.js` | The stages above, tools, coins, herd. Pure logic, emits events. `wishes()` is the list of goal chips. |
| `js/art.js` | Ground painter, prop/item/animal sprites, eggs, the little unicorn, star, fruit, bike, ball. |
| `js/world.js` | three.js scene, sea (distance-to-land mask), movement, riding (`setMount`), input, camera. Hands a toolbox (`ctx`) to the files below. |
| `js/world-extras.js` | Fence, castle, animals, collectibles, hidden egg, star + hatching, fruit, meadow herd. |
| `js/world-tools.js` | Logs and puddles (jumped), brambles and boulders (tool), the hole in the bridge (ridden unicorn), the two tools. |
| `js/world-play.js` | Bike, balls, the boat between the beach and the rainbow island. Nothing here is saved. |
| `js/world-life.js` | Just for fun: pick up and throw animals, birds (scarecrow), tappable trees/bushes/props, butterflies, jumping fish. |
| `js/dream.js` | The opening dream cutscene. |
| `js/cutscene.js` | Full-screen side-view scenes for hatching and for the rainbow fruit (`?scene=hatch` / `?scene=feed` to watch). `main.js` `show()` saves the stage, then plays them. |
| `js/hud.js` | Goal chips, coins, bed and ride buttons, the map with the goal marker. |
| `js/act-*.js` | One activity per building: `export const meta`, `export function open(root, api)` returning a cleanup fn. |

New art goes in `art.js`, new rules in `quest.js`, new places in `map.js`; keep `world.js` edits to small hooks.

## Islands, gates and the world per cycle
- Every area is its own island (`MAP.ISLES`: dorp, bos, wei, strand, eiland, kasteel). The only ways between them are wooden bridges and the boat (`MAP.BOAT`: stand on the end of a pier and it sails by itself).
- `block[]` in `map.js`: 0 free, 1 solid, `LOW` (jumped over automatically, in a straight line), `BREAK` (needs the tool in `TOOL_FOR`), `GAP` (only jumped while riding; walkable once the stage is `feest`).
- `reach0` / `reach1` / `reach2` / `reach`: what can be reached with nothing / shears / shears + hammer (incl. boat) / riding too. `validate` checks nothing leaks.
- One house per island with people (`MAP.HOUSES`). No labels on houses, only twinkles at the door.
- One girl is on screen (`kid` in `world.js`); the sisters switch with the two faces in the HUD (`world.setWho`, saved in `state.extra.who`). Anna is the small blond one, Fenna the taller one with brown hair.
- `Q.mapSeed()` is 0 in the first cycle and new for every later one; `buildMap({ seed })` reshuffles everything outside the village and skips seeds that fail `MAP.validate`. `main.js` destroys and rebuilds the world when the seed changes (on leaving the huisje).
- Anything added to the world must go away in `destroy()`: pass `listen` to `addEventListener`, return an unsubscribe from `Q.on`.

## Verify (server: `python3 -m http.server 8765` in the project folder)
```bash
node tests/map.test.mjs            # add -v for an ASCII map
node tests/quest.test.mjs          # 12 full cycles without a browser
node cdp.mjs tests/t-adventure.mjs # start screen, dream and one whole adventure in headless Chrome, screenshots in tmp-shots/a-*.png
node cdp.mjs tests/t-houses.mjs    # every house opens, taking turns between the girls (tmp-shots/h-*.png)
node cdp.mjs tests/t-areas.mjs     # screenshot every island (ONLY=bos,strand to limit)
node cdp.mjs tests/t-bed.mjs       # bedroom per stage (STAGE=ei,baby,vriend,feest)
node cdp.mjs tests/t-perf.mjs      # draw calls per island
node cdp.mjs t-doors.mjs           # tapping/walking into every building
./shot.sh "?go" out.png 390 700    # any viewport, e.g. phone
```
Always look at the screenshots; passing asserts do not show a sprite drawn in the wrong place.

- `?go` skips the start screen and the dream, `?dream` replays the dream, `?debug` exposes `window.__w` (`placeAt(x,z)`, `Q`, `MAP`, `extras.info()` (egg, star, fruit, gate), `tools.spot(id)`, `play.info()`, `setMount`, `renderer`).
- Jump to any stage: `__w.Q._reset({ stage: 'vriend' })` (then `giveTool` if the gates should open).
- Headless WebGL runs at a few fps: teleport with `placeAt` instead of walking. Run one `cdp.mjs` at a time (they share a port).
- New sprites: add them to `tmp-art.html`-style sheet and screenshot it before using them in the world.
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
