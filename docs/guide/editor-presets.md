# Editor Presets

velo-circuit ships three **plugin presets** that control how much UI is mounted with the editor. Choose based on whether your app provides its own toolbar, DSL panel, or catalog chrome.

## Comparison

| Preset | Code | Global toolbar | In-canvas editing | DSL panel | Grid view | Export / diagnostics |
|--------|------|----------------|-------------------|-----------|-----------|----------------------|
| **extended** | `allPlugins()` / `preset: 'extended'` | Yes | Yes | Yes | Yes | Yes |
| **lite** | `litePlugins()` / `preset: 'lite'` | No | Yes | No | No | No |
| **minimal** | `minimalPlugins()` / `preset: 'minimal'` | No | No | No | No | No |

### Extended (default)

Full editor: `.ce-toolbar` (element buttons, grid toggle, theme), floating selection toolbar, context menu, DSL CodeMirror sidebar, validation and export panels.

Use for: playgrounds, standalone tools, apps without custom chrome.

```ts
import { createEditor, allPlugins } from 'velo-circuit'

createEditor({ plugins: allPlugins() }).mount(host, { initialDsl: 'R0-p(R1,C1)' })
```

### Lite

Canvas editing **without** the global top bar or side panels. Users still insert elements via the **floating toolbar** on selection, the **element picker**, and the **context menu**.

Use for: dashboards that already have a toolbar; embedded widgets; Spectroz-style layouts where DSL lives elsewhere.

```ts
import { createEditor, litePlugins } from 'velo-circuit'

createEditor({ plugins: litePlugins() }).mount(host, { width: 600, height: 400 })
```

```tsx
import { useCircuitEditor } from 'velo-circuit/react'

const { containerRef } = useCircuitEditor({ preset: 'lite', initialDsl: 'R0' })
```

### Minimal

Pan, zoom, selection, and keyboard only — no element insertion UI.

Use for: viewers, custom command UIs, or when you drive edits only via `setValue` / `dispatch`.

```ts
import { createEditor, minimalPlugins } from 'velo-circuit'

createEditor({ plugins: minimalPlugins() }).mount(host)
```

## React / Vue composition

| Goal | React hook |
|------|------------|
| DSL en cualquier `<div>` | `useDslCodeMirror({ value, onChange, themeMode })` |
| Canvas lite solo | `useCircuitEditor({ preset: 'lite', value, onChange })` |
| Todo junto (un solo `value`) | `useCircuitWorkbench({ value, onChange, editorPreset: 'lite' })` |
| Extended integrado | `useCircuitEditor({ preset: 'extended' })` |

Vanilla: `mountDslCodeMirror`, `mountCircuitEditor`, `mountCircuitWorkbench`. Details: [React adapter](/adapters/react).

## Building blocks outside presets

Presets only affect `createEditor()`. These work **independently**:

| Block | API |
|-------|-----|
| Static SVG | `renderDslPreviewSvg()` |
| DSL text field | `createDslCodeMirror()` — [DSL Editor API](/api/dsl-editor) |
| Catalog grid | `createCircuitGrid()` — [Grid API](/api/grid) |

Compose them in one page: lite editor + standalone DSL sidebar + grid catalog below.

## Theme and DSL

The DSL CodeMirror field always follows the **active light/dark theme**, not a fixed palette. In extended mode the plugin listens to `theme-changed`; in standalone mode pass `themeMode` aligned with your app. See [DSL Editor API — Theme rule](/api/dsl-editor#theme-rule-important).

## Custom presets

```ts
import { createEditor, themePlugin, panZoomPlugin, dslCodemirrorPanelPlugin } from 'velo-circuit'

createEditor({
  plugins: [
    themePlugin(),
    panZoomPlugin(),
    dslCodemirrorPanelPlugin({ container: '#sidebar' }),
  ],
})
```

Full plugin list: [Plugins API](/api/plugins).

## Related

- [Adapters](/adapters/) — `preset` on React, Vue, Svelte, Vanilla, Angular, Astro
- [Architecture](/guide/architecture) — plugin layer in the stack
