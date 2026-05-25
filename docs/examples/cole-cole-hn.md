# Cole-Cole and Havriliak-Negami

Dispersion elements for broadened relaxation in dielectric and electrochemical spectra.

## Cole-Cole (`CC`)

Three parameters: `R`, `τ`, `α` (dispersion exponent).

```text
CC1{50,1e-3,0.8}
```

Symbol: single dispersion arc with **α** annotation (outline).

<CircuitSvgPreview dsl="CC1{50,1e-3,0.8}" />

## Havriliak-Negami (`HN`)

Four parameters: `R`, `τ`, `α` (asymmetric broadening), `β` (symmetric broadening).

```text
HN1{50,1e-3,0.8,0.9}
```

Symbol: dual arcs with **α,β** label.

<CircuitSvgPreview dsl="HN1{50,1e-3,0.8,0.9}" />

## Series example

```text
R0-CC1{100,1e-4,0.75}-HN2{100,1e-4,0.8,0.85}
```

<CircuitSvgPreview dsl="R0-CC1{100,1e-4,0.75}-HN2{100,1e-4,0.8,0.85}" maxWidth="520px" />

```ts
editor.setValue('CC1{50,1e-3,0.8}')
```

Validation enforces R, τ > 0; 0.3 ≤ α ≤ 1.0; for HN, 0 ≤ β ≤ 1.0.

## API

- [Render API](/api/render) · [Element Types](/reference/element-types)

## Related

- [Element types: CC / HN](/reference/element-types)
- [Unified Circuit DSL](/reference/unified-circuit-dsl)
