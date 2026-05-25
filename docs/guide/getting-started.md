# Getting Started

## Installation

```bash
npm install velo-circuit
```

Or import directly from the source:

```ts
import { createEditor } from './src/core/index.ts'
```

## Three integration paths

| Path | API | Doc |
|------|-----|-----|
| Full editor | `createEditor()` or adapter `preset: 'extended'` | Below |
| Embed canvas only | `preset: 'lite'` or `litePlugins()` | [Editor Presets](/guide/editor-presets) |
| Read-only diagram | `renderDslPreviewSvg()` | [Static SVG](/guide/static-rendering) |

Standalone building blocks: [Grid API](/api/grid), [DSL Editor API](/api/dsl-editor).

## Extended editor (default)

```ts
import { createEditor, allPlugins } from 'velo-circuit'

const editor = createEditor({ plugins: allPlugins() })

editor.mount(document.getElementById('canvas'), {
  initialDsl: 'R0-p(R1,C1)-Wo2',
  width: 800,
  height: 600,
})

editor.on('ast-changed', () => {
  const dsl = editor.getValue()
  console.log(dsl) // e.g. "R0-p(R1,C1)-Wo2"
})

editor.on('error', (e) => {
  console.error('Parse error:', e.payload)
})

editor.setValue('R0-C1-L2')
editor.undo()
editor.redo()
editor.destroy()
```

## Static diagram (no editor)

For read-only SVG in any app or docs site:

```ts
import { renderDslPreviewSvg } from 'velo-circuit'

const svg = renderDslPreviewSvg('R0-p(R1,C1)-Wo2', {
  themeMode: 'dark',
  colorMode: 'multicolor',
  connectionStyle: 'curved',
})
```

See [Static SVG Rendering](/guide/static-rendering) for wire styles, color modes, and framework integration.

## What is a Circuit DSL?

Circuits are described with Boukamp notation used in electrochemical impedance spectroscopy (EIS).

| Operator / code | Meaning | Example |
|-----------------|---------|---------|
| `-` | Series | `R0-C1` |
| `p(a,b)` | Parallel | `p(R0,C1)` |
| `R`, `C`, `L` | Passives | `R0`, `C1`, `L2` |
| `Q` | CPE | `Q0{5e-5,0.8}` |
| `W`, `Ws`, `Wo` | Warburg variants | `W2`, `Ws1`, `Wo3` |
| `G` | Gerischer | `G0{1e-3,0.1}` |
| `Pdw` | Parallel Diffusion Warburg | `Pdw0` |
| `CC`, `HN` | Dispersion | `CC1{50,1e-3,0.8}` |

### All eleven element kinds

| Code | Label | Params |
|------|-------|--------|
| `R` | Resistor | R |
| `C` | Capacitor | C |
| `L` | Inductor | L |
| `Q` | CPE | Q₀, n |
| `W` | Warburg (infinite) | σ |
| `Ws` | Warburg (short) | Y₀, B |
| `Wo` | Warburg (open) | Y₀, B |
| `G` | Gerischer | Y₀, K |
| `Pdw` | Parallel Diffusion Warburg | D1, D2, θ, Λ |
| `CC` | Cole-Cole | R, τ, α |
| `HN` | Havriliak-Negami | R, τ, α, β |

See [Element Types](/reference/element-types) for units, ranges, and symbols.

## Lite embed (framework)

```tsx
import { useCircuitEditor } from 'velo-circuit/react'

const { containerRef } = useCircuitEditor({ preset: 'lite', initialDsl: 'R0-p(R1,C1)' })
```

## Next Steps

- [Editor presets](/guide/editor-presets) — lite vs extended vs minimal
- [Package exports](/api/exports) — what to import
- [Build your first circuit](/examples/basic-circuit)
- [Static SVG rendering](/guide/static-rendering)
- [Architecture](/guide/architecture)
- [Boukamp DSL](/guide/boukamp-dsl)
- [Framework adapters](/adapters/)
