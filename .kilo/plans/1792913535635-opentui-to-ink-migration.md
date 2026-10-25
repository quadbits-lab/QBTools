# Sticky inspector strip + full-width board

## Goal

Act on the screenshot annotations: move the **INSPECTOR** out of the right column into a **sticky strip under the board**, rebuild it as a prominent three-zone panel, and give the board the full width. The event log keeps its place below the strip.

## Current state (verified)

- `apps/cli/src/tui/console.tsx` layout: `wide = columns >= 92`; `inspectorWidth = wide ? max(42, floor(columns * 0.3)) : columns`; `boardWidth = wide ? columns - inspectorWidth - 1 : columns`; `cardCols = max(1, floor((boardInner + 1) / 23))`; `cardWidth` from `cardCols`; `headerRows` 7/10; `logRows = clamp(3, rows * 0.18, 6)`; `mainRows = rows - headerRows - 1 - (logRows + 2) - 1`; `boardViewport = mainRows - 3`. Render order: `Header` → `CommandBar` → row(`ToolBoard` | `Inspector`) → `SYS_STREAM` log → `StatusBar`.
- `console/inspector.tsx` — a vertical pane: name, `cat:slug`, tagline, `CLI INVOCATION` box, `SYNOPSIS / FLAGS`, `AVAILABILITY`; it also hosts the tool form and the cleanup/settings/account cards (`form` prop replaces the details).
- `console/tool-form.tsx` — a vertical form: the tool name + slug, then per field a label row and an input row, then a `▸ Run` row; file autocomplete, inline select lists, a running label and an error line.
- `console/tool-board.tsx` — renders the board window with a pinned footer; `board.ts` is the pure layout/navigation model (unchanged by this task).
- `ui/panel.tsx` — bordered panel whose label sits in the top border; content is clipped when `height` is set. **Every child row needs `flexShrink={0}`**, otherwise yoga squeezes rows and text overprints (already hit in the header, the inspector and the account card).
- Tests: `tui.test.tsx` (11 cases) + `console/board.test.ts` (9 cases). `ink-testing-library` reports 100 columns, `renderToString` 80.

## Decisions (agreed)

1. **The inspector moves to a sticky strip directly under the board.** The right column is removed; the board is always full width. The event log stays below the strip.
2. **Three zones.** Idle: `identity │ CLI invocation │ flags + availability`. With a tool open: `identity │ fields` (the CLI/flags zone is replaced by the form, fields in 2–4 columns). Cleanup/settings/account cards take the full strip width.
3. **More prominent:** the strip border and the tool name take the category accent; the label reads `▸ INSPECTOR` / `▸ INSPECTOR: OPEN`; the availability is a colored chip; the command is a boxed `$ qbtools run …`; `▸ Run` is a filled accent chip.
4. **Sticky = fixed height per mode**, so the board never jumps mid-interaction; the strip height is capped so the board keeps room.

## Layout

```
┌─ QB-CORE … ──────────────────────────────────────────────────────── LOCAL ┐
│  …wordmark…                        QBTools CLI - Private By Default       │
└───────────────────────────────────────────────────────────────────────────┘
 user@host : ~/dir$ qbtools                                  <Enter> Run <Tab> Next
┌─ TELESCOPE: TOOLS ───────────────────────────────────────────── 42 TOOLS ┐
│ ▸ IMAGE TOOLS  .img (8) ──────────────────────────────────────────────── │
│ ╭──────────────╮ ╭──────────────╮ ╭──────────────╮ ╭──────────────╮ …    │
│ │ Compress     │ │ Resize Image │ │ Convert      │ │ Background   │      │
│ │ compress-…   │ │ resize-image │ │ convert-…    │ │ remove-back… │      │
│ ╰──────────────╯ ╰──────────────╯ ╰──────────────╯ ╰──────────────╯      │
│ …                                                                        │
│ Showing 42 of 42 tools                                                   │
└──────────────────────────────────────────────────────────────────────────┘
┌─ ▸ INSPECTOR ────────────────────────────────────────────────────── IMG ─┐
│ Compress Image          │ CLI INVOCATION        │ SYNOPSIS / FLAGS        │
│ img:compress-image      │ ╭───────────────────╮ │ --in <path>             │
│ Reduce image size with  │ │ $ qbtools run …   │ │ --format <value>        │
│ control over quality.   │ ╰───────────────────╯ │ --quality <n>           │
│ [+sharp]                │                       │ AVAILABILITY            │
│                         │                       │ needs the sharp package │
└──────────────────────────────────────────────────────────────────────────┘
┌─ SYS_STREAM: RING_BUFFER ────────────────────────────────────────────────┐
│ [12:00:00.001] SYS_BOOT: …                                               │
└──────────────────────────────────────────────────────────────────────────┘
 NORMAL │ qbtools │ 0 NETWORK EGRESS │ <C-f> Focus  <C-k> Clear  <C-l> Log
```

Open state:

```
┌─ ▸ INSPECTOR: OPEN ──────────────────────────────────────────────── IMG ─┐
│ ▸ Compress Image        │ Image file *        │ Output format            │
│   img:compress-image    │ › ~/Desktop/a.png   │ › WEBP                   │
│   [+sharp]              │ Quality (1-100)     │ Max long edge            │
│   $ qbtools run comp…   │ › 80                │ ›                        │
│   ▸ Run  Ctrl+R         │                     │                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Metrics

```
headerRows   = columns >= 92 ? 7 : 10
logRows      = card === "none" ? clamp(3, floor(rows * 0.18), 6) : 3
stripRows    = clamp(stripModeRows, 6, floor(rows * 0.42))
boardRows    = max(5, rows - headerRows - 1 - stripRows - (logRows + 2) - 1)
boardViewport= boardRows - 3                     // panel borders + footer
boardWidth   = columns                           // full width now
boardInner   = columns - 4
cardCols     = max(1, floor((boardInner + 1) / 23))
cardWidth    = max(20, floor((boardInner - (cardCols - 1)) / cardCols))
```

`stripModeRows`: details 6, tool form 14, cleanup 14, settings 9, account 8. At 160×60: boardRows ≈ 60 − 7 − 1 − 6 − 6 − 1 = 39, and 6 card columns. At 120×32 with a form open: strip 13, log 3, board ≈ 8.

### Strip internals

- Row of zones, each `height={stripRows - 2}`, `flexShrink={0}`, `overflow="hidden"`; zones 2 and 3 get `borderLeft` (single) plus `paddingX={1}` as the divider.
- Idle widths: identity 30% (min 22), CLI 32% (min 24), flags the remainder.
- Open widths: identity 24% (min 22), fields the remainder.
- Cards (cleanup/settings/account) render full width, no zones.
- Zone 1: name (bold, accent), `cat:slug` (dim), tagline (wrapped, max 2 lines), availability chip `[local]` / `[+sharp]` / `[~ffmpeg]` / `[▸ server]`; in open mode also the boxed command and a `▸ Run  Ctrl+R` chip.
- Zone 2 (idle): `CLI INVOCATION` + the boxed `$ qbtools run <slug>`; then `SYNOPSIS / FLAGS` + the flags wrapped.
- Zone 3 (idle): `AVAILABILITY` label + the hint text.
- Fields zone (open): `fieldCols = clamp(1, floor(fieldsWidth / 32), 4)`; fields chunked **column-major** (`ceil(n / fieldCols)` per column); each cell = label row + input rows; caps so the fixed strip height never clips: select `visibleRows ≤ 4`, textarea `visibleRows ≤ 3`, file suggestions ≤ 4.

## Architecture

- **`console/inspector.tsx`** — rewritten as `InspectorStrip`: props `{ width, height, mode, tool, availability, flags, children }`; `mode: "details" | "tool" | "cleanup" | "settings" | "account"`; renders zones 1–3 or the full-width card. The panel label/right tag are built here.
- **`console/tool-form.tsx`** — layout changes only: drop the name/slug header (the strip's zone 1 owns identity), render the fields in columns via `fieldCols`, keep the Run row in zone 1 (passed as a prop or rendered by the strip), keep autocomplete/selects/running/error behaviour. It receives `width` (the fields zone) and `height` (strip content height).
- **`console/console.tsx`** — remove `wide`/`inspectorWidth`; board full width; compute `stripRows`/`boardRows` per mode; render `ToolBoard` then `InspectorStrip` then the log then the status bar; pass the form/cards into the strip.
- **`console/cleanup-card.tsx`, `settings-card.tsx`, `account-card.tsx`** — receive the full strip width; settings becomes a 2-column field row, cleanup keeps its list (its `visibleRows` capped to the strip), account becomes a 2-column info block.
- **`console/tool-board.tsx`** — only the `width` prop changes (already parameterised).
- Tests + docs as listed below.

## Ordered task list

1. Add `stripModeRows` + `stripRows`/`boardRows` math in `console.tsx`; switch the board to full width and drop `wide`/`inspectorWidth`; keep `cardCols`/`cardWidth` as the single source of truth.
2. Rewrite `console/inspector.tsx` as the three-zone `InspectorStrip` (idle/open), with the accent border, the bracketed label, the availability chip and the boxed command.
3. Rework `console/tool-form.tsx` for the fields zone: column-major layout, capped select/textarea/autocomplete rows, the `▸ Run  Ctrl+R` chip in zone 1.
4. Adapt the cleanup/settings/account cards to the wide strip (full width, capped list heights, settings in two columns).
5. Move the event log + status bar below the strip; shrink `logRows` to 3 while a card is open.
6. Update tests: the frame no longer contains a right-column inspector; assert the strip label `▸ INSPECTOR`, the three zone labels (`CLI INVOCATION`, `SYNOPSIS / FLAGS`, `AVAILABILITY`); open a tool and assert the form fields appear in the strip (`Image file`, `Output format`) with the board above; keep the boot/filter/arrow/open tests.
7. Update `apps/cli/README.md` (the sketch and the console description), `apps/cli/docs/features.md` (the inspector strip), and `AGENTS.md` if it names the inspector position.
8. Validate and eyeball pty frames at 160×60 (idle + form open), 120×32 and 80×24.

## Risks

- **Flex squeezing in the strip** — the fixed-height panel clips; every zone, row and field cell must set `flexShrink={0}` and the zones need `overflow="hidden"`.
- **Fixed-height clipping** — tall tools (7+ fields, select lists, autocomplete) can exceed 14 rows; the caps above are mandatory, and the fields zone must clip rather than squash.
- **Small terminals** — the strip and log compete with the board; the log already drops to 3 rows when a card is open. Below ~45 rows opening a tool leaves a thin board; acceptable, documented.
- **Column chunking** — column-major with uneven field heights can leave a column taller than the strip; the cap math (`ceil(n / fieldCols)`) plus the height caps keep it bounded.
- **Test width** — harnesses render at 100 (interactive) and 80 (static) columns; the strip's zones must survive 80 columns (identity 22 + CLI 24 + the rest).

## Validation

- `bun test apps/cli` and the full `bun test`; `bun run typecheck`; `bun run lint`.
- `bun run --cwd apps/cli build:package` + `bun dist/bin.js version` + `echo smoke | bun dist/bin.js run word-counter --stdin --json`.
- pty frames: 160×60 idle (6 columns + three-zone strip), 160×60 with a tool open (fields in columns, Run chip), 120×32, 80×24; filter → open → run still writes to the log.

## Out of scope

- The board model/navigation (`board.ts`) and the card design.
- The prompt semantics, the header, the status bar content.
- Moving the prompt or the log; collapsible sections.
