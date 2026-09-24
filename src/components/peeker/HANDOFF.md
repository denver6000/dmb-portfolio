# Handoff: Peeker critters

**Status (2026-09-24):** working and tested on desktop and phone sizes in headless Edge.
Not tested in Safari, Firefox or on a real touch device.

**Not committed yet:** the Codex redraw, the no-fly and more-frequent behaviour, this handoff,
and `scripts/peeker-check.mjs`. The earlier version (climbing Codex, chase-the-scroll) is in
commit `80a3728`.

Two pixel critters, **Clawd** (Claude Code's mascot) and **Codex** (OpenAI Codex's
cloud-headed mascot), hide behind cards on the public portfolio. They peek out, look
around, duck when the cursor gets close, and pop out to slap links and buttons you click.

For API and usage, read [README.md](README.md). This file covers what was decided, how it
works inside, and what to watch out for.

---

## Files

| File | What it is |
| --- | --- |
| [Peeker.tsx](Peeker.tsx) | The whole engine: `PeekerStage` (default export), the `Critter` behaviour, `PixelArt` and `withOutline` helpers. Only needs `react` and `framer-motion`, and is meant to be copied into other projects. |
| [sprites/clawd.tsx](sprites/clawd.tsx) | Clawd sprite. Orange, 13×7 pixels at 4px. Its right arm is drawn separately so it can slap. |
| [sprites/codex.tsx](sprites/codex.tsx) | Codex sprite. Cloud head, navy screen face with cyan `>_`, `>-` chest mark, 18×19 pixels at 3px. Its right arm is drawn separately. |
| [README.md](README.md) | Usage, props and how to make sprites. |
| [scripts/peeker-check.mjs](../../../scripts/peeker-check.mjs) | Headless-browser behaviour check (`npm run check:peeker`). |

**Where it's wired into the site:**
- **Stage:** [Portfolio.tsx](../../portfolio/Portfolio.tsx) mounts `<PeekerStage critters={[clawd, codex]} viewportTop={64} />`. `64` is the fixed header's height.
- **Hideouts** (`data-peeker-hideout`):
  - the hero Location/Focus/Email card, with `="home"`, in [Hero.tsx](../../portfolio/Hero.tsx)
  - the skill cards in `Portfolio.tsx`
  - every timeline card in [TimelineItem.tsx](../../portfolio/TimelineItem.tsx)
- **Eye colour:** `--peeker-eye` in [index.css](../../index.css) is set to the page background, so Clawd's eyes look like holes.
- The admin page (`/login`) doesn't use it.

---

## Behaviour the owner asked for

This is the current spec, built up over several requests. The notes explain why things
are the way they are.

1. **Peek from cards in view.** Every 0.9–2.6 s a critter picks a card and an edge, slides
   out until its face shows, and looks left or right. Sometimes it creeps along the edge
   (45%) or climbs out further (35%), then ducks back. The owner asked for "a little bit
   more often"; it used to be every 1.5–4.5 s.
2. **Move between cards unseen.** Between peeks there's a 40% chance (`wander`) of slipping
   to another card that's at least half visible. When you scroll, a critter whose spot
   leaves the screen ducks. About 0.25–0.9 s after scrolling stops, they reappear on cards
   in view.
   - **The owner rejected a "chase the scroll" version**, where critters ran and hopped
     across the page. Don't bring back visible travel between cards.
3. **Shy.** A peeking critter goes wide-eyed and hides if the cursor comes within 110px, or
   on a tap within 60px. It then waits a bit longer before peeking again.
4. **Slap.** Clicking anything matching `a, button, [data-peeker-slap]` sends the nearest
   free critter to duck out of sight, come out from behind the clicked element, wind up,
   and hit it: spark, the element gets bumped, and a 35% chance of a second slap.
   - **Links are held about 0.5 s** until the first hit lands, then followed with
     `followLink()`: new tab via `window.open`, `#anchor` via smooth scroll plus
     `pushState`, otherwise `location.href`. Without the hold, new-tab links switched tabs
     before the slap could be seen.
   - Ctrl/Cmd/Shift/Alt and middle clicks are never held. If both critters are busy, the
     click goes through normally. Turn the hold off with `holdLinks={false}`.
5. **Codex has no hands.** It used to be a climber whose separate hands gripped the edge.
   The owner asked to remove them and keep plain peeking.
   - The engine still supports climbers (`sprite.hands`). The owner specifically asked that
     hands **lift off the edge before dropping behind it**, and reach up before clamping
     on, rather than sliding into the card. That's what `grab()` and `letGo()` do. Keep it
     if you add a climber.
6. **Codex's look comes from the owner's reference sheet** of the official mascot: blue
   cloud head, dark screen face with cyan `>_`, small body with a `>-` chest mark.
   Expressions: `– –` blink, wide eyes when startled, `^ ^` on the slap hit.
7. **Reduced motion:** both sit still, peeking over the home card. No moving, no slapping.

---

## How it works

**One fixed layer.** `PeekerStage` renders a `position: fixed; inset: 0` layer, z-index 60,
with `clip-path: inset(viewportTop 0 0 0)` so nothing is ever drawn over the header. Every
critter lives in it.

**"Behind" is a clip, not z-index.** Each critter is an anchor div positioned on a hideout
edge every frame, from `getBoundingClientRect()` in a `requestAnimationFrame` loop, so it
follows the page as you scroll.
- **Rotation:** the anchor is rotated per edge: top 0°, right 90°, bottom 180°, left −90°.
  Sprites are always drawn "standing up", and the rotation handles the rest.
- **Clip box:** inside the anchor, the body sits in a box that ends exactly at the edge line
  (`overflow: hidden`). Moving the body's local `y` up or down makes it come out from, or
  go back behind, the card. So hideouts need no z-index, but **they must be opaque**.
- **Body positions** (local y, positive means further behind the edge):
  - `BODY_HIDDEN = H + 2`
  - `BODY_PEEK = H − sprite.peek`
  - `BODY_CURIOUS = H − sprite.curious`
  - These are animated with framer-motion's `animate(el, { y })`.
- **Climbers' hands** have their own clip box with two heights (`handsClip`): `'grip'`
  lets the fingers overlap the card's front, `'behind'` cuts them at the edge line.

**Behaviour routines and cancellation.** Each critter runs one async routine at a time:
`idle`, `duck`, `scare` or `slapIt`.
- `run(routine, nextWait)` bumps a generation counter (`gen`). Every routine checks
  `alive(g)` after each `await` and quits if it's stale. When a routine finishes, the
  critter goes back to `idle`.
- **This is how interruptions work.** A newer routine takes over, and a new `animate()` on
  the same element replaces the running one. If you add a routine, check `alive(g)` after
  every `await`.
- `busy` (slapping) makes scroll events and scares ignore that critter.
- `peeking` (visible at a hideout) is what makes it shy.

**Claims.** `stage.claims` records where each critter is **currently peeking**. It's set
when a peek starts and cleared after ducking. `takenByOther(el, edge, pos)` stops two
critters peeking within `1.4 × width` of each other on the same edge.
- **Don't hold claims while hidden.** That caused a real bug: on a phone only the hero
  card's top edge fits a critter, and Clawd kept it reserved, so Codex never peeked.

**Where they can peek.** `edgeFits()` requires the edge to be long enough
(`1.6 × sprite width`) and to have room outside it (`sprite.curious` px), all on screen
below the header. Side edges are only used on screens ≥ 1024px wide.

**Stage events.** The stage turns scrolling into `'scroll'` and `'scrollend'` events (200ms
after the last scroll):
- `'scroll'`: a peeking critter whose spot is less than 60% visible, or whose anchor is
  under the header or off screen, runs `duck`.
- `'scrollend'`: any critter that isn't peeking restarts `idle` with a short wait. `idle`
  moves it to an on-screen card if its current one isn't.

**Slap click handling** runs in the capture phase on `document`. It picks the nearest
critter that isn't busy by the distance of its last anchor point, and calls
`api.slap(el, onHit)`. `onHit` fires at the first hit and again in `finally`, where it's a
no-op if already called. There's also a 1.5 s fallback timer. Both exist so a held link
always opens.

---

## Tuning knobs

| Where | Knob | Now |
| --- | --- | --- |
| Stage prop | `delay` | `[900, 2600]` ms between peeks |
| Stage prop | `wander` | `0.4` chance to switch cards between peeks |
| Stage prop | `shyRadius` | `110` px |
| Stage prop | `viewportTop` | `64` (header height) |
| Stage prop | `holdLinks` | `true` |
| `idle()` | creep / curious chance | `0.45` / `0.35` |
| `idle()` | looks around | 1–3 times, 0.4–0.9 s each |
| `slapIt()` | double-slap chance | `0.35` |
| `scare()` | wait after a scare | `1.5×` the normal delay |
| Sprite | `peek` / `curious` | Clawd `16` / `24` px, Codex `33` / `45` px |
| Sprite | `slapX` | where the spark appears (px from the sprite's centre) |

---

## Verifying

```bash
npm run build
```

```bash
npm run dev
```

In a second terminal:

```bash
npm run check:peeker
```

```bash
npm run check:peeker -- --size 390x844
```

Add `--shots ./tmp-shots` to save screenshots. `check:peeker` drives a headless
Chrome/Edge over the DevTools protocol; set `BROWSER=/path/to/chrome` if it isn't found.
It checks four things:

1. Every critter peeks at the top of the page within 20 s.
2. Nothing shows away from its card while scrolling. Up to 3 sampled frames are allowed
   for the quick duck as a card slides under the header, which the header clip hides anyway.
3. Every critter reappears on a card in view within 4 s after scrolling stops.
4. Clicking a project link produces a slap spark.

**Last run** (2026-09-24, all passing):
- **Desktop 1280×900:** 2 and 5 peeks in 20 s, 0 stray frames, reappeared after 662ms, Clawd slapped.
- **Phone 390×844:** 4 and 4 peeks, 2 stray frames, reappeared after 945ms, Clawd slapped.

**Everything is random**, so counts vary between runs. For visual review of a sprite,
render `<sprite.Body {...state} />` for each state on a dark background. That's how the
Codex art was checked; the temporary preview page was deleted afterwards.

---

## Known limitations and risks

- **The link hold changes click behaviour site-wide.** Every link or button click waits
  about 0.5 s while a critter is free, including header nav and contact buttons.
  - `window.open` runs about 0.5 s after the click. Chrome and Firefox allow that (a
    roughly 5 s window after a click). **Safari hasn't been tested** and has a shorter
    window, so new-tab links could be popup-blocked there.
  - If that's a problem, use `holdLinks={false}` or narrow `slapSelector`.
- **After a new-tab link opens, the page is in the background** and animations pause. The
  critter finishes its slap when you come back to the tab. That's expected, not a bug.
- **Half-plane clip.** The clip cuts along the whole edge line, not just the element's
  width. On an element narrower than the critter (small buttons), the critter can look
  like it's hiding behind empty space past the ends. `edgeFits` avoids this for peeking,
  but slaps skip that check on purpose.
- **Timeline cards fade in** (framer `whileInView`). Critters only use cards at least 50%
  visible, so they don't land on a card that's still invisible.
- **Mascots.** Clawd is Anthropic's character and Codex is OpenAI's. Both are drawn from
  scratch as pixel art, not copied assets, but they're still those companies' characters on
  a public site.
- **Lint:** 4 expected warnings. Three are `only-export-components` in the sprite files
  (they export config objects). One is `exhaustive-deps` in a cleanup that bumps a counter
  ref on purpose.
- **Tested only in headless Chromium/Edge.** Nothing has been tried on a physical phone
  (touch, tap-to-scare, iOS popup rules).

---

## Ideas not done

- **More Codex expressions from the reference sheet:** hearts, sleepy `z z`, `? ` confused,
  holding a laptop or book. `SpriteState` could carry a random `mood` picked per peek.
- **Idle cursor-follow:** eyes tracking the cursor while peeking, via `look`.
- **A climber sprite** to use the `hands` support that still exists in the engine.
- **Pause when the tab is hidden** (`document.hidden`) so timers don't pile up. rAF
  already pauses, but `setTimeout`-based waits don't.
