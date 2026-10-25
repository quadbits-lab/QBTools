# Local-first + loaders + autocomplete & auto-suggest

## 1. Local-first defaults (login optional)

- **No forced wizard.** `config.onboarded` defaults to `true`; the wizard screen is deleted. App boots straight to **Dashboard** — fully functional offline. Settings stays in the sidebar, reworded: *"Everything works offline — a server is only needed for sync, AI helpers and media storage."*
- **Header chip**: `○ signed out` becomes a calm `● local`. Signed-in shows the user as today.
- **Account screen reframed**: "Working in local mode" + what connecting unlocks (favorites/recents sync, AI helpers, media storage upload/download) + the exact login one-liner. Never a blocker.
- **`qbtools login` copy** leads with "Optional:" and the same list.

## 2. Loaders & micro-animations

New `src/tui/components/loaders.tsx`:
- **`Spinner`** — braille frames (`⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏`, ~80ms) with label: dashboard recents load, account server probe, cleanup scan, tool run before first progress tick.
- **`BootSplash`** — ascii-font logo + spinner on launch while config resolves (min ~600ms), then Dashboard.

`useTimeline` micro-animations:
- **Progress bar** fills ease toward the latest fraction (`outQuad`) instead of stepping.
- **Header status dot** gentle pulse.
- **Dashboard** rows reveal staggered (~40ms apart) on mount.
Timers/timelines degrade to static first frames in tests.

## 3. File search, auto-suggest & autocomplete (new)

**a) File-path autocomplete in tool forms** — the big one. When a `file` field is focused:
- Typing a path fragment (`./re`, `~/Doc`, `/var/log/`) shows a live suggestion box under the field: entries from the fragment's directory, fuzzy-filtered by basename, dirs first with `dir/` markers, capped at 6.
- **↑/↓** browse suggestions, **Enter** accepts (with `~` expansion), **Tab** accepts + advances, **Esc** dismisses. Debounced (~120ms) directory reads, cancelled on unmount.
- New testable `services/file-suggest.ts`: `suggestFiles(prefix, { limit })` — tilde expansion, dir/basename split, fuzzy filter, dir-first sort. Unit tests against fixture dirs.

**b) Search screen autocomplete** — already live-fuzzy; add a "top match" hint line showing the leading slug + tagline under the input (updates per keystroke), so Enter-from-input opens the best match directly.

**c) Headless auto-suggestion** — unknown commands/slugs suggest the nearest real names using the registry's Levenshtein (`editDistance`):
- `qbtools lst` → `Unknown command: lst — did you mean 'list'?`
- `qbtools run wordcoutner` → `Unknown tool: wordcoutner — did you mean 'word-counter'? (also: case-converter)` (top 3, only when distance is sane).

## 4. Media storage commands (auth's payoff)

`media` command group over existing `/api/media/*` (requires the optional API key; exit 2 + login hint otherwise):
- `media list [--search s] [--kind image|video|audio|document]` — table (id, name, kind, size, date).
- `media get <id> [--out dir]` — download a stored file.
- `media put <file> [--name]` — reserve → PUT → complete upload.

## 5. Tests & docs

- New tests: `suggestFiles` against fixture dirs (incl. tilde-free tmp paths), `nearestNames` distance behavior, headless suggestion output (`runHeadless(["lst"])` mentions "did you mean"), media commands with mocked fetch (incl. unauthorized exit 2). Update config default (`onboarded: true`) and app-shell test (boots to dashboard).
- Docs: README commands table + features matrix + tutorials gain media & autocomplete sections; auth copy marked optional everywhere.

## Files

`services/config.ts` · `tui/app.tsx` (splash, no wizard) · `tui/components.tsx` (header chip) · new `tui/components/loaders.tsx` · new `services/file-suggest.ts` · `tui/screens/{settings,dashboard,account,tool,search-in-browse,cleanup}.tsx` · new `headless/cmd/media.ts` · `services/api.ts` (media endpoints) · `headless/{run.ts,cmd/{run,discover}.ts}` (suggestions) · `headless/commands.ts` · tests · README + docs.