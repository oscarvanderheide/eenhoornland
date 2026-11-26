# How a paper figure is drawn

The rules behind the figures Oscar approved (the sisters in `kids.js`, the unicorns in `figures.js`, the sheep and the duck in `set-eiland.js`). A new figure follows them, so it looks cut by the same pair of scissors.

## What a figure is

- A drawing on a canvas, made of **few, clean pieces of coloured paper** glued on top of each other, on a white backing card that follows the outline. `cutout()` in `cut.js` makes the card; you only draw the pieces.
- Drawn in code with the shapes in `cut.js`: `E` (ellipse), `S` (a smooth closed shape through points), `C` (a rounded limb), `U` (several shapes as one piece), `P` (straight cut edges). Nothing else: no gradients, no outlines, no strokes for shapes.
- `piece(g, colour, shape, lift)` is one piece of paper; it casts a small shadow on what lies under it. Draw back to front. `lift` under 1 for something small glued flat (a muzzle, a cheek patch).
- `ink()`, `line()` and `eye()` are printed on: they only show inside the outline and have no thickness. Use them for eyes, nostrils, a mouth, stripes, whiskers. **Anything that sticks out of the body must be a `piece()`**, or the backing card will not follow it.
- A draw function is `draw(g, f)`: `f` is the frame. It is called twice by `cutout()` (outline, then colour), so it must not depend on anything but `g` and `f`, and must not use randomness.

## Proportions and face

- **Round and chubby, big head, short legs, no neck.** A head about as big as the body is right for a baby animal. Aim for 8 to 16 pieces; the sheep has 20 because wool is lumps.
- **Dot eyes** with `eye()` (dark oval, white glint), radius 4 to 6 on a 200-wide canvas. One eye in side view. No eyebrows, no eyelashes, no pupils. Shut eyes are a short dark `line()` curving down.
- A soft pink cheek: `ink(g, 'rgba(240,120,150,.4)', E(...))`.
- Friendly, never fierce: no teeth, no claws, no frown.

## Colour

- Warm, slightly dusty, like sugar paper. Never pure white (use `#FCF8F1`, `#F4ECDC`), never pure black (use `#33262E`, `#4B3D3D`).
- Two tones per body colour: the main one and a shade a little darker for the far legs and the underside (far legs are drawn first, in the shade colour).
- One accent per animal at most (a red comb, an orange beak, a pink nose).
- The game's palette so far: creams `#FCF8F1 #F4ECDC #E2D6C1`, pinks `#F4A6C4 #F8DDE4`, lilac `#BBA6EA`, mint `#9ED9CF`, mustard `#E6B748 #CF9C35`, orange `#E2803E`, browns `#7A5A3E #8D6A48 #C79A66`, dark `#4B3D3D`.

## Canvas, facing, size

- Every figure **faces right**; the world flips it. The feet stand on the bottom of the drawing with about 10 units of margin; leave 10 or more round the whole figure for the backing card.
- Canvas about 140 to 200 wide. `size` is the figure's height in the world, in steps: Anna is 1.2, Fenna 1.38, the baby unicorn 1.0, the sheep .95, the duck .7. A hen is about .55, a dog .8.

## Frames

- Frame 0 stands. A simple walker has frames 1 and 2 (legs a few units forward and back: `const sw = f === 1 ? 1 : f === 2 ? -1 : 0`). The sisters and the unicorns have 12 walk frames (`WALK`, `swing(f)`); only who walks a lot needs that.
- Extra frames after the walk are things it does: curled up, asleep, mouth open. Say in a comment which frame is what.
- Figures move like stop motion: a pose is held, never tweened. Keep the difference between frames big enough to read at 50 points tall.

## On the sheet

Every figure goes on a sheet (`figures.html`, `animals.html`) at the size it has next to Anna, and Oscar approves it there before it gets a part in the game.
