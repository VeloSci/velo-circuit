# Editor API

The editor is the main entry point for building interactive circuit editors.

## createEditor

```ts
import { createEditor, resolvePlugins } from 'velo-circuit'

// Default: extended preset
const editor = createEditor()

// Explicit preset
const lite = createEditor({ plugins: resolvePlugins('lite') })
```

See [Editor Presets](/guide/editor-presets) and [Plugins API](/api/plugins). Framework adapters use `preset: 'lite' | 'extended' | 'minimal'` instead of passing plugins manually.

## mount

```ts
editor.mount(container, options)
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialDsl` | `string` | — | Initial circuit DSL |
| `width` | `number` | `800` | Canvas width |
| `height` | `number` | `600` | Canvas height |
| `onEvent` | `EventHandler` | — | Global event handler |
| `strict` | `boolean` | — | Stricter validation |
| `blockInvalidSetValue` | `boolean` | — | Reject invalid `setValue` |
| `viewMode` | `'circuit' \| 'grid'` | `'circuit'` | Canvas vs catalog grid (extended) |
| `initialGridRows` | `CircuitGridRow[]` | — | Rows when opening in grid view |

`plugins` are passed to `createEditor()`, not `mount()`.

## getValue / setValue

```ts
const dsl = editor.getValue()
editor.setValue('R0-C1-L2')
```

## getDocument

```ts
const doc = editor.getDocument()
// → CircuitDocument (ast, viewport, selection, grid rows, …)
```

## View mode and grid rows

```ts
editor.getViewMode()   // 'circuit' | 'grid'
editor.setViewMode('grid')
editor.getGridRows()
editor.setGridRows(rows)
```

Requires `gridViewPlugin` (extended preset).

## dispatch

```ts
import type { InsertElementCommand, ElementKind } from 'velo-circuit'

editor.dispatch({
  type: 'insert-element',
  kind: ElementKind.Capacitor,
  elementId: 3,
  paramOffset: 0,
  parentId: null,
  position: -1,
} as InsertElementCommand)
```

## Events

```ts
editor.on('mount', () => console.log('ready'))
editor.on('ast-changed', () => update())
editor.on('selection-changed', () => updateSelection())
editor.on('viewport-changed', () => updateViewport())
editor.on('render', (e) => { /* payload: svg string */ })
editor.on('error', (e) => showError(e.payload))
editor.on('command', (e) => log(e.payload))
editor.on('validation', (e) => showIssues(e.payload))

const unsub = editor.on('ast-changed', handler)
unsub()
```

Plugins may emit `theme-changed` (listen via plugin context in custom plugins).

## undo / redo / destroy / render

```ts
editor.undo()
editor.redo()
editor.destroy()

const svg = editor.render()
```

## fitView / setShowParams / setStrict

```ts
editor.fitView()
editor.resetView()
editor.setShowParams(true)
editor.setStrict(true)
```

## Static preview (without editor chrome)

```ts
import { renderDslPreviewSvg } from 'velo-circuit'

const diagram = renderDslPreviewSvg(editor.getValue(), {
  themeMode: 'dark',
  colorMode: 'multicolor',
  connectionStyle: 'curved',
})
```

See [Static SVG Rendering](/guide/static-rendering).

## DSL text field

Standalone Boukamp CodeMirror — full API and **theme sync rule** in [DSL Editor API](/api/dsl-editor).

```ts
import { createDslCodeMirror } from 'velo-circuit'

const handle = createDslCodeMirror({
  parent: document.getElementById('dsl')!,
  initialValue: 'R0{10}-p(R1{100},C1{1e-5})',
  getAst: () => editor.getDocument().ast,
  themeMode: 'dark', // must match app / editor theme
  onChange: (dsl) => editor.setValue(dsl),
})
```

## Legacy HTML builders (custom UIs)

For apps that assemble their own chrome instead of plugin presets:

```ts
import { buildToolbarHTML, buildToolbarCSS, buildPropertiesPanelHTML, buildDiagnosticsPanelHTML } from 'velo-circuit'
import { attachInteractionEvents } from 'velo-circuit'
```

Prefer [Plugins API](/api/plugins) presets when possible.

## Related

- [Grid API](/api/grid) — standalone catalog table
- [Adapters](/adapters/) — `preset` per framework
- [Package Exports](/api/exports)
