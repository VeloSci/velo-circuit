# Warburg Elements

Three Warburg kinds model diffusion in EIS. They share one **outline** geometry family: vertical bar at x=22, diffusion diagonal (1.15× stroke), 2.0 px leads — see [Symbol Design System](/reference/symbol-design-system).

<SymbolGallery />

## Warburg (infinite) — `W`

Semi-infinite linear diffusion; 45° Nyquist line. Diagonal only (no end cap).

<CircuitSvgPreview dsl="R0-p(R1,C1)-W2" maxWidth="480px" caption="Randles + Warburg infinite" />

- **Param:** `σ` — Warburg coefficient (Ω·s⁻½)
- **DSL:** `R0-p(R1,C1)-W2` or `W2{120}`

```ts
editor.setValue('R0-p(R1,C1)-W2')
```

## Warburg (short) — `Ws`

Finite layer, transmissive boundary. Same diagonal as `W` plus a **closing vertical bar** at the diffusion end (label **s**).

<CircuitSvgPreview dsl="R0-p(R1,C1)-Ws2{1e-3,10}" maxWidth="480px" caption="Randles + Warburg short (Ws)" />

- **Params:** `Y₀`, `B`
- **DSL:** `R0-p(R1,C1)-Ws2{1e-3,10}`

## Warburg (open) — `Wo`

Finite layer, reflecting boundary. Same diagonal with **open end bars** (label **o**). Common on coated electrodes.

<CircuitSvgPreview dsl="R0-p(R1,C1)-Wo2" maxWidth="480px" caption="Randles + Warburg open (Wo)" />

```ts
editor.setValue('R0-p(R1,C1)-Wo2')
```

## When to use each

| Type | Use case | Nyquist shape |
|------|----------|-----------------|
| `W` | Semi-infinite diffusion | 45° line |
| `Ws` | Finite layer, transmissive | Curved arc |
| `Wo` | Finite layer, reflecting | Vertical spike |

## Full Randles–Warburg

```ts
editor.setValue('R0-p(R1,C1)-Wo2')
editor.setValue('R0-p(R1,Q1)-Wo2')  // CPE instead of C
```

See also [Randles circuit](/examples/randles-circuit) and [CPE and complex elements](/examples/cpe-and-complex) for rendered diagrams.

## Next

- [Gerischer element](/examples/gerischer)
- [Nested circuits](/examples/nested-circuits)
