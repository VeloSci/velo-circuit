# Getting Started

## Installation

```bash
npm install velo-circuit
```

Or import directly from the source:

```ts
import { createEditor } from './src/core/index.ts'
```

## Minimal Example

```ts
import { createEditor } from 'velo-circuit'

const editor = createEditor()

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

## Next Steps

- [Build your first circuit](/examples/basic-circuit)
- [Understand the architecture](/guide/architecture)
- [Learn the Boukamp DSL](/guide/boukamp-dsl)
