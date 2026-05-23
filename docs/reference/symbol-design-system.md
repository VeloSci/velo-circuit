# Symbol Design System

Canonical rules for the 11 Boukamp element symbols rendered by `buildSvgElementSymbol()`.

## Canvas

| Property | Value |
|----------|--------|
| ViewBox | 80 × 40 |
| Terminals | **(0, 20)** and **(80, 20)** |
| Lead inset | **12 px** from each edge for body symbols (R zigzag ends at **68**, L coils **12→68**); **plate symbols** (C, Q) connect leads to plate edges at x = **36** / **44** |
| Stroke joins | `stroke-linecap="round"` + `stroke-linejoin="round"` on all outline geometry; **R** and **L** use a **single** polyline/path from terminal to terminal |
| Base stroke | **2.0 px** (`theme.strokeWidth`) |

## Stroke multipliers

| Use | Multiplier |
|-----|------------|
| Leads, bars, coils | 1.0× |
| Capacitor / CPE plates | 1.25× |
| Warburg / PDW diffusion diagonals | 1.15× |
| Annotation text | 0.65× `fontSize` |

## Fill policy

- All element symbols: **outline only** (`fill="none"` on paths/lines).
- Junction dots: filled circle `r=3` (layout only, not element symbols).

## Connections (edges)

- Stroke width matches `theme.strokeWidth` (2.0).
- Color: global `--ce-stroke` on wires; per-kind `--ce-{kind}-stroke` on symbols when `colorMode: 'multicolor'`.
- Default routing: **curved** Bézier paths (matches the editor). Optional **orthogonal** right-angle paths via `connectionStyle: 'orthogonal'`.
- `vector-effect: non-scaling-stroke` on connection paths.

## Junction dots

- Filled circle `r=3` at parallel split/merge points.
- Positioned at the **wire hub port** (`getJunctionHub()`), not the geometric center of the junction box — so dots align with curved and orthogonal wire convergence.

## Per-kind relationships

| Family | Members | Distinction |
|--------|---------|-------------|
| Passives | R, C, L | Standard schematic glyphs |
| CPE | Q | Angled plate + exponent **n** |
| Warburg | W, Ws, Wo | Shared spine: bar at x=20 → diagonal to x=54. **W** = open front (drop to rail). **Ws** = closing vertical `54,10→54,32`. **Wo** = open-end horizontals at y=10 and y=32 |
| Diffusion–reaction | G | Same diagonal + reaction hook (horizontal stub) |
| Dual diffusion | Pdw | Symmetric Y-fork from hub (20,20) |
| Dispersion | CC, HN | **CC** = one semicircular arc (A 20×14). **HN** = outer + inner arc |

## Per-kind colors (CSS)

Set on `.circuit-node[data-kind="…"]` via `--ce-{kind}-stroke`. Symbols reference `var(--ce-{kind}-stroke, fallback)`.

## Source files

- Geometry: [`src/core/render-svg/symbols.ts`](../../src/core/render-svg/symbols.ts)
- Theme tokens: [`src/core/render-svg/themes.ts`](../../src/core/render-svg/themes.ts)
- Metadata: [`src/core/domain/circuit.ts`](../../src/core/domain/circuit.ts)
