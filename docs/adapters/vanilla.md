# Vanilla JS

> **Package:** `velo-circuit` · **Adapter:** `velo-circuit/vanilla` · [Overview](/adapters/) · [Editor Presets](/guide/editor-presets)

## Install

```bash
pnpm add velo-circuit
```

## Extended editor (default)

```ts
import { mountCircuitEditor } from 'velo-circuit/vanilla'

const editor = mountCircuitEditor({
  container: document.getElementById('editor')!,
  preset: 'extended',
  initialDsl: 'R0-p(R1,C1)',
  width: 800,
  height: 600,
})

editor.on('ast-changed', () => console.log(editor.getValue()))
```

## Lite embed (no global toolbar)

```ts
import { mountCircuitEditor } from 'velo-circuit/vanilla'

mountCircuitEditor({
  container: document.getElementById('canvas')!,
  preset: 'lite',
  initialDsl: 'R0-C1',
})
// In-canvas: select node → floating toolbar → insert / params / delete
```

## Static SVG

```ts
import { renderDslPreviewSvg } from 'velo-circuit'

const svg = renderDslPreviewSvg('R0-p(R1,C1)', { themeMode: 'dark' })
document.getElementById('preview')!.innerHTML = svg
```

## DSL only (`mountDslCodeMirror`)

```ts
import { mountDslCodeMirror } from 'velo-circuit/vanilla'

const dsl = mountDslCodeMirror({
  container: document.getElementById('dsl')!,
  initialDsl: 'R0',
  themeMode: 'dark',
  onChange: (value) => console.log(value),
})
```

## Workbench (DSL + lite synced)

```ts
import { mountCircuitWorkbench } from 'velo-circuit/vanilla'

const wb = mountCircuitWorkbench({
  dslContainer: document.getElementById('dsl')!,
  editorContainer: document.getElementById('canvas')!,
  initialDsl: 'R0-p(R1,C1)',
  editorPreset: 'lite',
  themeMode: 'dark',
  onChange: (dsl) => console.log(dsl),
})
```

## Standalone DSL (low-level core import)

```ts
import { createDslCodeMirror } from 'velo-circuit'

const isDark = document.documentElement.classList.contains('dark')

const dsl = createDslCodeMirror({
  parent: document.getElementById('dsl')!,
  initialValue: 'R0',
  getAst: () => null,
  themeMode: isDark ? 'dark' : 'light',
  onChange: (value) => editor.setValue(value),
})
```

See [DSL Editor API — Theme rule](/api/dsl-editor#theme-rule-important).

## Standalone grid

```ts
import { createCircuitGrid, importSpectrozCatalog } from 'velo-circuit'

const grid = createCircuitGrid({
  height: 360,
  rowHeight: 100,
  columns: [],
  themeMode: 'dark',
  initialRows: importSpectrozCatalog([{ dsl: 'R0-p(R1,C1)' }]),
})
grid.mount(document.getElementById('grid')!)
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | `HTMLElement` | required | Mount target |
| `preset` | `'extended' \| 'lite' \| 'minimal'` | `'extended'` | Editor UI bundle |
| `initialDsl` | `string` | — | Starting circuit |
| `width` / `height` | `number` | — | Canvas size |

## API

| Function | Description |
|----------|-------------|
| `mountCircuitEditor(options)` | Mount and return instance |
| `unmountCircuitEditor(instance)` | `destroy()` shorthand |
| `createCircuitEditorVanilla(id, initialDsl?)` | Mount by element id |

## Related

- [Grid API](/api/grid) · [DSL Editor API](/api/dsl-editor) · [Editor API](/api/editor)
