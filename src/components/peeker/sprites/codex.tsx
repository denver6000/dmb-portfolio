import { PixelArt, type PeekerSprite, type SpriteState } from '../Peeker'

// A Codex-style pixel cloud with a ">_" terminal-prompt face. Climb style:
// its hands grab the edge first, then it pulls itself up.

const U = 4 // px per pixel
const PALETTE = {
  K: '#1e1b4b', // outline
  B: '#8b9cff', // body
  L: '#c3cbff', // highlight
  S: '#6a7cf0', // shadow
}
const FACE = '#ffffff'

const SHAPE = [
  '....KKKKKK....',
  '..KKLLLLBBKK..',
  '.KLLBBBBBBBBK.',
  'KLBBBBBBBBBBBK',
  'KBBBBBBBBBBBBK',
  'KBBBBBBBBBBBBK',
  'KBBBBBBBBBBBBK',
  'KBBBBBBBBBBBSK',
  'KSBBBBBBBBBSSK',
  '.KSSBBBBBBSSK.',
  '..KKKKKKKKKK..',
]

function CodexBody({ look, blink, startled }: SpriteState) {
  return (
    <svg viewBox="0 0 14 11" width={14 * U} height={11 * U} shapeRendering="crispEdges" style={{ display: 'block' }}>
      <PixelArt rows={SHAPE} palette={PALETTE} />
      <g transform={`translate(${look * 0.5} 0)`}>
        {startled ? (
          // Wide eyes.
          <>
            <rect x={4} y={4} width={2} height={2} fill={FACE} />
            <rect x={8} y={4} width={2} height={2} fill={FACE} />
          </>
        ) : (
          <>
            {/* ">" */}
            <PixelArt rows={['W.', '.W', 'W.']} palette={{ W: FACE }} x={4} y={4} />
            {/* "_" cursor: blinks like a terminal cursor */}
            {!blink && <rect x={7} y={6} width={3} height={1} fill={FACE} />}
          </>
        )}
      </g>
    </svg>
  )
}

// One mitten hand; the bottom two rows are the fingers that curl over the edge.
const HAND = [
  '.KKK.',
  'KLBBK',
  'KBBBK',
  'KBKBK',
  '.K.K.',
]

// Both hands in an 18-wide box: they sit at the body's sides (the body is 14
// wide and centred on the same point).
function CodexHands({ walking, step, slap }: SpriteState) {
  // Hand over hand while shimmying along the edge.
  const lift = (hand: 0 | 1) => (walking && step === hand ? -1 : 0)
  return (
    <svg
      viewBox="0 0 18 5"
      width={18 * U}
      height={5 * U}
      shapeRendering="crispEdges"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <PixelArt rows={HAND} palette={PALETTE} x={0} y={lift(0)} />
      {/* Right hand slaps: up on windup, down past the edge on hit. */}
      <PixelArt rows={HAND} palette={PALETTE} x={13} y={slap === 'windup' ? -3 : slap === 'hit' ? 1.5 : lift(1)} />
    </svg>
  )
}

export const codex: PeekerSprite = {
  width: 14 * U,
  height: 11 * U,
  Body: CodexBody,
  peek: 8 * U, // face above the edge, between its hands
  curious: 11 * U, // pulls itself all the way up
  slapX: 6.5 * U, // right hand
  hands: {
    Component: CodexHands,
    width: 18 * U,
    height: 5 * U,
    grip: 2 * U, // fingers over the edge
  },
}
