import { useEffect, useRef, useState, type ComponentType, type CSSProperties, type ReactElement } from 'react'
import { animate, useReducedMotion } from 'framer-motion'

/**
 * Peeker: shy pixel critters that live behind elements on the page.
 *
 * Self-contained: needs only `react` and `framer-motion` (no CSS framework).
 *
 * Mount one <PeekerStage> per page and mark hiding places with
 * `data-peeker-hideout` (and one with `data-peeker-hideout="home"` to start at):
 *
 *   <div data-peeker-hideout="home">…card…</div>
 *   <div data-peeker-hideout>…another card…</div>
 *   <PeekerStage critters={[clawd, codex]} viewportTop={64} />
 *
 * What they do:
 * - Peek: slide out from behind an edge of their hideout, look around, creep
 *   along the edge, then duck back. Sprites with `hands` climb instead: hands
 *   grab the edge first, then they pull themselves up.
 * - Chase the scroll: when their hideout scrolls away they climb out and run
 *   along; when scrolling stops they hop to the nearest visible hideout and dive
 *   behind it.
 * - Slap: clicking a link or button (see `slapSelector`) makes the nearest free
 *   critter pop out from behind it and slap it.
 * - Hide fast when the cursor comes close (or on tap). Reduced-motion visitors
 *   get them sitting still on the home hideout instead.
 *
 * "Behind" is faked by clipping the critter at the edge line, so hideouts need
 * no z-index setup; they only need to be opaque so the illusion holds.
 */

export type Edge = 'top' | 'right' | 'bottom' | 'left'
export type Look = -1 | 0 | 1
export type SlapPhase = 'windup' | 'hit' | null

/** What a sprite needs to draw its current frame. */
export interface SpriteState {
  /** Eye direction along the edge (-1 / 0 / 1), already corrected for the edge's rotation. */
  look: Look
  blink: boolean
  /** True for a moment after being scared. */
  startled: boolean
  walking: boolean
  /** Alternates 0/1 while walking: use it for leg or hand frames. */
  step: 0 | 1
  /** Slap animation: raise a limb on 'windup', bring it down on 'hit'. */
  slap: SlapPhase
}

export interface PeekerSprite {
  /** Body size in px. The body is drawn "standing" on the edge, facing outward (up). */
  width: number
  height: number
  Body: ComponentType<SpriteState>
  /** How many px of the body show above the edge when peeking, and when curious. */
  peek: number
  curious: number
  /** Horizontal offset (px from the centre) of the limb that slaps; the spark appears there. */
  slapX?: number
  /** Presence of hands switches to the climbing style. */
  hands?: {
    Component: ComponentType<SpriteState>
    width: number
    height: number
    /** px of the hands that overlap the element's face while gripping. */
    grip: number
    /** Room above the hands for lifting them (px, default 16). */
    reach?: number
  }
}

export interface PeekerStageProps {
  critters: PeekerSprite[]
  /** Elements they can hide behind. */
  hideoutSelector?: string
  /** Where they start (falls back to the first hideout). */
  homeSelector?: string
  /** Clicking one of these makes a critter slap it. */
  slapSelector?: string
  /**
   * Hold link navigation (~0.5 s) until the slap lands, so it's actually seen:
   * new-tab links would otherwise switch tabs instantly. Modified clicks
   * (ctrl/cmd/shift/alt, middle button) are never held.
   */
  holdLinks?: boolean
  /** Height (px) of a fixed header covering the top of the viewport. */
  viewportTop?: number
  /** Random wait between peeks, in ms. */
  delay?: [min: number, max: number]
  /** Cursor distance (px) that scares a peeking critter back into hiding. */
  shyRadius?: number
  zIndex?: number
}

// ---------- geometry ----------

type Pt = { x: number; y: number; rot: number }
type Spot = { kind: 'spot'; el: Element; edge: Edge; pos: number }
type Place = Spot | { kind: 'free'; x: number; y: number }
// `clip` keeps the critter clipped at the hideout edge while moving (creeping along it).
type Travel = { from: Place | Pt; to: Place; start: number; dur: number; hop: number; clip: boolean; done: () => void }

const rand = (min: number, max: number) => min + Math.random() * (max - min)
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)]
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerpAngle = (a: number, b: number, t: number) => a + ((((b - a + 540) % 360) + 360) % 360 - 180) * t

function pointOf(p: Place | Pt): Pt {
  if (!('kind' in p)) return p
  if (p.kind === 'free') return { x: p.x, y: p.y, rot: 0 }
  const r = p.el.getBoundingClientRect()
  const f = p.pos / 100
  switch (p.edge) {
    case 'top':
      return { x: r.left + f * r.width, y: r.top, rot: 0 }
    case 'bottom':
      return { x: r.left + f * r.width, y: r.bottom, rot: 180 }
    case 'left':
      return { x: r.left, y: r.top + f * r.height, rot: -90 }
    case 'right':
      return { x: r.right, y: r.top + f * r.height, rot: 90 }
  }
}

// Moving toward a higher `pos` is local +x on the top/right edges and local -x
// on the bottom/left ones (they're rotated 180° / -90°).
const toLocal = (edge: Edge, dir: number) => ((edge === 'bottom' || edge === 'left' ? -dir : dir) as Look)

function visibleFraction(el: Element, top: number) {
  const r = el.getBoundingClientRect()
  const h = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, top))
  const w = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0))
  return (h * w) / (r.width * r.height || 1)
}

/** Whether a critter needing `span` px along the edge and `out` px beyond it fits on this edge, on screen. */
function edgeFits(el: Element, edge: Edge, span: number, out: number, top: number) {
  const r = el.getBoundingClientRect()
  const vw = innerWidth
  const vh = innerHeight
  switch (edge) {
    case 'top':
      return r.width >= span && r.top - out >= top && r.top <= vh - 8
    case 'bottom':
      return r.width >= span && r.bottom + out <= vh && r.bottom >= top + 8
    case 'left':
      return r.height >= span && r.left - out >= 0 && r.top >= top && r.bottom <= vh
    case 'right':
      return r.height >= span && r.right + out <= vw && r.top >= top && r.bottom <= vh
  }
}

// ---------- stage ----------

type StageEvent = { type: 'scroll'; dir: 1 | -1 } | { type: 'scrollend' }
interface CritterApi {
  point(): Pt
  busy(): boolean
  /** `onHit` runs once, when the first slap lands (or if the slap is cut short). */
  slap(el: Element, onHit?: () => void): void
}
interface Stage {
  opts: Required<Omit<PeekerStageProps, 'critters'>>
  reduceMotion: boolean
  /** Which hideout edge each critter is using, so they don't pile up. */
  claims: Map<symbol, { el: Element; edge: Edge }>
  listeners: Set<(e: StageEvent) => void>
  critters: Map<symbol, CritterApi>
}

export default function PeekerStage({
  critters,
  hideoutSelector = '[data-peeker-hideout]',
  homeSelector = '[data-peeker-hideout="home"]',
  slapSelector = 'a, button, [data-peeker-slap]',
  holdLinks = true,
  viewportTop = 0,
  delay = [1500, 4500],
  shyRadius = 110,
  zIndex = 60,
}: PeekerStageProps) {
  const reduceMotion = !!useReducedMotion()
  // Created once; options are fixed for the stage's lifetime.
  const [stage] = useState<Stage>(() => ({
    opts: { hideoutSelector, homeSelector, slapSelector, holdLinks, viewportTop, delay, shyRadius, zIndex },
    reduceMotion,
    claims: new Map(),
    listeners: new Set(),
    critters: new Map(),
  }))

  // Scroll → 'scroll' events while moving, 'scrollend' once it settles.
  useEffect(() => {
    if (reduceMotion) return
    let lastY = scrollY
    let timer: ReturnType<typeof setTimeout>
    const emit = (e: StageEvent) => stage.listeners.forEach((l) => l(e))
    const onScroll = () => {
      const dir = scrollY >= lastY ? 1 : -1
      lastY = scrollY
      emit({ type: 'scroll', dir })
      clearTimeout(timer)
      timer = setTimeout(() => emit({ type: 'scrollend' }), 220)
    }
    addEventListener('scroll', onScroll, { passive: true })
    return () => {
      removeEventListener('scroll', onScroll)
      clearTimeout(timer)
    }
  }, [reduceMotion, stage])

  // Clicks on links/buttons → the nearest free critter slaps it.
  useEffect(() => {
    if (reduceMotion) return
    const onClick = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target.closest(stage.opts.slapSelector) : null
      if (!target) return
      const r = target.getBoundingClientRect()
      const dist = (p: Pt) => Math.hypot(p.x - (r.left + r.width / 2), p.y - (r.top + r.height / 2))
      const free = [...stage.critters.values()].filter((c) => !c.busy())
      free.sort((a, b) => dist(a.point()) - dist(b.point()))
      const critter = free[0]
      if (!critter) return // everyone's busy: let the click through untouched

      const link = target.closest('a[href]') as HTMLAnchorElement | null
      const plain = e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
      if (!link || !stage.opts.holdLinks || !plain) {
        critter.slap(target)
        return
      }
      // Hold the navigation until the slap lands (with a safety timeout).
      e.preventDefault()
      let followed = false
      const follow = () => {
        if (followed) return
        followed = true
        followLink(link)
      }
      critter.slap(target, follow)
      setTimeout(follow, 1500)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [reduceMotion, stage])

  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex }}>
      {critters.map((sprite, i) => (
        <Critter key={i} index={i} sprite={sprite} stage={stage} />
      ))}
    </div>
  )
}

// ---------- one critter ----------

const SLAP_DEPTH = 8 // px a hand may reach past the edge when slapping

function Critter({ sprite, stage, index }: { sprite: PeekerSprite; stage: Stage; index: number }) {
  const { width: W, height: H, Body, hands } = sprite
  const { delay, viewportTop: top, shyRadius } = stage.opts
  const reach = hands?.reach ?? 16
  // Local y offsets: positive = further behind the edge.
  const BODY_HIDDEN = H + 2
  const BODY_PEEK = H - sprite.peek
  const BODY_CURIOUS = H - sprite.curious
  const HANDS_HIDDEN = hands ? hands.height + SLAP_DEPTH + 2 : 0
  const slapX = sprite.slapX ?? W / 2 - 8
  const span = (hands?.width ?? W) * 1.6 // edge length it needs to peek comfortably

  const anchorRef = useRef<HTMLDivElement>(null)
  const bodyClipRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const handsClipRef = useRef<HTMLDivElement>(null)
  const handsRef = useRef<HTMLDivElement>(null)

  const [id] = useState(() => Symbol('critter'))
  const place = useRef<Place | null>(null)
  const travel = useRef<Travel | null>(null)
  const lastPt = useRef<Pt>({ x: -100, y: -100, rot: 0 })
  const gen = useRef(0) // bumping it cancels the running routine
  const mounted = useRef(false)
  const peeking = useRef(false) // visible at a hideout, so it's shy
  const busy = useRef(false) // slapping
  const mode = useRef<'chase' | 'settle' | null>(null) // following the scroll
  const chaseDir = useRef<1 | -1>(1)

  const [look, setLook] = useState<Look>(0)
  const [blink, setBlink] = useState(false)
  const [startled, setStartled] = useState(false)
  const [walking, setWalking] = useState(false)
  const [step, setStep] = useState<0 | 1>(0)
  const [slap, setSlap] = useState<SlapPhase>(null)

  // ----- low-level moves -----

  const bodyTo = (y: number, duration: number, ease: 'easeIn' | 'easeOut' | [number, number, number, number] = 'easeOut') =>
    bodyRef.current ? animate(bodyRef.current, { y }, { duration, ease }) : Promise.resolve()
  const handsTo = (y: number, duration: number, ease: 'easeIn' | 'easeOut' = 'easeOut') =>
    handsRef.current ? animate(handsRef.current, { y }, { duration, ease }) : Promise.resolve()

  const claim = (el: Element, edge: Edge) => stage.claims.set(id, { el, edge })
  const release = () => stage.claims.delete(id)
  const takenByOther = (el: Element, edge?: Edge) =>
    [...stage.claims].some(([k, c]) => k !== id && c.el === el && (!edge || c.edge === edge))

  /** Move the anchor to `to` over `dur` s (hopping `hop` px), tracking both ends live. */
  function travelTo(to: Place, { from, dur, hop, clip = false }: { from?: Place | Pt; dur: number; hop: number; clip?: boolean }) {
    return new Promise<void>((resolve) => {
      travel.current?.done()
      travel.current = { from: from ?? lastPt.current, to, start: performance.now(), dur: dur * 1000, hop, clip, done: resolve }
      place.current = to
    })
  }
  function jumpTo(to: Place) {
    travel.current?.done()
    travel.current = null
    place.current = to
  }

  const alive = (g: number) => mounted.current && g === gen.current
  /** Cancel whatever is running and start `routine`, then go back to idling. */
  function run(routine: (g: number) => Promise<unknown>) {
    const g = ++gen.current
    routine(g).then(() => {
      if (alive(g)) idle(g)
    })
  }

  // ----- choosing places -----

  function pickEdge(el: Element): Edge | null {
    const wide = innerWidth >= 1024
    const edges: Edge[] = wide ? ['top', 'top', 'bottom', 'left', 'right'] : ['top', 'top', 'bottom']
    const ok = edges.filter((e) => !takenByOther(el, e) && edgeFits(el, e, span, sprite.curious, top))
    return ok.length ? pick(ok) : null
  }

  /** Nearest mostly-visible hideout with a free top/bottom edge. */
  function pickHideout(from: Pt): Spot | null {
    let best: Spot | null = null
    let bestScore = Infinity
    for (const el of document.querySelectorAll(stage.opts.hideoutSelector)) {
      if (visibleFraction(el, top) < 0.5) continue
      for (const edge of ['top', 'bottom'] as Edge[]) {
        if (takenByOther(el, edge) || !edgeFits(el, edge, span, H, top)) continue
        const spot: Spot = { kind: 'spot', el, edge, pos: rand(25, 75) }
        const p = pointOf(spot)
        const score = Math.hypot(p.x - from.x, p.y - from.y) + (takenByOther(el) ? 400 : 0) + (edge === 'bottom' ? 150 : 0)
        if (score < bestScore) [best, bestScore] = [spot, score]
      }
    }
    return best
  }

  // ----- routines -----

  async function idle(g: number) {
    while (alive(g)) {
      setWalking(false)
      await sleep(rand(delay[0], delay[1]))
      if (!alive(g)) return
      const p = place.current
      if (!p || p.kind === 'free') {
        await settle(g) // lost outside a hideout: find one
        continue
      }
      const edge = pickEdge(p.el)
      if (!edge) continue
      let spot: Spot = { kind: 'spot', el: p.el, edge, pos: rand(18, 82) }
      claim(p.el, edge)
      jumpTo(spot) // it's hidden, so it can move freely behind the element
      setLook(0)
      peeking.current = true

      if (hands) {
        await handsTo(0, 0.35) // grab the edge…
        if (!alive(g)) return
        await sleep(rand(400, 900)) // …hang for a moment…
        if (!alive(g)) return
        await bodyTo(BODY_PEEK, 0.55, [0.3, 1.4, 0.6, 1]) // …and pull up
      } else {
        await bodyTo(BODY_PEEK, 0.45)
      }
      if (!alive(g)) return

      for (let i = 0; i < Math.floor(rand(1, 4)) && alive(g); i++) {
        setLook(pick<Look>([-1, 0, 1]))
        await sleep(rand(400, 900))
      }
      if (!alive(g)) return

      // Sometimes creep (or shimmy hand over hand) along the edge.
      if (Math.random() < 0.5) {
        const next: Spot = { ...spot, pos: rand(18, 82) }
        setLook(toLocal(edge, next.pos > spot.pos ? 1 : -1))
        setWalking(true)
        await travelTo(next, { from: spot, dur: Math.abs(next.pos - spot.pos) * (hands ? 0.07 : 0.05), hop: 0, clip: true })
        setWalking(false)
        spot = next
        if (!alive(g)) return
      }

      // Sometimes get curious and climb out further.
      if (Math.random() < 0.35) {
        await bodyTo(BODY_CURIOUS, 0.35)
        await sleep(rand(700, 1400))
        if (!alive(g)) return
      }

      await bodyTo(BODY_HIDDEN, hands ? 0.22 : 0.3, 'easeIn')
      if (hands && alive(g)) {
        await sleep(rand(150, 400))
        await handsTo(HANDS_HIDDEN, 0.2, 'easeIn')
      }
      peeking.current = false
    }
  }

  function chaseSpot(): Place {
    const cur = lastPt.current
    const y = chaseDir.current > 0 ? innerHeight * 0.8 : Math.max(innerHeight * 0.3, top + H + 24)
    return { kind: 'free', x: clamp(cur.x, W, innerWidth - W), y }
  }

  /** Climb fully out of the current hideout (still clipped, so it visibly comes out from behind it). */
  async function emerge() {
    peeking.current = false
    setLook(0)
    if (place.current?.kind !== 'spot') return
    release()
    void handsTo(0, 0.15)
    await bodyTo(0, 0.2)
  }

  /** Climb out of the hideout and run along with the scroll. */
  async function chase(g: number) {
    mode.current = 'chase'
    await emerge()
    if (!alive(g)) return
    setWalking(true)
    await travelTo(chaseSpot(), { dur: 0.45, hop: 30 })
  }

  /** Hop to the nearest visible hideout and dive behind it. */
  async function settle(g: number) {
    mode.current = 'settle'
    await emerge()
    if (!alive(g)) return
    const from = lastPt.current
    const target = pickHideout(from)
    if (!target) {
      setWalking(false)
      mode.current = null
      return
    }
    claim(target.el, target.edge)
    setWalking(true)
    const to = pointOf(target)
    const dist = Math.hypot(to.x - from.x, to.y - from.y)
    await travelTo(target, { dur: clamp(dist / 900, 0.35, 1.1), hop: clamp(dist * 0.25, 30, 120) })
    if (!alive(g)) return
    setWalking(false)
    await sleep(120)
    if (!alive(g)) return
    void handsTo(HANDS_HIDDEN, 0.2, 'easeIn')
    await bodyTo(BODY_HIDDEN, 0.25, 'easeIn')
    mode.current = null
  }

  function scare() {
    if (!peeking.current || busy.current || mode.current) return
    peeking.current = false
    run(async () => {
      setStartled(true)
      setWalking(false)
      setTimeout(() => setStartled(false), 400)
      await bodyTo(BODY_HIDDEN, 0.14, 'easeIn')
      await handsTo(HANDS_HIDDEN, 0.12, 'easeIn')
      await sleep(rand(delay[0] * 1.5, delay[1]))
    })
  }

  function slapIt(el: Element, onHit?: () => void) {
    if (busy.current) return
    run(async (g) => {
      busy.current = true
      mode.current = null
      peeking.current = false
      release()
      try {
        const r = el.getBoundingClientRect()
        // Pop out above the element, or below it when there's no room above.
        const edge: Edge = r.top - (H + 8) >= 0 ? 'top' : 'bottom'
        const spot: Spot = { kind: 'spot', el, edge, pos: rand(30, 70) }
        if (place.current?.kind === 'free') {
          // Already out in the open: run over and land on it.
          setWalking(true)
          await travelTo(spot, { dur: 0.35, hop: 40 })
          setWalking(false)
        } else {
          // Duck out of sight, then come out from behind the element.
          await Promise.all([bodyTo(BODY_HIDDEN, 0.1, 'easeIn'), handsTo(HANDS_HIDDEN, 0.1, 'easeIn')])
          jumpTo(spot)
          if (hands) await handsTo(0, 0.12)
          await bodyTo(BODY_CURIOUS, 0.16)
        }
        if (!alive(g)) return
        setLook(0)
        const hits = Math.random() < 0.35 ? 2 : 1
        for (let i = 0; i < hits && alive(g); i++) {
          setSlap('windup')
          await sleep(150)
          setSlap('hit')
          bonk(el, edge)
          onHit?.()
          await sleep(170)
          setSlap(null)
          await sleep(90)
        }
        await sleep(200)
        await bodyTo(BODY_HIDDEN, 0.18, 'easeIn')
        await handsTo(HANDS_HIDDEN, 0.12, 'easeIn')
        // Slip back to a hideout while out of sight.
        const home = pickHideout(lastPt.current)
        if (home) {
          claim(home.el, home.edge)
          jumpTo(home)
        }
      } finally {
        busy.current = false
        setSlap(null)
        onHit?.() // no-op if it already ran; guarantees held links still open
      }
    })
  }

  // ----- effects -----

  // Position the anchor every frame (hideouts move as the page scrolls).
  useEffect(() => {
    let raf = 0
    let clipped: boolean | null = null
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const a = anchorRef.current
      const p = place.current
      if (!a || !p) return
      if (p.kind === 'spot' && !p.el.isConnected) place.current = { kind: 'free', x: lastPt.current.x, y: lastPt.current.y }
      let pt: Pt
      const tr = travel.current
      if (tr) {
        const t = Math.min(1, (now - tr.start) / tr.dur)
        const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
        const f = pointOf(tr.from)
        const to = pointOf(tr.to)
        pt = { x: lerp(f.x, to.x, e), y: lerp(f.y, to.y, e) - tr.hop * 4 * t * (1 - t), rot: lerpAngle(f.rot, to.rot, e) }
        if (t >= 1) {
          travel.current = null
          tr.done()
        }
      } else {
        pt = pointOf(place.current!)
      }
      lastPt.current = pt
      a.style.transform = `translate(${pt.x}px, ${pt.y}px) rotate(${pt.rot}deg)`
      // Clip at the edge line only while sitting at a hideout.
      const clip = place.current!.kind === 'spot' && (!travel.current || travel.current.clip)
      if (clip !== clipped) {
        clipped = clip
        for (const el of [bodyClipRef.current, handsClipRef.current]) if (el) el.style.overflow = clip ? 'hidden' : 'visible'
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Start at home, register with the stage, react to its events.
  useEffect(() => {
    mounted.current = true
    const home = document.querySelector(stage.opts.homeSelector) ?? document.querySelector(stage.opts.hideoutSelector)
    if (home) {
      if (stage.reduceMotion) {
        // Sit still, peeking, side by side on the home hideout.
        jumpTo({ kind: 'spot', el: home, edge: 'top', pos: index % 2 ? 28 : 72 })
        animate(bodyRef.current!, { y: BODY_PEEK }, { duration: 0 })
        if (handsRef.current) animate(handsRef.current, { y: 0 }, { duration: 0 })
      } else {
        const edge: Edge = takenByOther(home, 'top') ? 'bottom' : 'top'
        claim(home, edge)
        jumpTo({ kind: 'spot', el: home, edge, pos: 50 })
        animate(bodyRef.current!, { y: BODY_HIDDEN }, { duration: 0 })
        if (handsRef.current) animate(handsRef.current, { y: HANDS_HIDDEN }, { duration: 0 })
        run(async () => sleep(index * 1200)) // stagger their first peeks
      }
    }

    const api: CritterApi = { point: () => lastPt.current, busy: () => busy.current, slap: slapIt }
    stage.critters.set(id, api)
    const onEvent = (e: StageEvent) => {
      if (busy.current) return
      const p = place.current
      const homeInView = p?.kind === 'spot' && visibleFraction(p.el, top) >= 0.35
      if (e.type === 'scroll') {
        const turned = e.dir !== chaseDir.current
        chaseDir.current = e.dir
        if (mode.current === 'chase') {
          if (turned) void travelTo(chaseSpot(), { dur: 0.5, hop: 20 })
        } else if (mode.current === 'settle' || !homeInView) {
          run(chase) // scrolling again mid-dive, or its hideout is leaving
        }
      } else if (mode.current === 'chase' || (!mode.current && !homeInView)) {
        run(settle) // scrolling stopped: find a hideout on screen
      }
    }
    if (!stage.reduceMotion) stage.listeners.add(onEvent)
    return () => {
      mounted.current = false
      gen.current++
      release()
      stage.critters.delete(id)
      stage.listeners.delete(onEvent)
    }
    // Everything it uses lives in refs or is fixed for the critter's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Blink every few seconds.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      timer = setTimeout(() => {
        setBlink(true)
        setTimeout(() => setBlink(false), 130)
        schedule()
      }, rand(2000, 5000))
    }
    schedule()
    return () => clearTimeout(timer)
  }, [])

  // Legs / hands alternate while walking.
  useEffect(() => {
    if (!walking) return
    const timer = setInterval(() => setStep((s) => (s ? 0 : 1)), 140)
    return () => clearInterval(timer)
  }, [walking])

  // Shy: hide when the cursor comes close, or on a tap nearby.
  useEffect(() => {
    if (stage.reduceMotion) return
    let frame = 0
    const near = (x: number, y: number, radius: number) => {
      const r = bodyRef.current?.getBoundingClientRect()
      return !!r && Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)) < radius
    }
    const onMove = (e: PointerEvent) => {
      if (frame || !peeking.current) return
      frame = requestAnimationFrame(() => {
        frame = 0
        if (near(e.clientX, e.clientY, shyRadius)) scare()
      })
    }
    const onDown = (e: PointerEvent) => {
      if (peeking.current && near(e.clientX, e.clientY, 60)) scare()
    }
    addEventListener('pointermove', onMove, { passive: true })
    addEventListener('pointerdown', onDown, { passive: true })
    return () => {
      removeEventListener('pointermove', onMove)
      removeEventListener('pointerdown', onDown)
      cancelAnimationFrame(frame)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ----- render -----

  const state: SpriteState = { look, blink, startled, walking, step, slap }
  const box = (s: CSSProperties): CSSProperties => ({ position: 'absolute', overflow: 'hidden', ...s })

  return (
    <div ref={anchorRef} style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, willChange: 'transform' }}>
      {/* Body: clip box ends exactly at the edge line. */}
      <div ref={bodyClipRef} style={box({ left: -W, top: -(H + 48), width: W * 2, height: H + 48 })}>
        <div
          ref={bodyRef}
          style={{ position: 'absolute', left: W / 2, bottom: 0, width: W, height: H, transform: `translateY(${BODY_HIDDEN}px)` }}
        >
          <Body {...state} />
        </div>
      </div>

      {/* Hands: clip box reaches `grip` (+ slap room) past the edge, so fingers curl over it. */}
      {hands && (
        <div
          ref={handsClipRef}
          style={box({
            left: -hands.width / 2,
            top: hands.grip - hands.height - reach,
            width: hands.width,
            height: hands.height + reach + SLAP_DEPTH,
          })}
        >
          <div
            ref={handsRef}
            style={{
              position: 'absolute',
              left: 0,
              top: reach,
              width: hands.width,
              height: hands.height,
              transform: `translateY(${HANDS_HIDDEN}px)`,
            }}
          >
            <hands.Component {...state} />
          </div>
        </div>
      )}

      {slap === 'hit' && (
        <div style={{ position: 'absolute', left: slapX - 10, top: -12 }}>
          <Spark />
        </div>
      )}
    </div>
  )
}

function Spark() {
  return (
    <svg viewBox="0 0 7 7" width={20} height={20} shapeRendering="crispEdges" style={{ display: 'block' }}>
      <PixelArt
        rows={['...Y...', '.Y...Y.', '...W...', 'Y.WWW.Y', '...W...', '.Y...Y.', '...Y...']}
        palette={{ Y: '#facc15', W: '#ffffff' }}
      />
    </svg>
  )
}

/** Do what clicking the link would have done. */
function followLink(a: HTMLAnchorElement) {
  const href = a.getAttribute('href') ?? ''
  if (a.target === '_blank') {
    window.open(a.href, '_blank', 'noopener,noreferrer')
  } else if (href.startsWith('#')) {
    history.pushState(null, '', href)
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' })
  } else {
    location.href = a.href
  }
}

/** Nudge the slapped element away from the edge it was hit on. */
function bonk(el: Element, edge: Edge) {
  const d = 3
  const shift = { top: `0px, ${d}px`, bottom: `0px, -${d}px`, left: `${d}px, 0px`, right: `-${d}px, 0px` }[edge]
  ;(el as HTMLElement).animate?.(
    [{ transform: 'none' }, { transform: `translate(${shift}) scale(0.96)` }, { transform: 'none' }],
    { duration: 220, easing: 'ease-out' },
  )
}

/**
 * Draws pixel art from text rows: each character is one pixel, looked up in
 * `palette` (characters not in the palette are transparent). Runs of the same
 * character are merged into one <rect>. Use inside an <svg> whose viewBox is
 * in pixel units, with shapeRendering="crispEdges".
 */
export function PixelArt({
  rows,
  palette,
  x = 0,
  y = 0,
}: {
  rows: string[]
  palette: Record<string, string>
  x?: number
  y?: number
}) {
  const rects: ReactElement[] = []
  rows.forEach((row, r) => {
    let c = 0
    while (c < row.length) {
      const ch = row[c]
      if (!palette[ch]) {
        c++
        continue
      }
      let end = c
      while (end + 1 < row.length && row[end + 1] === ch) end++
      rects.push(<rect key={`${r}-${c}`} x={x + c} y={y + r} width={end - c + 1} height={1} fill={palette[ch]} />)
      c = end + 1
    }
  })
  return <g>{rects}</g>
}
