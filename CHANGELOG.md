# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- **Export panel downloads:** SVG with parameters, **SVG topo** without parameters, and full **DSL** (always includes `{…}` values); optional **Dark export theme** checkbox (default light); SVG uses transparent background regardless of theme
- **`buildDownloadCircuitSvg()`** / **`serializeAstForExport()`** for programmatic exports
- **Copy DSL feedback:** clipboard helper with `execCommand` fallback and brief ✓ confirmation on the sidebar copy button
- Public helpers: `sanitizeDslFilename`, `downloadTextFile`, `copyTextToClipboard`, `flashButtonLabel`
- [Export and download](./docs/guide/export-download.md) guide and [AGENTS.md](./AGENTS.md) for agent workflows

### Fixed

- **Tall circuits + pan:** editor SVG no longer clips circuit geometry before the canvas edge when panning vertically (`overflow: visible` on `circuit-editor-root`; SVG size tracks viewport on resize)
- Export sidebar buttons previously copied to clipboard only (often silent failure); they now trigger file downloads as documented

### Changed

- LICENSE copyright line: `2024-2026 velo-circuit authors`

## [1.0.0] — 2026-05-23

### Added

- **Static SVG preview API:** `renderDslPreviewSvg()`, `exportPreviewSvgWithStyles()`, and `preview` mode on `renderDslToSvg` / `renderCircuitEx` for docs, thumbnails, and read-only diagrams
- **`connectionStyle`:** curved wires by default; `orthogonal` option for schematic-style routing
- **`SymbolColorMode`:** `bicolor` and `multicolor` theme CSS via `buildPreviewThemeCSS()` and per-kind stroke colors
- **`getJunctionHub()`** exported from the public API — junction dots align with wire convergence ports
- [Static SVG Rendering](./docs/guide/static-rendering.md) guide, [Adapters overview](./docs/adapters/index.md), and SVG previews in all [examples](./docs/examples/)
- [Migration guide](./docs/guide/migration-v1.md) for upgrading from 0.x
- npm package metadata: `repository`, `homepage`, `bugs`, `keywords`, optional framework `peerDependencies`

### Changed

- Documentation overhaul: API, guides, adapters, and reference aligned with `velo-circuit` package name
- **203 tests** covering parser, layout, renderer, preview mode, grid, editor, and all 11 element kinds

### Fixed

- Junction hub dots no longer render at the geometric center of junction boxes — they align with curved and orthogonal wire ports

## [0.4.0] — 2026-05-23

### Added

- Element kinds `G`, `Pdw`, `CC`, `HN` — full **11/11** parity with `velo-spectroz`
- [Symbol design system](./docs/reference/symbol-design-system.md) and complete [element types](./docs/reference/element-types.md) reference

### Changed

- **Symbol homogenization:** all element glyphs use the outline-only family (`fill="none"`)
- **Unified stroke:** base `theme.strokeWidth` **2.0** with documented multipliers (plates 1.25×, Warburg diagonals 1.15×, etc.)
- **Per-kind colors:** `--ce-{kind}-stroke` on `.circuit-node[data-kind="…"]`
- **Grid:** world-space infinite grid alignment and rendering fixes
- Editor palette and validation messages cover all 11 kinds

## [0.1.0] — 2026-04-26

### Added

- `core/domain/circuit.ts` — ElementKind, CircuitNode, ELEMENT_KINDS, traversal helpers
- `core/domain/graph.ts` — EditableGraph, ElementNode, Port, Connection
- `core/domain/document.ts` — CircuitDocument, ViewportState, SelectionState, HistoryState
- `core/domain/validation.ts` — ValidationError, ValidationWarning, ValidationIssue
- `core/domain/commands.ts` — All editor command types
- `core/domain/diagnostics.ts` — Diagnostic, filterErrors, filterWarnings
- `core/domain/translator.ts` — astToGraph(), graphToAst()
- `core/domain/persistence.ts` — serializeCircuit(), deserializeCircuit(), circuitToJson()
- `core/state/store.ts` — createStore() with undo/redo and pub/sub
- `core/parser-bridge/lexer.ts` — tokenize() with position tracking
- `core/parser-bridge/parser.ts` — parseBoukamp() recursive descent parser
- `core/parser-bridge/serializer.ts` — serialize() AST → canonical Boukamp DSL
- `core/parser-bridge/validate.ts` — duplicate ID detection, DC path warnings
- `core/layout/layout-engine.ts` — buildLayout(), computeBounds()
- `core/render-svg/symbols.ts` — SVG symbols for R, C, L, Q, W, Ws, Wo; DEFAULT_THEME
- `core/render-svg/renderer.ts` — renderCircuit()
- `core/render-svg/renderer-ex.ts` — renderCircuitEx(), renderDocument(), extractSvgSnapshot()
- `core/render-svg/themes.ts` — DARK_THEME, light/dark themes, buildThemeCSS()
- `core/render-svg/viewport.ts` — createViewportController(), zoom, pan, fit-to-view
- `core/editor/core.ts` — createEditor() with mount, getValue, setValue, dispatch, undo/redo, events
- `core/editor/toolbar.ts` — buildToolbarHTML(), buildToolbarCSS(), element palette
- `core/editor/panels.ts` — buildPropertiesPanelHTML(), buildDiagnosticsPanelHTML(), buildDslPanelHTML()
- `core/editor/interaction.ts` — attachInteractionEvents(), pointer, drag, pan, zoom, keyboard
- `core/editor/commands-builder.ts` — buildInsertElementCommand(), buildDeleteNodeCommand(), etc.
- Adapters: vanilla, react, vue, angular, astro, svelte
- Tests: 45 passing (parser, editor, layout, integration)
- TypeScript strict mode, no external runtime dependencies