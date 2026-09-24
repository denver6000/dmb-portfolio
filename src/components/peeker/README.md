# Peeker

Shy pixel critters that live behind elements on your page. They peek out, chase the scroll,
and slap buttons when you click them. Only needs `react` and `framer-motion`; no CSS
framework.

```
peeker/
  Peeker.tsx          the engine: <PeekerStage> + the PixelArt helper. Copy this to reuse it.
  sprites/clawd.tsx   peek style: slides out, looks around, creeps along edges
  sprites/codex.tsx   climb style: hands grab the edge first, then it pulls itself up
```

## Use

Mark the elements they can hide behind, then mount one stage per page:

```tsx
import PeekerStage from './peeker/Peeker'
import { clawd } from './peeker/sprites/clawd'
import { codex } from './peeker/sprites/codex'

<div data-peeker-hideout="home">…the card they start behind…</div>
<div data-peeker-hideout>…another card…</div>
<div data-peeker-hideout>…another card…</div>

<PeekerStage critters={[clawd, codex]} viewportTop={64 /* fixed header height */} />
```

Hideouts should have an opaque background. Being "behind" an element is faked by clipping
the critter at the element's edge, so no z-index setup is needed.

## What they do

- **Peek:** every few seconds a critter slides out from an edge of its hideout, looks
  around, sometimes creeps along the edge or climbs out further, then ducks back. Climbers
  (sprites with `hands`) grab the edge first and hang there before pulling up.
- **Chase the scroll:** when their hideout scrolls mostly out of view, they climb out and
  run along with the page. When scrolling stops, they hop to the nearest visible hideout
  and dive behind it. Two critters never share the same edge.
- **Slap:** clicking a link or button (`slapSelector`) sends the nearest free critter to pop
  out from behind it and slap it (sometimes twice). A spark appears and the element gets
  bumped. Link navigation is held until the slap lands (about 0.5 s), then it opens as it
  would have: new tab, `#anchor` or normal page load. Ctrl/Cmd/Shift/Alt and middle clicks
  are never held, and if every critter is busy the click goes through right away.
- **Shy:** if the cursor comes within `shyRadius`, or someone taps near it, a peeking
  critter gets wide-eyed and hides.
- **Reduced motion:** visitors who prefer reduced motion just see them sitting still,
  peeking over the home hideout. No chasing and no slapping.

## `<PeekerStage>` props

| Prop | Default | |
| --- | --- | --- |
| `critters` | required | Array of `PeekerSprite`s (see below). |
| `hideoutSelector` | `'[data-peeker-hideout]'` | Elements they hide behind. |
| `homeSelector` | `'[data-peeker-hideout="home"]'` | Where they start (falls back to the first hideout). |
| `slapSelector` | `'a, button, [data-peeker-slap]'` | Clicking these triggers a slap. |
| `holdLinks` | `true` | Delay link navigation until the slap lands. |
| `viewportTop` | `0` | Height of a fixed header, so they don't hide under it. |
| `delay` | `[1500, 4500]` | Random wait between peeks, in ms. |
| `shyRadius` | `110` | Cursor distance (px) that scares a peeking critter. |
| `zIndex` | `60` | z-index of the page-wide critter layer. |

## Making a sprite

A sprite is drawn "standing" on the top edge, facing up. The engine rotates it for the
other edges.

```tsx
const mine: PeekerSprite = {
  width: 40, height: 32,       // px
  Body: MyBody,                // (state: SpriteState) => JSX
  peek: 16,                    // px shown above the edge when peeking
  curious: 28,                 // px shown when it climbs out further
  slapX: 14,                   // px from centre of the slapping limb (where the spark goes)
  hands: {                     // optional: turns on the climbing style
    Component: MyHands, width: 56, height: 16,
    grip: 6,                   // px of the hands overlapping the element's face
  },
}
```

`SpriteState` gives you:

- `look` (-1/0/1)
- `blink`
- `startled`
- `walking`
- `step` (0/1, alternating while walking)
- `slap` (`'windup'` → `'hit'` → `null`)

Use them to move the eyes, lift legs or hands, and swing the slapping limb.

`PixelArt` draws pixel art from text rows, one character per pixel:

```tsx
<svg viewBox="0 0 5 3" width={20} height={12} shapeRendering="crispEdges">
  <PixelArt rows={['.KKK.', 'KBBBK', '.KKK.']} palette={{ K: '#111', B: '#8b9cff' }} />
</svg>
```

Set `--peeker-eye` to your page background so Clawd's eyes look like holes.
