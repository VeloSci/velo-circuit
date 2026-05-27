# AGENTS.md

How AI agents should work in the **velo-circuit** repository.

## Primary goals

1. Keep Boukamp DSL parity with `velo-spectroz` (11 element kinds, brace params, validation).
2. Keep the core framework-agnostic: UI adapters stay thin; logic lives under `src/core/`.
3. Prefer deterministic SVG output and explicit editor presets (`minimal` | `lite` | `extended`).

## Repository map

| Area | Path |
|------|------|
| Domain (AST, graph, commands) | `src/core/domain/` |
| Parser / serializer | `src/core/parser-bridge/` |
| Layout | `src/core/layout/` |
| SVG render + themes | `src/core/render-svg/` |
| Editor + export helpers | `src/core/editor/` |
| Plugins (pan-zoom, sidebar, toolbar, …) | `src/core/plugins/` |
| Framework adapters | `src/adapters/{vanilla,react,vue,svelte,angular,astro}/` |
| Docs site (VitePress) | `docs/` |
| Playground UI | `docs/.vitepress/components/CircuitPlayground.vue` |

## Editor presets

```ts
import { createEditor, resolvePlugins, litePlugins, allPlugins } from 'velo-circuit'

// Full UI: toolbar, DSL CodeMirror sidebar, diagnostics, export panel, grid view
createEditor({ plugins: allPlugins() }) // preset: 'extended'

// Embed: in-canvas picker + floating toolbar only
createEditor({ plugins: litePlugins() }) // preset: 'lite'
```

Adapters accept `preset: 'extended' | 'lite' | 'minimal'` instead of passing plugins manually.

## Export and download

- **Extended preset** sidebar: SVG (params), SVG topo (no params), DSL (full Boukamp); checkbox for dark export theme (default light); SVG always transparent background.
- Helpers: `buildDownloadCircuitSvg`, `serializeAstForExport`, `sanitizeDslFilename`, `downloadTextFile`, `copyTextToClipboard`.
- Standalone diagrams: `buildDownloadCircuitSvg(dsl, { themeMode: 'light', showParams })` or `renderDslPreviewSvg`.
- Guide: [docs/guide/export-download.md](docs/guide/export-download.md).

## Static rendering (no editor)

```ts
import { renderDslPreviewSvg, exportPreviewSvgWithStyles, getTheme } from 'velo-circuit'

const svg = renderDslPreviewSvg('R0-p(R1,C1)-Wo2', {
  themeMode: 'dark',
  colorMode: 'multicolor',
  showParams: true,
})
```

## Verification

From repo root:

```bash
pnpm run typecheck
pnpm test
pnpm run build
pnpm run docs:build
```

## Integration with velo-spectroz

- No Rust dependency between repos; share **DSL strings** only.
- Spectroz docs link via pnpm workspace `../velo-circuit`; after core changes: `pnpm build` in velo-circuit, then reinstall in spectroz.
- Spectroz playground: `docs/guide/velo-circuit.md` in the spectroz repo.

## Known pitfalls

- Pan/zoom: editor SVG uses `overflow: visible` so tall circuits are not clipped before the canvas edge; canvas still clips at the viewport border.
- Clipboard in iframes or non-HTTPS may need the `copyTextToClipboard` fallback (already used in sidebar plugins).
- Docs dev imports `src/` directly; npm consumers use `dist/` — run `pnpm build` before publish.
- WASM / fitting lives in **velo-spectroz**, not here.
