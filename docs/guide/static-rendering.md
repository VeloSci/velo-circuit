# Static SVG Rendering

Use the render API when you need circuit diagrams **without** the interactive editor — documentation sites, thumbnails, exports, or framework apps that only display a schematic.

## Quick start

```ts
import { renderDslPreviewSvg } from 'velo-circuit'

const svg = renderDslPreviewSvg('R0-p(R1,C1)', {
  themeMode: 'dark',
  colorMode: 'multicolor',
  connectionStyle: 'curved',
})

document.getElementById('preview').innerHTML = svg
```

`renderDslPreviewSvg` parses the DSL, lays out the graph, renders SVG, and embeds theme CSS in one call. No selection chrome, no hit targets — only symbols, wires, and labels.

## Editor vs preview

| | Interactive editor | Static preview |
|--|-------------------|----------------|
| API | `createEditor()` + `mount()` | `renderDslPreviewSvg()` |
| Output | Full UI (grid, toolbar, pan/zoom) | SVG string only |
| Wires | Curved (default) | `curved` (default) or `orthogonal` |
| Colors | Per-kind via editor CSS | `multicolor` (default) or `bicolor` |
| Junction dots | At wire hub ports | Same hub logic |

## Wire style

```ts
// Curved — default, matches the editor
renderDslPreviewSvg('R0-p(R1,C1)', { connectionStyle: 'curved' })

// Orthogonal — right-angle routing (useful for print-style diagrams)
renderDslPreviewSvg('R0-p(R1,C1)', { connectionStyle: 'orthogonal' })
```

Parallel branches (`p(R1,C1)`) make the difference between curved and orthogonal routing easy to see.

## Color mode

```ts
// Multicolor — per-kind strokes (R red, C blue, …), aligned with the editor
renderDslPreviewSvg('R0-p(R1,C1)', { colorMode: 'multicolor', themeMode: 'dark' })

// Bicolor — single stroke from theme (light/dark)
renderDslPreviewSvg('R0-p(R1,C1)', { colorMode: 'bicolor', themeMode: 'light' })
```

## Lower-level pipeline

```ts
import { parseBoukamp, buildLayout, renderDslToSvg, exportPreviewSvgWithStyles, getTheme } from 'velo-circuit'

const ast = parseBoukamp('R0-p(R1,C1)-Wo2')
const graph = buildLayout(ast)
const theme = getTheme('dark')

const raw = renderDslToSvg('R0-p(R1,C1)-Wo2', {
  preview: true,
  theme,
  connectionStyle: 'curved',
})

const standalone = exportPreviewSvgWithStyles(raw, theme, {
  colorMode: 'multicolor',
  themeMode: 'dark',
})
```

For editor exports that keep selection rectangles, use `exportSvgWithStyles` with `renderCircuit` instead of the preview helpers.

## VitePress / documentation

This site registers `<CircuitSvgPreview />` for examples:

```markdown
<CircuitSvgPreview dsl="R0-p(R1,C1)" />
<CircuitSvgPreview dsl="R0-p(R1,C1)" wires="orthogonal" caption="Orthogonal wires" />
```

See [Examples](/examples/basic-circuit) and the [Render API](/api/render).

## Next

- [Render & Themes API](/api/render)
- [Layout API](/api/layout)
- [Adapters](/adapters/) — interactive editors per framework
