# AGENTS.md — UNA Chat (Lab 5, Seguridad Informática)

You are the maintenance agent for this repository. Read this whole file before
doing anything. It holds everything previous sessions learned, and **you must
update it at the end of every session** (see [Self-improvement loop](#self-improvement-loop)).

---

## 1. What this project is

A university security-course lab: a real-time chat built with Node.js,
Express and Socket.IO. Users type a message, the server validates/sanitizes it
with `libs/unalib.js`, and broadcasts it to everyone.

- Owner: GitHub user `elein06`. Remote: `https://github.com/elein06/lab5-una-chat.git`, branch `main`.
- Course language is **Spanish**: code comments, test names and BDD scenarios
  are written in Spanish. Talk to the user in the language they use.
- Lab instructions arrive as pasted Spanish bullet lists. Map each bullet to a
  concrete check and report a requirement-by-requirement table at the end.

### Files

| Path | Purpose |
|---|---|
| `server.js` | Express + Socket.IO server. Exports `{ app, http, io }`; only calls `listen` when `require.main === module` so tests can import it. |
| `libs/unalib.js` | "una-lib": URL detection + HTML escaping. `validateMessage` is what the lab calls `validarMensaje`. |
| `index.html` | Client. Inserts `msgJson.mensaje` with jQuery `.html()` — **so the server must already have sanitized it**. |
| `test/*.js` | Mocha unit tests (BDD `describe`/`it`). |
| `tests/integration/chat.test.js` | Jest integration tests (Supertest for HTTP, `socket.io-client` for the real chat event). |
| `tests/e2e/chat.spec.js` | Playwright end-to-end tests (real browser + real server); BDD via `test.step('Given/When/Then …')`. |
| `playwright.config.js` | `testDir: tests/e2e`, Chromium only, `webServer` runs `node server.js` on port 3100 (`E2E_PORT`). |
| `repositorio.txt` | Lab deliverable: just the GitHub repo URL. |
| `README.md` | Spanish setup + how to run the three suites (for graders). |

### Message flow

`client emit('Evento-Mensaje-Server', JSON string)` → `server` → `unalib.validateMessage(raw)` →
`io.emit('Evento-Mensaje-Server', sanitizedJSON)` → every client appends it as HTML.

`validateMessage` behavior (keep it this way unless asked):
1. Trim `mensaje`. Escape `nombre` (default `Anonimo`). `color` must match `^#[0-9a-f]{6}$` else `#000000`.
2. If the whole message is an image URL (`jpg jpeg png gif bmp webp svg`, optional `?query`/`#hash`) → `<a><img class="chat-media"></a>`.
3. Else if YouTube (`watch?v=`, `youtu.be/`, `embed/`, `shorts/`, `m.`) → `<iframe>` with `youtube.com/embed/<11-char id>`.
4. Else if video file (`mp4 webm ogg ogv mov`) → `<video controls preload="metadata">`.
5. Else → `escapeHtml(text)`. Invalid JSON → escaped raw string. Non-string → `''`.

URL regexes exclude `\s " ' < > \``, which is what blocks attribute-breakout payloads. URLs are still passed through `escapeHtml` before going in attributes (so `&` becomes `&amp;`).

---

## 2. Commands (Windows, run from repo root)

```
npm start                       # http://localhost:3000
npm test                        # Mocha unit tests
npm run test:integration        # Jest: tests/integration --runInBand --env=node --verbose
npm run test:e2e                # Playwright (starts the server itself on :3100)
npm run test:all                # all three
npx jest tests/integration --runInBand --env=node   # exact command from the lab
```

Shell: PowerShell 5.1 is primary (no `&&`; use `;` or `if ($?)`). Git Bash is also available.

### Snyk

- CLI is not on PATH. Use the VS Code extension's binary:
  `& "$env:LOCALAPPDATA\snyk\vscode-cli\snyk-win.exe" test --dev --json`
- If it returns `SNYK-0005 / 401`, run `... snyk-win.exe auth` **in the background**;
  it prints an OAuth URL — give it to the user and wait for the task to finish.
- Summarize JSON with `ConvertFrom-Json`, dedupe by `id`, group by `severity`, show `from` path and `upgradePath`.

---

## 3. Rules

### Security (this is a security course — these are non-negotiable)
- Never render user input as HTML without escaping. Sanitize on the **server** (clients can be bypassed).
- Every field that reaches the DOM (`mensaje`, `nombre`, `color`) must be validated or escaped.
- No `"*"` dependency versions. Pin with `^x.y.z`.
- Test tooling (`mocha`, `jest`, `supertest`, `socket.io-client`) goes in `devDependencies`.

### Testing
- **BDD style everywhere.** Mocha: `describe('Feature: …')` / `context('Scenario: …')` / `it('Then …')` with Given/When comments.
  Jest: test names written as `Given …, When …, Then …`.
- For vulnerability fixes, do **red → green**: write the scenario that reproduces the exploit, run it and show it failing, then fix, then show it passing.
- Integration tests must use the real server and real una-lib. Use `jest.spyOn(unalib, 'validateMessage')` (spy, not mock) to prove the backend calls it.
- Always close what tests open: client `disconnect()`, `io.close()`, `server.close()`.
- Silence `console.log` from unalib in tests (`jest.spyOn(console,'log').mockImplementation(()=>{})` / Mocha root `before`/`after`).
- Run the full suite before every commit.

### Git
- Commit only when the user asks ("commit", "push", "yes" to an offer). Push to `origin main`.
- `node_modules/` is git-ignored — never re-add it.
- Clear English commit messages with a bullet body; end with the attribution line the harness provides.
- `LF will be replaced by CRLF` warnings are harmless.

### Working with the user
- The user is a student who needs **evidence screenshots**. When tests are added, tell them exactly which command to run in the VS Code terminal (`` Ctrl+` ``), to add `--verbose` to Jest, to maximize the panel, and to capture with `Win + Shift + S`, making sure the pass totals are visible.
- Before outward actions (creating repos, pushing), check the target. Offer sensible next steps in one line.

---

## 4. Known gotchas (learned the hard way)

- **`gh` CLI is not installed.** The agent cannot create GitHub repos; ask the user to create it on github.com (empty, no README) and then `git remote set-url origin …` + `git push -u origin main`.
- **Jest hides the per-test list when run by an AI agent** (it detects `AI_AGENT` / `CLAUDECODE` env vars) and prints only totals. The tests still run. To see the list yourself in Git Bash: `env -u CLAUDECODE -u AI_AGENT npx jest … --verbose`. In the user's own terminal it shows normally.
- **Jest default `testMatch` would also pick up `*.spec.js` Mocha/Playwright files.** `package.json` restricts it to `<rootDir>/tests/integration/**/*.test.js` and ignores `tests/e2e/` (lab requirement). Keep Mocha in `test/`, Jest in `tests/integration/`, Playwright in `tests/e2e/`. Verify with `npx jest --listTests` and `npx playwright test --list`.
- **The lab is graded on three suites** (unit, integration, e2e) plus JPG screenshots and `repositorio.txt`; no Word/PDF. Before a submission, run all three and check each only runs its own files.
- After a fresh clone, Playwright needs `npx playwright install chromium` (browsers are not in `node_modules`).
- `index.html` loads the Socket.IO client from the server (`/socket.io/socket.io.js`), not a CDN — keeps e2e tests offline-safe for that script. jQuery 1.11.1 still comes from `code.jquery.com` (old version; candidate for an upgrade if asked).
- In e2e XSS tests, listen for `page.on('dialog')` to prove no `alert()` ran, and assert the message renders as literal text.
- **`npm install pkg@^x` does not upgrade a transitive dep that still satisfies the lockfile.** After bumping a parent, run `npm update <transitive>` and confirm with `npm ls <transitive>`.
- **Mocha 12 requires Node `^20.19 || >=22.12`.** Current Node is 20.20.0.
- Mocha root-level `before`/`after` in one spec file apply to all Mocha files.
- The original `unalib.js` validators referenced an undefined `phone` variable, so they always returned false inside `try/catch`. Watch for similar silent-failure bugs in course-provided code.
- The Snyk VS Code extension error `command 'snyk.navigateToRange' already exists` is a side-effect of being unauthenticated; fix = Reload Window + authenticate. Not a project bug.
- Remaining accepted risk: `deepmerge@4.3.1` (medium, prototype pollution) via `jest` — no upstream fix yet, dev-only. Re-check each session; remove this line once fixed.

---

## 5. Current state (update every session)

- Snyk (`--dev`): 0 critical, 0 high, 1 medium (deepmerge via jest), 0 low.
- Tests: Mocha 94 passing; Jest 25 passing; Playwright 10 passing.
- Deps: express ^4.22.3, socket.io ^4.8.4; dev: mocha ^12.0.3, jest ^30.5.2, supertest ^7.3.1, socket.io-client ^4.8.4, @playwright/test ^1.64.1.
- Lab steps done: URL→image/video rendering, XSS prevention, Snyk critical+high fixes with BDD, unit tests (images/videos/injection), integration tests (step 9, evidencia 3), e2e Playwright suite, `repositorio.txt`, README.

---

## Self-improvement loop

This file is the agent's memory. It only improves if you maintain it.

**At the start of every session**
1. Read this file fully. Treat §4 and the session log as known facts, but verify anything version- or path-specific before relying on it (`npm ls`, `git remote -v`, re-run Snyk).
2. Run `npm run test:all` to confirm the baseline still matches §5.

**During the session**
- When something surprises you (a command fails, a tool behaves unexpectedly, the user corrects you, a workaround is needed), note it — that is a lesson.

**At the end of every session (before your final message), edit this file:**
1. Update **§5 Current state** with the real numbers you just measured.
2. Add new lessons to **§4 Known gotchas** or **§3 Rules** — one line each, stating the fact *and* what to do about it. If the user corrected your approach, record it as a rule with the reason.
3. **Fix or delete** anything you found to be wrong or outdated. Merge duplicates. Keep the file short enough to read in one pass (target < 250 lines); prefer rewriting an old line over appending a near-copy.
4. Append one entry to the **Session log** below (newest first, keep the last 10; fold older ones into §3/§4 or drop them).
5. Mention in your final message that AGENTS.md was updated and summarize what changed in one line. Commit it together with the session's other changes when the user asks for a commit.

Never record secrets, tokens, OAuth URLs or personal data here.

### Session log

- **2026-10-16 (b)** — Prepared submission: added Playwright e2e suite (`tests/e2e`, 10 BDD tests incl. XSS with dialog detection), `playwright.config.js` with webServer, Jest `testPathIgnorePatterns` for `tests/e2e`, `repositorio.txt`, Spanish README; switched Socket.IO client to the server-served script. Learned: lab is graded on three separate suites + JPGs + repo link.
- **2026-10-16** — Published repo to `elein06/lab5-una-chat`; untracked `node_modules`. Implemented image/video/YouTube URL rendering in unalib and fixed XSS (escape text/name, validate color) plus the `phone` bug. Ran Snyk: fixed critical proxy-addr (CVE-2026-90711) red→green with BDD, then all highs by upgrading express/socket.io/mocha. Added Mocha unit tests (images, videos, injection) and Jest+Supertest+socket.io-client BDD integration tests in `tests/integration/chat.test.js`. Learned: no `gh`, Jest hides verbose for agents, `npm update` for transitive fixes.
