import { PixelArt, type PeekerSprite, type SpriteState } from '../Peeker'

// A pixel critter in the style of Claude Code's mascot. Peek style (no hands).

const U = 4 // px per pixel
const BODY = '#D97757'
// Eyes are "holes" in the body; set --peeker-eye to your page background.
const EYE = 'var(--peeker-eye, #14171c)'

// Body with the left arm; the right arm is drawn separately so it can slap.
const SHAPE = [
  '..CCCCCCCCC..',
  '..CCCCCCCCC..',
  'CCCCCCCCCCC..',
  'CCCCCCCCCCC..',
  '..CCCCCCCCC..',
]

function ClawdBody({ look, blink, startled, walking, step, slap }: SpriteState) {
  const eyeY = startled ? 0.5 : blink ? 1.5 : 1
  const eyeH = startled ? 2.5 : blink ? 0.5 : 2
  // Two pairs of legs lift alternately while walking.
  const leg = (x: number, pair: 0 | 1) => {
    const lifted = walking && step === pair
    return <rect key={x} x={x} y={5} width={1} height={lifted ? 1 : 2} fill={BODY} />
  }
  return (
    <svg viewBox="0 0 13 7" width={13 * U} height={7 * U} shapeRendering="crispEdges" style={{ display: 'block' }}>
      <PixelArt rows={SHAPE} palette={{ C: BODY }} />
      {/* Right arm: raised on windup, brought down onto the edge on hit. */}
      <rect x={11} y={slap === 'windup' ? 0 : slap === 'hit' ? 4 : 2} width={2} height={2} fill={BODY} />
      <rect x={4 + look * 0.5} y={eyeY} width={1} height={eyeH} fill={EYE} />
      <rect x={8 + look * 0.5} y={eyeY} width={1} height={eyeH} fill={EYE} />
      {leg(3, 0)}
      {leg(7, 0)}
      {leg(5, 1)}
      {leg(9, 1)}
    </svg>
  )
}

export const clawd: PeekerSprite = {
  width: 13 * U,
  height: 7 * U,
  Body: ClawdBody,
  peek: 4 * U, // eyes, with arms resting on the edge
  curious: 6 * U, // climbs out until the legs show
  slapX: 5.5 * U, // right arm
}
