# Framework Adapters

Official adapters wrap `createEditor()` for React, Vue, Svelte, Angular, Astro, and Vanilla JS. All adapters share the same core API: mount, `getValue` / `setValue`, events, undo/redo, and `destroy()`.

## Install

```bash
pnpm add velo-circuit
```

| Framework | Import path |
|-----------|-------------|
| Core | `velo-circuit` |
| Vanilla | `velo-circuit/vanilla` |
| React | `velo-circuit/react` |
| Vue 3 | `velo-circuit/vue` |
| Svelte | `velo-circuit/svelte` |
| Angular | `velo-circuit/angular` |
| Astro | `velo-circuit/astro` |

See [Package Exports](/api/exports) for the full map.

## Editor presets

Every adapter accepts `preset`:

| Preset | Description |
|--------|-------------|
| `'extended'` (default) | Full toolbar, DSL panel, grid view, export, diagnostics |
| `'lite'` | In-canvas editing only — no global toolbar or side panels |
| `'minimal'` | Canvas pan/zoom/selection only |

```ts
import { useCircuitEditor } from 'velo-circuit/react'

useCircuitEditor({ preset: 'lite', initialDsl: 'R0-p(R1,C1)' })
```

Details: [Editor Presets](/guide/editor-presets) · [Plugins API](/api/plugins)

## Building blocks

Compose **DSL field**, **canvas**, and **catalog** independently or synced:

| Need | React | Vue | Svelte | Angular | Astro | Vanilla |
|------|-------|-----|--------|---------|-------|---------|
| DSL only | `useDslCodeMirror` | `useDslCodeMirror` | `use:dslCodeMirror` | `mountDsl` | `mountAstroDslCodeMirror` | `mountDslCodeMirror` |
| Canvas lite | `useCircuitEditor` | `useCircuitEditor` | `use:circuitEditor` | `mount` | `mountAstroCircuitEditor` | `mountCircuitEditor` |
| DSL + lite sync | `useCircuitWorkbench` | `useCircuitWorkbench` | `bindCircuitWorkbench` | `mountWorkbench` | `mountAstroCircuitWorkbench` | `mountCircuitWorkbench` |
| Static SVG | `renderDslPreviewSvg` | same | same | same | same | same |
| Grid | `createCircuitGrid` | same | same | same | same | same |

See [React adapter](/adapters/react) for full composition examples.

### DSL theme

The DSL field does **not** use a fixed palette. Pass `themeMode: 'light' | 'dark'` synchronized with your app or editor theme. Inside the extended editor, the DSL panel follows `theme-changed` automatically.

## Core usage (any framework)

```ts
import { createEditor, resolvePlugins } from 'velo-circuit'

const editor = createEditor({ plugins: resolvePlugins('lite') })
editor.mount(container, { initialDsl: 'R0-p(R1,C1)-Wo2', width: 800, height: 600 })
editor.on('ast-changed', () => console.log(editor.getValue()))
```

## Comparison

| Need | Use |
|------|-----|
| Full editor with pan/zoom, editing, validation | Adapter, `preset: 'extended'` |
| Embed in app with own chrome | Adapter, `preset: 'lite'` |
| Read-only canvas | `preset: 'minimal'` or `renderDslPreviewSvg()` |
| Data grid with DSL + SVG columns | `createCircuitGrid()` |
| Custom pipeline | Parser + layout + render from core |

## Adapter guides

- [Vanilla JS](/adapters/vanilla)
- [React](/adapters/react)
- [Vue 3](/adapters/vue)
- [Svelte](/adapters/svelte)
- [Angular](/adapters/angular)
- [Astro](/adapters/astro)
