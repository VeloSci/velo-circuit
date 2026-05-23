# Part 4 — SVG Render and Theme System ✅

## Goal

Build a pure, efficient, and easy-to-theme SVG rendering layer without canvas or graphics libraries.

## Implemented

- Root `svg` with controlled viewport. ✅
- `g` for logical layers (grid, connections, nodes). ✅
- `path` for cables and branches. ✅
- `rect`, `circle`, `line`, `text` for elements and connection points. ✅
- `defs` for arrow markers. ✅

**Files:**
- `src/core/render-svg/symbols.ts` — SVG symbols for all 11 kinds; `DEFAULT_THEME`
- `src/core/render-svg/renderer.ts` — `renderCircuit()`, `renderCircuitToElement()`, `extractSvgString()`
- `src/core/render-svg/renderer-ex.ts` — `renderCircuitEx()`, `renderDocument()`, `extractSvgSnapshot()`, `exportSvgWithStyles()`
- `src/core/render-svg/themes.ts` — `DARK_THEME`, `light`/`dark` themes, `buildThemeCSS()`, `getTheme()`, `toggleTheme()`
- `src/core/render-svg/viewport.ts` — `createViewportController()`, `parseWheelZoom()`, `parsePointerPan()`, `getZoomLevelLabel()`

## Visual Layers ✅

- Background and optional grid. ✅
- Cables and connections. ✅
- Circuit elements. ✅
- Selection handles (resize handles on selected nodes). ✅
- Interaction overlay. ✅
- Error, warning, and focus decorators. ✅

## Symbol System ✅

All symbols follow the [outline symbol design system](../docs/reference/symbol-design-system.md): 80×40 viewBox, terminals at y=20, **2.0 px** base stroke (`theme.strokeWidth`), outline-only paths, per-kind `--ce-{kind}-stroke` colors.

| Kind | Role |
|------|------|
| `R` | Resistor (zigzag) |
| `C` | Capacitor (plates, 1.25× stroke) |
| `L` | Inductor (coil) |
| `Q` | CPE (angled plate + **n**) |
| `W` | Warburg infinite (open diffusion diagonal) |
| `Ws` | Warburg short (closing bar) |
| `Wo` | Warburg open (reflecting boundary) |
| `G` | Gerischer (diffusion + reaction hook) |
| `Pdw` | Parallel diffusion Warburg (forked diagonals) |
| `CC` | Cole-Cole (arc + **α**) |
| `HN` | Havriliak-Negami (dual arc + **α**, **β**) |

**Stroke rules:** leads/bars/coils 1.0×; capacitor/CPE plates 1.25×; Warburg/PDW diagonals 1.15×; connections use `theme.strokeWidth` with `vector-effect: non-scaling-stroke`. See [symbol-design-system.md](../docs/reference/symbol-design-system.md).

## Theming ✅

- `DEFAULT_THEME` with colors, strokeWidth, fontSize, fontFamily. ✅
- Dark theme (`DARK_THEME`) support. ✅
- Consistent visual scale at different zoom levels. ✅
- Compact mode and presentation mode. (CSS class support)

## Render Strategy ✅

- Initial construction from AST. ✅
- Incremental render via `renderCircuitEx()`. ✅
- CSS class toggling for selection and hover states. ✅
- Scene graph via Map-based nodes. ✅

## Exit Criteria ✅

Renderer can draw simple and nested circuits with a clear, legible, and stable visual hierarchy. Dark theme, selection handles, and interaction overlay are all implemented.

## Next

→ [Part 5 — Interaction, Editing, and UX ✅](./05-interaction-editing-and-ux.md)