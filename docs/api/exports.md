# Package Exports

Published files are under `dist/`. Import paths below match `package.json` `exports`.

## Entry points

| Import | Use when |
|--------|----------|
| `velo-circuit` | Core API: editor, parser, layout, render, grid, plugins, DSL CodeMirror |
| `velo-circuit/core` | Alias of main entry (same symbols) |
| `velo-circuit/vanilla` | `mountCircuitEditor`, `mountDslCodeMirror`, `mountCircuitWorkbench`, `createCircuitEditorVanilla` |
| `velo-circuit/react` | `useCircuitEditor`, `useDslCodeMirror`, `useCircuitWorkbench`, `createReactCircuitEditor` |
| `velo-circuit/vue` | `useCircuitEditor`, `useDslCodeMirror`, `useCircuitWorkbench`, `createVueCircuitEditor` |
| `velo-circuit/svelte` | `dslCodeMirror`, `circuitEditor`, `bindCircuitWorkbench`, `createSvelteCircuitEditor` |
| `velo-circuit/angular` | `createAngularCircuitEditorAdapter` (`mount`, `mountDsl`, `mountWorkbench`) |
| `velo-circuit/astro` | `mountAstroCircuitEditor`, `mountAstroDslCodeMirror`, `mountAstroCircuitWorkbench` |

There is **no** separate `velo-circuit/grid` or `velo-circuit/plugins` subpath — import those from the main entry.

## What to import for each task

| Task | Import from | Symbols |
|------|-------------|---------|
| Full interactive editor | Adapter or `velo-circuit` | `createEditor`, `resolvePlugins('extended')` or adapter `preset: 'extended'` |
| Lite embed (no app toolbar) | Adapter or `velo-circuit` | `preset: 'lite'` or `litePlugins()` |
| Read-only schematic | `velo-circuit` | `renderDslPreviewSvg` |
| DSL text field | `velo-circuit` | `createDslCodeMirror` |
| Circuit catalog table | `velo-circuit` | `createCircuitGrid`, `importSpectrozCatalog` |
| Parse / validate DSL | `velo-circuit` | `parseBoukamp`, `validate`, `createAdapter` |
| Download DSL / SVG files | `velo-circuit` | `buildDownloadCircuitSvg`, `serializeAstForExport`, `sanitizeDslFilename`, `downloadTextFile` — [Export guide](/guide/export-download) |
| Custom editor UI | `velo-circuit` | Individual `*Plugin()` factories — [Plugins API](/api/plugins) |
| React app | `velo-circuit/react` | `useCircuitEditor({ preset: 'lite' })` |
| Vue app | `velo-circuit/vue` | `useCircuitEditor({ preset: 'extended' })` |

## Core export groups

### Editor

`createEditor`, `EditorInstance`, `EditorOptions`, `EditorPreset`, `allPlugins`, `litePlugins`, `minimalPlugins`, `resolvePlugins`, plugin factories, `createDslCodeMirror`, `buildDownloadCircuitSvg`, `serializeAstForExport`, `sanitizeDslFilename`, `downloadTextFile`, `copyTextToClipboard`

### Parser

`parseBoukamp`, `serialize`, `validate`, `tokenize`, `createAdapter`, `resolveCircuitParams`, `formatMissingParams`, `ElementRegistry`, `StrictOptions`

### Layout

`buildLayout`, `computeBounds`, `LayoutOptions`, `DEFAULT_LAYOUT_OPTIONS`

### Render

`renderDslPreviewSvg`, `renderCircuit`, `exportSvgWithStyles`, `getTheme`, `ThemeMode`, `SymbolColorMode`, `ConnectionStyle`

### Grid

`createCircuitGrid`, `importSpectrozCatalog`, `GRID_THEME_CSS`, `ensureGridThemeStyles`

### Domain

`ElementKind`, `ELEMENT_KINDS`, `CircuitNode`, `CircuitDocument`, persistence helpers — see [Core API](/api/core)

## Adapter `preset` option

All framework adapters accept:

```ts
preset?: 'minimal' | 'lite' | 'extended'  // default: 'extended'
```

Re-exported as `EditorPreset` from each adapter package.

## Dependencies

Runtime dependencies include `@codemirror/*` for the DSL field. The **canvas and SVG pipeline** do not require React/Vue. Framework packages are only needed when using those adapters.

## Related

- [Getting Started](/guide/getting-started)
- [Editor Presets](/guide/editor-presets)
- [Adapters](/adapters/)
