# Render & Themes API

SVG generation from layout graphs and Boukamp DSL strings.

## renderDslPreviewSvg

**Recommended** for docs, thumbnails, and read-only diagrams:

```ts
import { renderDslPreviewSvg } from 'velo-circuit'

const svg = renderDslPreviewSvg('R0-p(R1,C1)-Wo2', {
  themeMode: 'dark',           // 'light' | 'dark'
  colorMode: 'multicolor',     // 'multicolor' | 'bicolor'
  connectionStyle: 'curved',   // 'curved' | 'orthogonal' (default: curved)
  showParams: false,
  showLabels: true,
})
// → standalone <svg class="circuit-preview">…</svg> with embedded CSS
```

See [Static SVG Rendering](/guide/static-rendering) for usage patterns in apps and documentation.

## renderDslToSvg

Parse DSL and render without embedding theme CSS:

```ts
import { renderDslToSvg, getTheme } from 'velo-circuit'

const svg = renderDslToSvg('R0-C1', {
  preview: true,
  theme: getTheme('dark'),
  connectionStyle: 'curved',
})
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `preview` | `boolean` | `false` | No selection chrome; transparent background |
| `connectionStyle` | `'curved' \| 'orthogonal'` | `'curved'` | Wire routing between ports |
| `showLabels` | `boolean` | `true` | Element ID labels under symbols |
| `showParams` | `boolean` | `false` | Parameter text instead of IDs |
| `theme` | `RenderTheme` | `DEFAULT_THEME` | Stroke, text, and layout tokens |

## renderCircuit

```ts
import { renderCircuit } from 'velo-circuit'

const svg = renderCircuit(graph, viewport, options)
// → '<svg xmlns="...">...</svg>'
```

Use for graphs already built with `buildLayout`. Set `preview: true` for the same chrome-free output as `renderDslToSvg`.

## renderCircuitEx

Extended renderer with selection handles and overlays:

```ts
import { renderCircuitEx } from 'velo-circuit'

const svg = renderCircuitEx(graph, viewport, {
  themeMode: 'dark',
  showGrid: true,
  showHandles: true,
  selectedNodeIds: new Set(['node-3']),
})
```

## Themes

### Light / dark

```ts
import { DEFAULT_THEME, DARK_THEME, getTheme, toggleTheme } from 'velo-circuit'

const theme = getTheme('dark')
```

### Symbol color modes

| Mode | Behavior |
|------|----------|
| `multicolor` | Per-kind strokes (`--ce-R-stroke`, `--ce-C-stroke`, …) matching the editor |
| `bicolor` | Single `--ce-stroke` from the active theme |

Tokens are defined in `ELEMENT_STROKE_COLORS` for light and dark.

### CSS builders

```ts
import { buildThemeCSS, buildPreviewThemeCSS, buildElementStrokeCSS } from 'velo-circuit'

// Editor / export with selection chrome
buildThemeCSS(theme, { colorMode: 'multicolor', themeMode: 'dark' })

// Static preview (transparent bg, no hover)
buildPreviewThemeCSS(theme, { colorMode: 'multicolor', themeMode: 'dark' })
```

## exportSvgWithStyles / exportPreviewSvgWithStyles

Embed CSS inside the SVG for standalone files:

```ts
import { exportSvgWithStyles, exportPreviewSvgWithStyles } from 'velo-circuit'

// Editor-style export
const editorSvg = exportSvgWithStyles(svg, DARK_THEME, {
  colorMode: 'multicolor',
  themeMode: 'dark',
})

// Preview-style export (used by renderDslPreviewSvg)
const previewSvg = exportPreviewSvgWithStyles(svg, DARK_THEME, {
  colorMode: 'bicolor',
  themeMode: 'light',
})
```

## Junction hubs

Parallel branches use empty junction nodes. Dots are placed at the **wire hub port** (where connections converge), via `getJunctionHub()` in `graph.ts` — not at the geometric center of the junction box.

## Viewport Controller

```ts
import { createViewportController } from 'velo-circuit'

const vc = createViewportController({ panX: 0, panY: 0, zoom: 1, width: 800, height: 600 })

vc.pan(deltaX, deltaY)
vc.zoom(1.1, 400, 300)
vc.zoomToFit(bounds, 800, 600)
vc.reset()
```

## buildSvgElementSymbol

```ts
import { buildSvgElementSymbol, ElementKind } from 'velo-circuit'

const symbol = buildSvgElementSymbol(ElementKind.Resistor, DEFAULT_THEME)
// → '<g>…</g>'  (outline paths, fill="none")
```

All symbols use an **80×40** viewBox with terminals at **(0, 20)** and **(80, 20)**. Base stroke width is **2.0 px** (`theme.strokeWidth`). See the [Symbol Design System](/reference/symbol-design-system).

| Kind | Code | Symbol highlights |
|------|------|-------------------|
| Resistor | `R` | Zigzag body between leads |
| Capacitor | `C` | Parallel plates (1.25× stroke) |
| Inductor | `L` | Four semicircular arcs |
| CPE | `Q` | Angled plate + italic **n** annotation |
| Warburg (infinite) | `W` | Vertical bar + diffusion diagonal (1.15×) |
| Warburg (short) | `Ws` | Same as `W` + closing end bar + **s** label |
| Warburg (open) | `Wo` | Same diagonal + open end bars + **o** label |
| Gerischer | `G` | Warburg diagonal + reaction hook |
| Parallel Diffusion Warburg | `Pdw` | Forked parallel diagonals |
| Cole-Cole | `CC` | Dispersion arc + **α** |
| Havriliak-Negami | `HN` | Dual arcs + **α,β** |

Per-kind stroke color uses CSS variables `--ce-{kind}-stroke` on `.circuit-node[data-kind="…"]`.

Implementation: [`src/core/render-svg/symbols.ts`](../../src/core/render-svg/symbols.ts).

## Types

```ts
type ConnectionStyle = 'curved' | 'orthogonal'
type SymbolColorMode = 'multicolor' | 'bicolor'
type ThemeMode = 'light' | 'dark'

interface DslPreviewOptions {
  theme?: RenderTheme
  themeMode?: ThemeMode
  colorMode?: SymbolColorMode
  connectionStyle?: ConnectionStyle
  showLabels?: boolean
  showParams?: boolean
  width?: number | string
  height?: number | string
}
```
