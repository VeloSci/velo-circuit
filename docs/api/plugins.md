# Plugins API

The editor UI is composed of optional **plugins** installed at `createEditor()` time. Use presets for common bundles or assemble plugins manually.

## Presets

| Preset | Function | UI |
|--------|----------|-----|
| **extended** (default) | `allPlugins()` or `resolvePlugins('extended')` | Global toolbar, DSL panel, grid view, export, diagnostics, in-canvas editing |
| **lite** | `litePlugins()` or `resolvePlugins('lite')` | In-canvas editing only (picker, floating toolbar, context menu) — no global toolbar or side panels |
| **minimal** | `minimalPlugins()` or `resolvePlugins('minimal')` | Canvas only: pan/zoom, selection, keyboard |

```ts
import { createEditor, resolvePlugins, allPlugins, litePlugins, minimalPlugins } from 'velo-circuit'

// Extended (default)
const full = createEditor({ plugins: allPlugins() })

// Lite — embed in apps that provide their own chrome
const lite = createEditor({ plugins: litePlugins() })

// Minimal — read-only or custom tooling
const minimal = createEditor({ plugins: minimalPlugins() })

// By name
const editor = createEditor({ plugins: resolvePlugins('lite') })
```

Framework adapters accept the same presets via `preset: 'lite' | 'extended' | 'minimal'`. See [Editor Presets](/guide/editor-presets) and [Adapters](/adapters/).

## Plugin reference

| Plugin | Name | Responsibility |
|--------|------|----------------|
| `themePlugin()` | `theme` | `.ce-editor` shell, light/dark (`ce-dark`), CSS variables, `theme-changed` event |
| `panZoomPlugin()` | `pan-zoom` | Wheel zoom, drag pan, fit view |
| `selectionPlugin()` | `selection` | Node selection state |
| `keyboardPlugin()` | `keyboard` | Undo/redo shortcuts, delete |
| `elementPickerPlugin()` | `element-picker` | Element kind popup (before/after/parallel/replace) |
| `contextMenuPlugin()` | `context-menu` | Right-click actions on canvas |
| `floatingToolbarPlugin()` | `floating-toolbar` | Selection overlay: id, topology ops, inline params |
| `toolbarPlugin()` | `toolbar` | Global `.ce-toolbar` (elements, grid toggle, theme) |
| `gridViewPlugin()` | `grid-view` | Catalog grid inside editor (`viewMode: 'grid'`) |
| `dslCodemirrorPanelPlugin()` | `dsl-codemirror-panel` | Boukamp DSL CodeMirror side panel |
| `diagnosticsPlugin()` | `diagnostics` | Validation issues panel |
| `exportPanelPlugin()` | `export-panel` | SVG (params), SVG topo, full DSL; light/transparent by default — [Export guide](/guide/export-download) |

### Optional (not in presets)

| Plugin | Name | Notes |
|--------|------|-------|
| `paramEditPlugin()` | `param-edit` | Alternate param layer under node; superseded by floating toolbar in extended/lite |
| `dslPanelPlugin()` | `dsl-panel` | Legacy text panel; use `dslCodemirrorPanelPlugin` instead |

## Custom composition

```ts
import {
  createEditor,
  themePlugin,
  panZoomPlugin,
  selectionPlugin,
  floatingToolbarPlugin,
  dslCodemirrorPanelPlugin,
} from 'velo-circuit'

const editor = createEditor({
  plugins: [
    themePlugin(),
    panZoomPlugin(),
    selectionPlugin(),
    floatingToolbarPlugin(),
    dslCodemirrorPanelPlugin({ container: '#my-sidebar' }),
  ],
})
```

## Types

```ts
import type { EditorPlugin, PluginContext, PluginRegistry } from 'velo-circuit'

type EditorPreset = 'minimal' | 'lite' | 'extended'
```

Each `EditorPlugin` has `name`, `install(ctx)`, and `destroy()`.

## Related

- [Editor API](/api/editor) — `createEditor`, events, `viewMode`
- [DSL Editor API](/api/dsl-editor) — standalone `createDslCodeMirror`
- [Grid API](/api/grid) — standalone `createCircuitGrid`
