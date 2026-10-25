# Rebuild: OG Banner Maker + App Icon Generator

**Approach:** Keep the proven engine stack (`packages/engines/src/graphic/` — SVG composition rasterized by resvg-WASM in workers, already well tested) and rebuild both tool widgets completely, fix the engine bugs, and add the missing capabilities. The current in-flight refactor has sound bones (worker preview pipeline, history, split components) but leaks workers, has broken interaction math, and is desktop-hover-only — we rewrite the widget layer cleanly on top of it rather than discarding the render pipeline.

---

## Part 0 — Shared cleanups

- Move `apps/web/src/tools/og-banner-maker/controls.tsx` (`ColorField`, `Section`) to `apps/web/src/components/kit/color-field.tsx` + `kit/section.tsx`; update the two importers (og-banner-maker, app-icon-generator). Cross-tool imports into a tool folder are a smell.
- Add a tiny shared `useDesignHistory` hook + autosave helper (localStorage, debounced, try/catch for quota) used by both tools so undo/redo and session-restore behave identically.

## Part 1 — Engine: OG layout unification + extensions (`packages/engines/src/graphic/`)

1. **Single layout function.** Create `layoutOg(design): OgLayout` (new `og-layout.ts`) computing _once_: content frame, per-template hero box/radius/scrim, text frame, and all element boxes. `composeOgSvg()` and `ogElementBoxes()` both consume it — eliminating the layout math currently triplicated across `compose.ts:312-411` and `compose.ts:434-516` (the source of overlay misalignment fragility).
2. **Additive design-model extensions** (old `.qbdesign.json` files keep loading via a `normalizeOgDesign` defaults pass in `projects.ts`):
   - `TextStyle.opacity`, `TextStyle.outline?: { color, width }` (rendered with `paint-order="stroke"` — resvg-safe), `TextStyle.show` (same for subtitle).
   - Hidden elements return `null` boxes (fixes invisible-badge hit-testing).
3. **Text shadow** via `feDropShadow` — verified against resvg in a test render; ship outline-only if it renders wrong.
4. **More fonts**: add ~5 fontsource families (Space Grotesk, Playfair Display, Bebas Neue, Source Serif 4, JetBrains Mono) to `fonts.ts` metrics + `graphic-assets.ts` WOFF2 pins; extend `TextFont`.
5. **Defaults**: surface existing `GRADIENTS`/`SOLIDS` as inspector preset swatches (currently dead code).
6. **Tests** (`graphic.test.ts`): layout consistency per template, outline/opacity in output SVG, hidden-element behavior, old-project normalization.

## Part 2 — OG Banner Maker widget rebuild (`apps/web/src/tools/og-banner-maker/`)

- **`index.tsx`** (orchestrator, rewritten): dispose both workers on unmount (fixes the leak); proper preset params (`params.template/from/to/angle` instead of the `numWidth === 1500` hack — registry's `twitter-banner` preset gains explicit params); no-op drags no longer push history; keyboard effect gets a real deps array; toast uses the computed filename; hero nudge math fixed to match the drag path; autosave + restore-with-toast.
- **`editor-canvas.tsx`** (rebuilt): overlays always rendered (subtle) so elements are tappable — not hover-gated; **real resize handles** (text: edge = block width, corner = font size; badge/logo: corner = size; hero: edges = width/x); `touch-action: none` + ≥24px hit targets for touch; dimension label; selection/handles keep the emerald design language.
- **`inspector-panel.tsx` split** into focused files (`inspector/` folder): TemplatePicker with **live thumbnails** (compose default designs → inline SVG data-URL `<img>`, in-document fontsource CSS so they match), background/gradient swatches + custom, text controls with font dropdown/opacity/outline, element list with visibility toggles, artwork (logo/hero via `FileDrop`), export (format/scale/optimize, OG/Twitter meta snippet, project save/load).
- **Responsive**: `lg:grid-cols-[minmax(0,1fr)_minmax(300px,400px)]`; stacks cleanly below `lg`; template grid 2-col mobile / 4-col desktop; all controls full-width on mobile.

## Part 3 — Engine: app icon fixes + macOS (`packages/engines/src/graphic/`)

1. Thread `options.optimize` into `renderPngBlob` → `renderSvg` (the toggle is currently dead).
2. Gate `README-MANIFEST.md` behind the android platform (iOS-only ZIPs currently contain a stray `android/` README).
3. Low-res warning when raster artwork is < 102px intrinsic (mirrors favicon.ts).
4. Export `variantDesign` so the UI can render **real** Dark/Tinted previews.
5. **macOS kit** (new `icns.ts` + `appicon.ts` extension): `macos/AppIcon.appiconset/` (16–1024px PNGs + `Contents.json`) and a standalone `AppIcon.icns` (ICNS container wrapping PNG chunks: ic07…ic14). Add `"macos"` to `AppIconPlatform`, ZIP prefixing, `README-MACOS.md` instructions.
6. **Tests**: iOS-only ZIP excludes all `android/` paths (currently fails); macOS file list + ICNS header/chunk bytes; optimize threading; low-res warning.

## Part 4 — App Icon Generator widget rebuild (`apps/web/src/tools/app-icon-generator/`)

- Split the 617-line file into `index.tsx` (state/history/workers/autosave) + `preview-stage.tsx` + inspector sections; workers disposed on unmount; undo/redo (⌘Z) like the OG tool.
- **Platforms**: three clear Switches (iOS / Android / macOS, at least one required) replacing the confused radiogroup + "Combined" chip.
- **Real Dark/Tinted previews** rendered through the debounced preview pipeline using the exported `variantDesign` (only when enabled) — replacing CSS-overlay fakes.
- **Export with progress + cancel**: pass `onProgress` + `AbortSignal` to `exportWorker.run` (worker client already supports both) → Progress bar with stage labels and a Cancel button; AbortError handled quietly, previous result kept.
- **Preview stage**: larger hero preview, real iOS variants, Android shape row with `flex-wrap` + safe-zone toggle (fixes ~360px overflow), macOS rounded-square preview, size ladder.
- Registry: add macOS/icns keywords to the tool entry.

## Verification

- `bun test` (engine suites incl. new tests), `bun run typecheck`, `bun run lint`, `bun run build`.
- `bun run dev` manual pass on both tools: upload/drag/resize with mouse + touch emulation, template switching preserves content, exports (PNG/JPG/WebP; icon ZIP contents per platform combination), project save/load incl. old files, preset routes (`/tools/og-banner-maker/og-1200x630`, `twitter-banner`), mobile widths.

Registry entries, slugs, and `widgets.ts` are untouched, so the parity test stays green.
