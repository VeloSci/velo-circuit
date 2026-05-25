# Parallel Diffusion Warburg (Pdw)

`Pdw` models two parallel solid-state diffusion paths with a branch fraction — the element used in velo-spectroz literature reproduction.

## Parameters

| Short | Title |
|-------|--------|
| D1 | D1 — diffusion coefficient (cm²/s) |
| D2 | D2 — diffusion coefficient (cm²/s) |
| θ | θ — branch fraction |
| Λ | Λ — molar concentration (mol/cm³) |

## DSL

```text
Pdw0{1e-8,1e-9,0.5,1e-3}
```

## Literature-style circuit

```text
R0-p(Q1,R2-Pdw3)
```

<CircuitSvgPreview dsl="R0-p(Q1,R2-Pdw3{1e-8,1e-9,0.5,1e-3})" maxWidth="480px" />

Series solution resistance, then a parallel branch: CPE in parallel with (resistor in series with PDW).

```ts
editor.setValue('R0-p(Q1,R2-Pdw3{1e-8,1e-9,0.5,1e-3})')
```

The SVG symbol uses **forked parallel diagonals** (outline, diffusion strokes at 1.15×).

## API

- [Render API](/api/render) · [Element Types](/reference/element-types)

## Related

- [Element types: Pdw](/reference/element-types#parallel-diffusion-warburg-pdw)
- [Unified Circuit DSL](/reference/unified-circuit-dsl)
