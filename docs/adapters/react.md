# React

> **Package:** `velo-circuit` · **Adapter:** `velo-circuit/react` · [Overview](/adapters/) · [Editor Presets](/guide/editor-presets)

Three integration levels — use **one** or **combine** them with a single `value` / `onChange`:

| Level | Hook | Mount |
|-------|------|--------|
| DSL only | `useDslCodeMirror` | `dslRef` → any `<div>` |
| Canvas only | `useCircuitEditor` | `containerRef` → any `<div>` |
| DSL + canvas synced | `useCircuitWorkbench` | `dslRef` + `editorRef` |

All hooks support controlled `value`, `themeMode`, and `preset` / `editorPreset`.

## 1. DSL only (standalone field)

Place the Boukamp editor anywhere — sidebar, modal, form row:

```tsx
import { useDslCodeMirror } from 'velo-circuit/react'

function DslPanel({ value, onChange, theme }: {
  value: string
  onChange: (dsl: string) => void
  theme: 'light' | 'dark'
}) {
  const { containerRef } = useDslCodeMirror({
    value,
    onChange,
    themeMode: theme,
  })
  return <div ref={containerRef} className="circuit-dsl-field" />
}
```

Self-contained: completions, lint, icons — no canvas required. Sync `themeMode` with your app theme ([DSL theme rule](/api/dsl-editor#theme-rule-important)).

## 2. Lite canvas only (no global toolbar)

```tsx
import { useCircuitEditor } from 'velo-circuit/react'

function Canvas({ value, onChange }: { value: string; onChange: (dsl: string) => void }) {
  const { containerRef } = useCircuitEditor({
    preset: 'lite',
    value,
    onChange,
    themeMode: 'dark',
    height: 400,
  })
  return <div ref={containerRef} className="circuit-canvas" />
}
```

In-canvas editing: select node → floating toolbar → insert / params / delete.

## 3. Extended editor (all-in-one)

Built-in toolbar, DSL panel, grid, export:

```tsx
import { useCircuitEditor } from 'velo-circuit/react'

function FullEditor() {
  const [dsl, setDsl] = useState('R0-p(R1,C1)')
  const { containerRef } = useCircuitEditor({
    preset: 'extended',
    value: dsl,
    onChange: setDsl,
  })
  return <div ref={containerRef} style={{ height: 600 }} />
}
```

## 4. Workbench — DSL + lite canvas as one

Single state; edits in either pane update the other:

```tsx
import { useState } from 'react'
import { useCircuitWorkbench } from 'velo-circuit/react'

function Workbench() {
  const [dsl, setDsl] = useState('R0-p(R1,C1)')
  const { dslRef, editorRef } = useCircuitWorkbench({
    value: dsl,
    onChange: setDsl,
    editorPreset: 'lite',
    themeMode: 'dark',
    height: 420,
  })

  return (
    <div className="workbench" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 12 }}>
      <div ref={dslRef} className="workbench-dsl" />
      <div ref={editorRef} className="workbench-canvas" style={{ minHeight: 420 }} />
    </div>
  )
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `editorPreset` | `'lite'` | `'lite'` pairs with external DSL; `'extended'` adds full chrome (optional external DSL still syncs if `value` is set) |
| `themeMode` | system | Shared by DSL field and canvas |
| `value` / `onChange` | — | Single circuit string for both panes |

### Extended + external DSL (advanced)

If you need the extended toolbar **and** a custom DSL layout elsewhere:

```tsx
useCircuitWorkbench({ value: dsl, onChange: setDsl, editorPreset: 'extended' })
// Mount both dslRef and editorRef; both stay in sync
```

Prefer `preset: 'extended'` + `useCircuitEditor` alone when the built-in DSL panel is enough.

## Static SVG

```tsx
import { renderDslPreviewSvg } from 'velo-circuit'

function CircuitDiagram({ dsl }: { dsl: string }) {
  const svg = renderDslPreviewSvg(dsl, { themeMode: 'dark', colorMode: 'multicolor' })
  return <div dangerouslySetInnerHTML={{ __html: svg }} />
}
```

## Imperative API

```ts
import { createReactCircuitEditor } from 'velo-circuit/react'

const editor = createReactCircuitEditor(container, {
  preset: 'lite',
  initialDsl: 'R0',
  themeMode: 'dark',
  onChange: (dsl) => console.log(dsl),
})
```

## ReactEditorProps / ReactDslFieldProps

| Option | Hooks | Description |
|--------|-------|-------------|
| `preset` | `useCircuitEditor` | `'extended' \| 'lite' \| 'minimal'` |
| `editorPreset` | `useCircuitWorkbench` | Same, for canvas half |
| `themeMode` | all | `'light' \| 'dark'` — canvas + DSL stay aligned |
| `value` / `onChange` | all | Controlled DSL |
| `width` / `height` | editor, workbench | Canvas size |

## Related

- [Vue adapter](/adapters/vue) — `useDslCodeMirror`, `useCircuitWorkbench`
- [Vanilla](/adapters/vanilla) — `mountDslCodeMirror`, `mountCircuitWorkbench`
- [DSL Editor API](/api/dsl-editor) · [Grid API](/api/grid)
