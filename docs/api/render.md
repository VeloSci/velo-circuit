# Render & Themes API

## renderCircuit

```ts
import { renderCircuit } from 'velo-circuit-editor'

const svg = renderCircuit(graph, viewport, options)
// → '<svg xmlns="...">...</svg>'
```

## renderCircuitEx

Extended renderer with themes and selection:

```ts
import { renderCircuitEx } from 'velo-circuit-editor'

const svg = renderCircuitEx(graph, viewport, {
  themeMode: 'dark',
  showGrid: true,
  showHandles: true,
  selectedNodeIds: new Set(['node-3']),
})
```

## Themes

### Light Theme

```ts
import { DEFAULT_THEME } from 'velo-circuit-editor'
```

### Dark Theme

```ts
import { DARK_THEME } from 'velo-circuit-editor'
```

### getTheme

```ts
import { getTheme, toggleTheme } from 'velo-circuit-editor'

let mode: ThemeMode = 'light'
mode = toggleTheme(mode) // 'dark'
const theme = getTheme(mode)
```

## exportSvgWithStyles

Embed CSS into the SVG string for standalone export:

```ts
import { exportSvgWithStyles } from 'velo-circuit-editor'

const standalone = exportSvgWithStyles(svg, DARK_THEME)
// Contains <style>...</style> inside the SVG
```

## Viewport Controller

```ts
import { createViewportController } from 'velo-circuit-editor'

const vc = createViewportController({ panX: 0, panY: 0, zoom: 1, width: 800, height: 600 })

vc.pan(deltaX, deltaY)
vc.zoom(1.1, 400, 300)
vc.zoomToFit(bounds, 800, 600)
vc.reset()
```

## buildSvgElementSymbol

```ts
import { buildSvgElementSymbol, ElementKind } from 'velo-circuit-editor'

const symbol = buildSvgElementSymbol(ElementKind.Resistor, DEFAULT_THEME)
// → '<g>…</g>'  (outline paths, fill="none")
```

All symbols use an **80×40** viewBox with terminals at **(0, 20)** and **(80, 20)**. Base stroke width is **2.0 px** (`theme.strokeWidth`). Stroke multipliers and per-kind geometry are documented in the [Symbol Design System](/reference/symbol-design-system).

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
