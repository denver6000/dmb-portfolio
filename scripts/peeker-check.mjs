// Behaviour check for the Peeker critters (src/components/peeker), driven through a
// headless Chromium browser over the DevTools protocol. Needs the dev server running.
//
//   npm run dev
//   npm run check:peeker                       # desktop, 1280x900
//   npm run check:peeker -- --size 390x844     # phone
//
// Options: --url <url> (default http://localhost:5173/), --size WxH, --shots <dir> to save
// screenshots. Set BROWSER to a Chrome/Edge/Chromium binary if it isn't found automatically.
// Exits non-zero if a check fails.
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const args = process.argv.slice(2)
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : fallback
}
const url = opt('url', 'http://localhost:5173/')
const [W, H] = opt('size', '1280x900').split('x').map(Number)
const shots = opt('shots', null)
if (shots) mkdirSync(shots, { recursive: true })

const browser =
  process.env.BROWSER ??
  [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].find(existsSync)
if (!browser) {
  console.error('No Chromium-based browser found; set BROWSER=/path/to/chrome')
  process.exit(2)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const port = 9300 + Math.floor(Math.random() * 500)
const proc = spawn(browser, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'peeker-'))}`,
  `--window-size=${W},${H}`,
  'about:blank',
])
let tabs
for (let i = 0; i < 40 && !tabs; i++) {
  await sleep(250)
  tabs = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json()).catch(() => null)
}
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r))
let id = 0
const pending = new Map()
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  pending.get(m.id)?.(m)
  pending.delete(m.id)
})
const send = (method, params = {}) =>
  new Promise((r) => {
    pending.set(++id, r)
    ws.send(JSON.stringify({ id, method, params }))
  })
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true })).result?.result?.value
const snap = async (name, clip) => {
  if (!shots) return
  const { result } = await send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip } : {}) })
  writeFileSync(join(shots, `${name}.png`), Buffer.from(result.data, 'base64'))
}

// Per critter: px of body showing past its edge, whether its anchor is in the readable
// viewport (below the 64px header), and whether a slap spark is showing.
const STATE = `(() => {
  const layer = [...document.querySelectorAll('div[aria-hidden="true"]')].find((d) => getComputedStyle(d).position === 'fixed');
  if (!layer || !layer.children.length) return null;
  return [...layer.children].map((a) => {
    const box = a.children[0].getBoundingClientRect();
    const body = a.children[0].querySelector('svg').getBoundingClientRect();
    const vis = Math.max(0, Math.min(body.bottom, box.bottom) - Math.max(body.top, box.top));
    const m = new DOMMatrix(getComputedStyle(a).transform);
    return { vis: Math.round(vis), onScreen: m.e > 0 && m.e < innerWidth && m.f > 64 && m.f < innerHeight, spark: !!a.querySelector('rect[fill="#facc15"]') };
  });
})()`

const results = []
const check = (name, ok, detail) => {
  results.push(ok)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: ${detail}`)
}

await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 600 })
await send('Page.navigate', { url })
let state = null
for (let i = 0; i < 75 && !state; i++) {
  await sleep(200)
  state = await evaluate(STATE)
}
if (!state) {
  console.error('Critter layer not found: is the dev server running and the portfolio content loading?')
  process.exit(1)
}
const names = state.map((_, i) => ['clawd', 'codex'][i] ?? `critter${i}`)
console.log(`Peeker check at ${W}x${H}, ${names.length} critters (${names.join(', ')})`)

// 1. Peeks over 20 s at the top of the page.
const peeks = state.map(() => 0)
const was = state.map(() => false)
const t0 = Date.now()
while (Date.now() - t0 < 20000) {
  const s = await evaluate(STATE)
  s.forEach((c, i) => {
    const v = c.vis > 4
    if (v && !was[i]) peeks[i]++
    was[i] = v
  })
  await sleep(80)
}
await snap('1-home')
check('every critter peeks at top of page (20 s)', peeks.every((n) => n >= 1), names.map((n, i) => `${n} ${peeks[i]}`).join(', '))

// 2. Scroll ~1500 px: nothing should be shown away from its card. A critter may take one
//    ~0.16 s duck as its card slides under the header, which the header clip hides.
let strayFrames = 0
for (let i = 0; i < 15; i++) {
  await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: W / 2, y: H / 2, deltaX: 0, deltaY: 100 })
  await sleep(60)
  const s = await evaluate(STATE)
  if (s.some((c) => c.vis > 4 && !c.onScreen)) strayFrames++
}
check('no flying while scrolling', strayFrames <= 3, `${strayFrames} sampled frame(s) with a critter showing off its on-screen spot`)

// 3. After scrolling stops, each critter should peek from a card in view soon.
const stop = Date.now()
const first = state.map(() => null)
while (Date.now() - stop < 6000 && first.includes(null)) {
  const s = await evaluate(STATE)
  s.forEach((c, i) => {
    if (first[i] === null && c.vis > 4 && c.onScreen) first[i] = Date.now() - stop
  })
  await sleep(60)
}
await snap('2-after-scroll')
check('reappear after scroll stops (< 4 s)', first.every((t) => t !== null && t < 4000), names.map((n, i) => `${n} ${first[i] ?? 'never'}ms`).join(', '))

// 4. Click a visible pill link: a critter slaps it (spark). New-tab links then open.
await evaluate(`(() => { const a = document.querySelector('a.pill-link'); if (a) scrollTo({ top: a.getBoundingClientRect().top + scrollY - innerHeight / 2, behavior: 'instant' }) })()`)
await sleep(1500)
const target = await evaluate(`(() => { const a = [...document.querySelectorAll('a.pill-link')].find((el) => { const r = el.getBoundingClientRect(); return r.top > 120 && r.bottom < innerHeight - 40 }); if (!a) return null; const r = a.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })()`)
if (!target) {
  check('slap on click', false, 'no pill link found on the page')
} else {
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: target.x, y: target.y, button: 'left', clickCount: 1 })
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: target.x, y: target.y, button: 'left', clickCount: 1 })
  let slapper = null
  for (let i = 0; i < 25 && slapper === null; i++) {
    await sleep(40)
    const k = (await evaluate(STATE)).findIndex((c) => c.spark)
    if (k >= 0) {
      slapper = names[k]
      await snap('3-slap', { x: Math.max(0, target.x - 100), y: Math.max(0, target.y - 100), width: 200, height: 140, scale: 2 })
    }
  }
  check('slap on click', slapper !== null, slapper ? `${slapper} slapped the link` : 'no spark within 1 s')
}

ws.close()
proc.kill()
const failed = results.filter((ok) => !ok).length
console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed')
process.exit(failed ? 1 : 0)
