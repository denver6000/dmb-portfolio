---
title: One agent, many logged-in browsers
summary: Why I built an MCP server that lets an AI agent log in as an admin and a regular user at the same time, and how Playwright's browser contexts make it work.
date: 2026-10-13
tags: MCP, Playwright, TypeScript, AI agents
---

Because of how good agents are today, I'm pumping out more projects than I can test, or even count. A lot of them are web projects with multiple roles and multiple dashboards, where one role usually has to approve what another role did. That's a pain to test. Either my workflow is set up wrong, or I'm simply too lazy to do it by hand.

So I built **Multi-Role Browser**: an MCP server that lets one AI agent drive several logged-in browsers at once, such as an admin and a regular user, side by side.

## The built-in agent-controlled browser

I've seen the Claude and Codex desktop apps control a web browser and test features on their own. But I kept having sessions where I also needed to test something on *another role's* dashboard.

A built-in browser is one identity: one cookie jar, one login. To check the other side, the agent has to log out, log back in as someone else, and lose the first session along the way.

::: diagram mrb-contexts
Switching roles in a single browser throws away the other session. Browser contexts keep both alive.
:::

## Playwright and the amazing browserContext

I read up on Playwright and how it's usually used, and came across its `browserContext` mechanism. A context is like a fresh incognito profile inside the same browser. It isolates localStorage, and I assumed it also isolates cookies and other auth-related caching, though I hadn't tested how far the isolation goes.

That makes it possible for an agent to swap between "browsers" and test multi-role web projects, which would otherwise be a pain to set up. The core idea fits in a few lines:

```ts title="contexts in a nutshell"
import { chromium } from 'playwright';

const browser = await chromium.launch(); // [!1]
const admin = await browser.newContext(); // [!2]
const user = await browser.newContext();

await (await admin.newPage()).goto('http://localhost:3000/login');
await (await user.newPage()).goto('http://localhost:3000/login'); // [!3]
```

::: notes
1. One Chromium process. Launching a browser is the expensive part, so it happens once.
2. Each `newContext()` is a separate session inside that browser. Creating one is cheap.
3. Both pages hit the same login form, but neither can see the other's cookies or storage.
:::

::: verified How much does a context isolate?
The demo further down answers it in practice: the dummy site keeps each login in an HttpOnly `sid` cookie, both actors are signed in at the same moment, and each one still sees only its own dashboard. Playwright's docs describe every context as an independent browser session that doesn't share cookies or storage with other contexts.
:::

## The basic concepts of the build

So far the build has one core module, `registry.ts`. It holds the utilities for tracking, opening and closing browsers and their URLs, and keeps a `contexts` Map that tracks the role behind each `browser.context`. The MCP module then exposes those registry utilities to the server runtime.

::: diagram mrb-architecture
A tool call travels from the agent, over stdio, to `server.ts`. The registry turns the actor's name into its own context inside one shared Chromium.
:::

```tree title="denver6000-multi-role-browser"
src/
  browser/
    *registry.ts # names → contexts, one shared Chromium
    browser.ts # standalone helpers (makeInstance, makePage)
  mcp/
    *server.ts # exposes the registry as MCP tools
    demo-agent.ts # scripted agent used for the demo
dummy-site/
  server.ts # fake app with an admin and a user account
package.json
```

### registry.ts: names → contexts

Playwright already tracks contexts and pages (`browser.contexts()`, `context.pages()`), but it doesn't know their *names*. That's the one thing the registry adds.

```ts title="src/browser/registry.ts" start=23
let browser: Browser | undefined; // [!1]
const contexts = new Map<string, BrowserContext>(); // [!2]
const settings = {
  baseURL: 'http://localhost:3000', // root of the app under test; lets pages use paths like '/admin'
  headless: false,                  // false shows the browser windows
};
```

::: notes
1. The module is a singleton: Node runs it once, so every file that imports it shares the same browser.
2. The heart of the whole project. `"admin"` and `"user"` are just keys; any name works.
:::

`spawn()` is the only way in. It returns the context for a name, creating it the first time that name is used:

```ts title="src/browser/registry.ts" start=49 {53-56}
export async function spawn(name: string): Promise<BrowserContext> {
  const existing = contexts.get(name);
  if (existing) return existing; // [!1]

  browser ??= await chromium.launch({ headless: settings.headless }); // [!2]
  const context = await browser.newContext({ baseURL: settings.baseURL });
  contexts.set(name, context);
  context.on('close', () => contexts.delete(name)); // [!3]
  return context;
}
```

::: notes
1. Same name, same context. Calling `spawn('admin')` twice gives back the same logged-in session.
2. The browser is launched lazily, on the first spawn, with `??=` so it only ever happens once.
3. If a context gets closed somewhere else, the Map removes it too, so the registry never hands out a dead context.
:::

Cleaning up is short, because closing the browser closes every context and tab with it:

```ts title="src/browser/registry.ts" start=76
export async function remove(name: string): Promise<void> {
  await get(name)?.close(); // [!1]
}

export async function closeAll(): Promise<void> {
  await browser?.close();
  browser = undefined;
  contexts.clear();
}
```

::: notes
1. No `contexts.delete()` needed here: the `'close'` handler from `spawn()` does it.
:::

### server.ts: every tool takes an actor

The MCP server exposes seven tools. The trick that makes them multi-role is one shared parameter: every tool takes an `actor`, and the registry turns that name into a browser identity.

```ts title="src/mcp/server.ts" start=40
const actor = z.string().describe(
  'Who performs the action, e.g. "admin" or "user". Each name is a separate browser identity ' +
  'with its own cookies and login. A new name starts logged out.', // [!1]
);

async function currentPage(name: string): Promise<Page> {
  const context = await registry.spawn(name); // [!2]
  return context.pages().at(-1) ?? await context.newPage(); // [!3]
}
```

::: notes
1. This description is written for the model. It's how the agent learns that a new name means a fresh, logged-out user.
2. Any tool call with a new actor name quietly creates that identity.
3. The actor's most recent tab wins, so popups opened by a click are picked up automatically.
:::

Here's a full tool. The others follow the same shape:

```ts title="src/mcp/server.ts" start=125 {130-133}
server.registerTool('browser_click', {
  description: 'Click an element as the given actor. Use a ref from the latest snapshot. Returns the new snapshot.',
  inputSchema: { actor, ref: z.string().describe('Element ref from the latest snapshot, e.g. "e5" or "f1e6"') },
}, async ({ actor, ref }) => {
  try {
    const page = await currentPage(actor);
    await (await byRef(page, ref)).click(); // [!1]
    await page.waitForLoadState(); // [!2]
    return text(await describe(actor, await currentPage(actor))); // [!3]
  } catch (err) {
    return failure(err); // [!4]
  }
});
```

::: notes
1. `byRef` fails fast if the ref isn't on the page, instead of letting Playwright wait 30 seconds for it to appear.
2. If the click started a navigation, wait for the new page before describing it.
3. Re-read the current page: the click may have opened a popup.
4. Errors come back as a readable tool result, so the agent can recover instead of the server crashing.
:::

::: warning stdout belongs to the protocol
The agent talks to this server over stdin and stdout. A stray `console.log()` would corrupt the MCP messages, so all debug output goes through `console.error()` instead.
:::

### What the agent actually sees

Agents don't look at screenshots here. Every tool returns an accessibility snapshot with element refs like `[ref=e5]`, and the agent picks the next ref to click or fill from that text.

```ts title="src/mcp/server.ts" start=52
async function describe(name: string, page: Page): Promise<string> {
  const snapshot = await page.ariaSnapshot({ mode: 'ai' });
  return `Actor: ${name}\nURL: ${page.url()}\nTitle: ${await page.title()}\n\nSnapshot:\n${snapshot}`;
}
```

This is the real output of `browser_open` as `admin` on the dummy site's login page:

```terminal title="browser_open(actor: admin, url: /login)"
HTTP 200
Actor: admin
URL: http://localhost:3000/login
Title: Sign in

Snapshot:
- generic [active] [ref=e1]:
  - heading "Sign in" [level=1] [ref=e2]
  - generic [ref=e3]:
    - generic [ref=e4]:
      - text: Email
      - textbox "Email" [ref=e5]
    - generic [ref=e6]:
      - text: Password
      - textbox "Password" [ref=e7]
    - button "Sign in" [ref=e8]
```

From there the loop is simple: `browser_fill` on `e5` and `e7`, `browser_click` on `e8`, read the new snapshot, and repeat.

## Seeing it work

The repo ships with a dummy site (an admin and a user account) and a scripted demo agent that does exactly what Claude Code would do, except it picks refs with a regex instead of a language model.

::: diagram mrb-demo-sequence
The demo scenario. Both roles log in through the real form, then each one tries the admin page.
:::

```terminal title="npm run demo:agent"
$ npm run site
$ npm run demo:agent
admin landed on: Welcome, Ada Admin
user  landed on: Welcome, Uma User
admin dashboard has "Admin panel" link? true
user  dashboard has "Admin panel" link? false
admin /admin: Title: Admin panel
user  /admin: HTTP 403 Title: Forbidden

Clicking a ref that does not exist: Error: Ref "e999" is not on the current page (http://localhost:3000/admin). Call browser_snapshot for fresh refs.

browser_actors:
Base URL: http://localhost:3000
admin: http://localhost:3000/admin
user: http://localhost:3000/admin
```

| Check | admin | user |
| --- | --- | --- |
| Lands on its own dashboard | Welcome, Ada Admin | Welcome, Uma User |
| Sees the "Admin panel" link | Yes | No |
| Opens `/admin` | 200 · Admin panel | 403 · Forbidden |
| Stale ref `e999` | | Readable error, no crash |

Both sessions were alive at the same time, in the same Chromium, and the app treated them as two different people. That's the whole point.

## Why

As I said earlier, I wanted agents to test multi-role web projects reliably. This is also my way of improving my workflow with AI agents.

I've also released an ssh-mcp before, but I didn't like how it was built, so I've simply been using [ssh-mcp by tufantunc](https://github.com/tufantunc/ssh-mcp) instead. I'm planning on rebuilding mine.

## Try it

You need Node.js 20 or newer and Playwright's Chromium. Then add it to Claude Code:

```terminal title="Install"
$ npx playwright install chromium
$ claude mcp add --scope user multi-role-browser --env BASE_URL=http://localhost:3000 -- npx -y multi-role-browser
```

::: tip Example prompt
Log in as admin and as user. Check whether user can open /admin, and whether an announcement posted by admin shows up for user.
:::

| Tool | What it does |
| --- | --- |
| `browser_open` | Open a path or full URL as an actor. Returns the HTTP status and a snapshot. |
| `browser_snapshot` | Show what the actor sees, with element refs. |
| `browser_click` | Click an element by ref. Returns the new snapshot. |
| `browser_fill` | Type into an input by ref. |
| `browser_set_base_url` | Change which site paths point to, for every actor. |
| `browser_actors` | List the base URL, the open actors and their tabs. |
| `browser_close` | Close an actor's context. Using the name again starts fresh. |

The source is on [GitHub](https://github.com/denver6000/denver6000-multi-role-browser), and the package is on npm as `multi-role-browser`.
