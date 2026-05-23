# Element Types Reference

Eleven Boukamp element kinds share homogenized **outline** SVG symbols (80×40 viewBox, 2.0 px base stroke). Geometry and stroke multipliers are defined in the [Symbol Design System](/reference/symbol-design-system).

<SymbolGallery />

## Resistor (`R`)

- **Parameters:** `R` — R — resistance (Ω)
- **DSL:** `R0`, `R0{50}`

## Capacitor (`C`)

- **Parameters:** `C` — C — capacitance (F)
- **DSL:** `C1`, `C1{1e-6}`

## Inductor (`L`)

- **Parameters:** `L` — L — inductance (H)
- **DSL:** `L2`

## CPE (`Q`)

- **Parameters:** `Q₀` — Q₀ — CPE magnitude (S·sⁿ); `n` — n — CPE exponent
- **DSL:** `Q0{5e-5,0.8}`
- **Range:** 0 < n ≤ 1

## Warburg (infinite) (`W`)

Semi-infinite linear diffusion (45° Nyquist line). Shared Warburg diagonal with Ws/Wo; no end cap.

- **Parameters:** `σ` — σ — Warburg coefficient (Ω·s⁻½)
- **DSL:** `W2`, `W2{120}`

## Warburg (short) (`Ws`)

Finite diffusion layer, transmissive boundary. Same diagonal as `W` plus closing vertical bar at the diffusion end.

- **Parameters:** `Y₀` — Y₀ — admittance scale (S·s½); `B` — B — time scale (s½)
- **DSL:** `Ws0{1e-3,10}`

## Warburg (open) (`Wo`)

Finite diffusion layer, reflecting boundary. Shared diagonal with paired open bars at the end.

- **Parameters:** `Y₀`, `B` (same labels as Ws)
- **DSL:** `Wo1{1e-3,10}`

## Gerischer (`G`)

Diffusion–reaction impedance. Warburg-like diagonal plus reaction hook.

- **Parameters:** `Y₀` — Y₀ — admittance scale (S·s½); `K` — K — reaction rate (s⁻¹)
- **DSL:** `G0{1e-3,0.1}`

## Parallel Diffusion Warburg (`Pdw`)

Two parallel solid-state diffusion paths (literature PDW element).

- **Parameters:** `D1` — D1 — diffusion coefficient (cm²/s); `D2` — D2 — diffusion coefficient (cm²/s); `θ` — θ — branch fraction; `Λ` — Λ — molar concentration (mol/cm³)
- **DSL:** `Pdw0{1e-8,1e-9,0.5,1e-3}`

## Cole-Cole (`CC`)

Dispersion relaxation (matches velo-spectroz Cole-Cole impedance).

- **Parameters:** `R` — R — resistance (Ω); `τ` — τ — relaxation time (s); `α` — α — dispersion exponent
- **DSL:** `CC1{50,1e-3,0.8}`
- **Range:** R, τ > 0; 0.3 ≤ α ≤ 1.0

## Havriliak-Negami (`HN`)

Generalized dispersion with dual exponents.

- **Parameters:** `R`, `τ`, `α` — α — asymmetric broadening exponent; `β` — β — symmetric broadening exponent
- **DSL:** `HN1{50,1e-3,0.8,0.9}`
- **Range:** R, τ > 0; 0.3 ≤ α ≤ 1.0; 0 ≤ β ≤ 1.0

## Parameter embedding

Embed numeric values after the element id with braces (canonical) or brackets (alias):

```text
R0{50}-Q1{5e-5,0.8}
CC1{50,1e-3,0.8}
R0[50]              # alias
```

## ELEMENT_KINDS summary

| Code | Label | Params | Short labels |
|------|-------|--------|--------------|
| `R` | Resistor | 1 | R |
| `C` | Capacitor | 1 | C |
| `L` | Inductor | 1 | L |
| `Q` | CPE | 2 | Q₀, n |
| `W` | Warburg (infinite) | 1 | σ |
| `Ws` | Warburg (short) | 2 | Y₀, B |
| `Wo` | Warburg (open) | 2 | Y₀, B |
| `G` | Gerischer | 2 | Y₀, K |
| `Pdw` | Parallel Diffusion Warburg | 4 | D1, D2, θ, Λ |
| `CC` | Cole-Cole | 3 | R, τ, α |
| `HN` | Havriliak-Negami | 4 | R, τ, α, β |

Metadata source: [`src/core/domain/circuit.ts`](../../src/core/domain/circuit.ts).
