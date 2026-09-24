import { PixelArt, withOutline, type PeekerSprite, type SpriteState } from '../Peeker'

// Codex's mascot: a blue cloud-headed chibi with a dark screen for a face
// (cyan ">_" eyes) and a ">-" mark on its chest. Peek style, slaps with its
// right arm.

const U = 3 // px per pixel

const PALETTE = {
  K: '#1b2a7a', // outline
  B: '#3f63f0', // body
  L: '#7f9bff', // highlight
  D: '#2b47c9', // shade
  S: '#121a3f', // screen
  M: '#9db3ff', // chest mark
}
const EYE = '#6ff3f7'

// Fill shapes; withOutline() adds the dark border (and one pixel on each side).
// Cloud head with three bumps, a screen face, a small body and feet. The right
// arm is drawn separately so it can slap.
const SHAPE = withOutline([
  '....LLL.BBBB....',
  '..LLLLBBBBBBBB..',
  '.LLBBBBBBBBBBBB.',
  'LLBBSSSSSSSSBBBB',
  'LBBSSSSSSSSSSBBB',
  '.BBSSSSSSSSSSBB.',
  'BBBSSSSSSSSSSBBD',
  'BBBSSSSSSSSSSBBD',
  'BBBBSSSSSSSSBBDD',
  '.BBBBBBBBBBBBDD.',
  '..DDBBBBBBBDDD..',
  '....BBBBBBBD....',
  '..BBBMBBBBBD....',
  '..BBBBMBMMBD....',
  '....BMBBBBBD....',
  '.....DD..DD.....',
  '.....DD..DD.....',
])
const ARM = withOutline(['BD', 'DD'])

// Faces, in SHAPE coordinates (the screen spans x 4-13, y 4-9).
const FACES = {
  prompt: ['W.....', '.W....', 'W..WWW'], // ">_"
  blink: ['......', 'WW..WW', '......'], // "- -"
  startled: ['WW..WW', 'WW..WW', '......'], // wide eyes
  happy: ['.W...W.', 'W.W.W.W', '.......'], // "^ ^"
}

function CodexBody({ look, blink, startled, slap }: SpriteState) {
  const face = startled ? FACES.startled : slap === 'hit' ? FACES.happy : blink ? FACES.blink : FACES.prompt
  const faceX = slap === 'hit' ? 5 : 6
  // Right arm: at its side, raised on windup, swung down on hit.
  const arm = slap === 'windup' ? { x: 14, y: 8 } : slap === 'hit' ? { x: 14, y: 12 } : { x: 12, y: 12 }
  return (
    <svg viewBox="0 0 18 19" width={18 * U} height={19 * U} shapeRendering="crispEdges" style={{ display: 'block' }}>
      <PixelArt rows={SHAPE} palette={PALETTE} />
      <PixelArt rows={ARM} palette={PALETTE} x={arm.x} y={arm.y} />
      <PixelArt rows={face} palette={{ W: EYE }} x={faceX + look} y={5} />
    </svg>
  )
}

export const codex: PeekerSprite = {
  width: 18 * U,
  height: 19 * U,
  Body: CodexBody,
  peek: 11 * U, // cloud head and screen face above the edge
  curious: 15 * U, // climbs out until its chest shows
  slapX: 7 * U, // right arm, swung out
}
