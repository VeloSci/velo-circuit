# Export and download

The **extended** editor preset includes an **Export** sidebar panel and a **copy** control on the Boukamp DSL field.

## Sidebar export panel

| Control | Action | Filename |
|---------|--------|----------|
| **SVG** | Standalone SVG with parameter labels on symbols | Full DSL + `.svg` |
| **SVG topo** | Same, but symbols without `{…}` values (kinds + IDs only) | Topology DSL + `.svg` |
| **DSL** | Full Boukamp text with all embedded parameter values | Full DSL + `.dsl` |
| **Dark export theme** | Optional checkbox — default is **light** theme | — |

All SVG exports use a **transparent background** (no canvas fill), no grid, and multicolor element strokes. The editor’s on-screen dark/light mode does not affect exports unless you check **Dark export theme**.

Example for `R0{10}-p(R1{100},C1{1e-5})`:

- `R0{10}-p(R1{100},C1{1e-5}).svg` — SVG with params
- `R0-p(R1,C1).svg` — SVG topo
- `R0{10}-p(R1{100},C1{1e-5}).dsl` — full DSL file

## Copy DSL

The clipboard button on the DSL panel copies the current editor value (respects the **Params** toggle).

## Programmatic export

```ts
import {
  parseBoukamp,
  buildDownloadCircuitSvg,
  serializeAstForExport,
  sanitizeDslFilename,
  downloadTextFile,
} from 'velo-circuit'

const ast = parseBoukamp('R0{10}-p(R1{100},C1{1e-5})')
if ('type' in ast) throw new Error(ast.message)

const full = serializeAstForExport(ast, true)
const topo = serializeAstForExport(ast, false)

const svg = buildDownloadCircuitSvg(full, { themeMode: 'light', showParams: true })
const svgTopo = buildDownloadCircuitSvg(topo, { themeMode: 'light', showParams: false })

downloadTextFile(sanitizeDslFilename(full, 'svg'), svg, 'image/svg+xml;charset=utf-8')
downloadTextFile(sanitizeDslFilename(topo, 'svg'), svgTopo, 'image/svg+xml;charset=utf-8')
downloadTextFile(sanitizeDslFilename(full, 'dsl'), full)
```

## Related

- [Static SVG rendering](/guide/static-rendering)
- [Editor presets](/guide/editor-presets)
- [Package exports](/api/exports)
