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
| Angular | `velo-circuit` (core) + your component |
| Astro | `velo-circuit/astro` |

## Interactive editor (all frameworks)

```ts
import { createEditor } from 'velo-circuit'

const editor = createEditor()
editor.mount(container, { initialDsl: 'R0-p(R1,C1)-Wo2', width: 800, height: 600 })
editor.on('ast-changed', () => console.log(editor.getValue()))
```

Each adapter page shows the idiomatic mount pattern for that framework.

## Static SVG (no adapter needed)

For read-only diagrams, import from the core package in any framework:

```ts
import { renderDslPreviewSvg } from 'velo-circuit'

const svg = renderDslPreviewSvg('R0-p(R1,C1)', {
  themeMode: 'dark',
  colorMode: 'multicolor',
  connectionStyle: 'curved',
})
```

In React/Vue/Svelte, assign `svg` to `dangerouslySetInnerHTML`, `v-html`, or `{@html svg}`. See [Static SVG Rendering](/guide/static-rendering).

## Comparison

| Need | Use |
|------|-----|
| Full editor with pan/zoom, editing, validation | Adapter + `createEditor()` |
| Thumbnail or docs diagram | `renderDslPreviewSvg()` |
| Data grid with DSL + SVG columns | `createCircuitGrid()` |
| Custom pipeline | `parseBoukamp` → `buildLayout` → `renderCircuit` |

## Adapter guides

- [Vanilla JS](/adapters/vanilla)
- [React](/adapters/react)
- [Vue 3](/adapters/vue)
- [Angular](/adapters/angular)
- [Astro](/adapters/astro)
- [Svelte](/adapters/svelte)
