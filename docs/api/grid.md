# Grid API

`createCircuitGrid()` renders a virtualized SVG table of circuits (DSL, preview SVG, parameters). It works **standalone** or inside the editor via `gridViewPlugin()` and `viewMode: 'grid'`.

## createCircuitGrid

```ts
import { createCircuitGrid, importSpectrozCatalog } from 'velo-circuit'

const grid = createCircuitGrid({
  height: 400,
  rowHeight: 120,
  columns: [
    { id: 'dsl', label: 'DSL', type: 'dsl', width: 280 },
    { id: 'svg', label: 'SVG', type: 'svg', width: 200 },
    { id: 'params', label: 'Params', type: 'params', width: 180 },
  ],
  themeMode: 'dark',
  strict: false,
  initialRows: importSpectrozCatalog([
    { dsl: 'R0-p(R1,C1)' },
    { dsl: 'R0-CPE1-Wo2' },
  ]),
})

grid.mount(document.getElementById('grid-host')!)
grid.on('row-double-click', (payload) => {
  const row = payload as { dsl: string }
  console.log('Open:', row.dsl)
})
```

If `columns` is empty, defaults are DSL (280), SVG (200), and Params (180).

## Column types

| `type` | Renders |
|--------|---------|
| `dsl` | Editable DSL string (inline edit) |
| `svg` | Mini schematic preview |
| `params` | Parameter summary from embedded `{values}` |
| `text` | Plain text via `render` |
| `custom` | Custom HTML/SVG via `render` |

```ts
{
  id: 'status',
  label: 'Status',
  type: 'custom',
  width: 80,
  render: (row, ctx) => (ctx.hasError ? '✗' : '✓'),
}
```

## CircuitGridInstance

| Method | Description |
|--------|-------------|
| `mount(container)` | Attach grid to DOM |
| `destroy()` | Remove grid and listeners |
| `getRows()` / `setRows(rows)` | Row data (`CircuitGridRow[]`) |
| `addRow(row?)` | Append row |
| `updateRow(id, dsl)` | Update DSL for row id |
| `setThemeMode('light' \| 'dark')` | Sync grid chrome with app theme |
| `on(event, handler)` | Subscribe; returns unsubscribe |

## Events

| Event | Payload |
|-------|---------|
| `mount` | — |
| `destroy` | — |
| `row-changed` | `{ id, dsl }` |
| `row-selected` | `CircuitGridRow` |
| `row-double-click` | `CircuitGridRow` |
| `viewport-changed` | scroll info |

## Theme

```ts
import { GRID_THEME_CSS, ensureGridThemeStyles, applyGridThemeClass } from 'velo-circuit'

ensureGridThemeStyles() // inject grid CSS once
applyGridThemeClass(container, 'dark')
```

`CircuitGridOptions.theme` accepts a full `RenderTheme` object; `themeMode` selects light/dark chrome (same convention as the editor and DSL field).

## importSpectrozCatalog

Build rows from catalog entries (optional `params`, `meta`):

```ts
const rows = importSpectrozCatalog([
  { dsl: 'R0{10}-p(R1{100},C1{1e-5})', meta: { label: 'Randles' } },
])
```

## Editor integration

```ts
import { createEditor, allPlugins } from 'velo-circuit'

const editor = createEditor({ plugins: allPlugins() })
editor.mount(host, {
  viewMode: 'grid',
  initialGridRows: rows,
})
editor.setViewMode('circuit') // back to canvas
```

## Related

- [Grid Playground](/playground/grid)
- [Plugins API](/api/plugins) — `gridViewPlugin`
- [Render API](/api/render) — preview SVG options
