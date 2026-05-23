# Gerischer Element

The Gerischer (`G`) element models coupled diffusion and surface reaction. Its symbol extends the Warburg diagonal with a reaction hook (outline, 2.0 px base stroke).

## DSL

```text
G0{1e-3,0.1}
```

Embedded values are `Y₀` (admittance scale, S·s½) and `K` (reaction rate, s⁻¹).

<CircuitSvgPreview dsl="G0{1e-3,0.1}" />

## Example circuit

```text
R0-p(R1,C1)-G2{1e-3,0.05}
```

Solution resistance in series with a Randles branch and a Gerischer diffusion–reaction path.

<CircuitSvgPreview dsl="R0-p(R1,C1)-G2{1e-3,0.05}" maxWidth="480px" />

```ts
import { createEditor } from 'velo-circuit'

const editor = createEditor()
editor.mount(document.getElementById('canvas'), {
  initialDsl: 'G0{1e-3,0.1}',
  width: 600,
  height: 300,
})
```

## Related

- [Warburg elements](/examples/warburg-elements) — shared diffusion stroke family
- [Element types: Gerischer](/reference/element-types#gerischer-g)
