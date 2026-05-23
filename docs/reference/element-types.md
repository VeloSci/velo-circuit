# Element Types Reference

## Resistor (`R`)

Resists the flow of charge. Models Ohmic resistance.

```
R0        → [R0]        → 80Ω typical
```

- **Parameters:** 1
- **Unit:** Ohm (Ω)
- **DSL code:** `R`

## Capacitor (`C`)

Stores charge electrostatically. Models double-layer capacitance.

```
C1        → [ C1 ]
            ───    ───
```

- **Parameters:** 1
- **Unit:** Farad (F)
- **DSL code:** `C`

## Inductor (`L`)

Stores energy in a magnetic field. Models inductive behavior.

```
L2        → ( L2 )
            ~~~~
```

- **Parameters:** 1
- **Unit:** Henry (H)
- **DSL code:** `L`

## CPE (`Q`)

Constant Phase Element. Models non-ideal capacitance.

```
Q0        → [ Q0 ]
            ───/\/\──
```

- **Parameters:** 2
- **Units:** Q₀ (S·sⁿ), n (dimensionless)
- **DSL code:** `Q`
- **Range:** 0 < n ≤ 1

## Warburg Infinite (`W`)

Semi-infinite linear diffusion. Phase angle = 45°.

```
W2        → [ W2 ]
            ~~~~/\/\/\/~~
```

- **Parameters:** 1
- **Unit:** σ (Ω·s⁻½)
- **DSL code:** `W`

## Warburg Short (`Ws`)

Finite diffusion layer, transmissive boundary.

```
Ws0       → [Ws0]
           ~~~~/\/~~
```

- **Parameters:** 2
- **Units:** Y₀ (S·s½), B (s½)
- **DSL code:** `Ws`

## Warburg Open (`Wo`)

Finite diffusion layer, reflecting boundary.

```
Wo1       → [Wo1]
           ~~/\/\/~~
```

- **Parameters:** 2
- **Units:** Y₀ (S·s½), B (s½)
- **DSL code:** `Wo`

## Gerischer (`G`)

Diffusion-reaction impedance with a finite reaction rate.

```
G0        → [ G0 ]
            reaction + diffusion
```

- **Parameters:** 2
- **Units:** Y₀ (S·s½), K (s⁻¹)
- **DSL code:** `G`

## Parallel Diffusion Warburg (`Pdw`)

Two parallel solid-state diffusion paths with a weighting factor. This matches the PDW element used by `velo-spectroz` literature reproduction.

```
Pdw0      → [Pdw0]
            diffusion path 1 ∥ diffusion path 2
```

- **Parameters:** 4
- **Units:** D1 (cm²/s), D2 (cm²/s), theta (dimensionless), Lambda (mol/cm³)
- **DSL code:** `Pdw`

## Cole-Cole (`CC`)

Dispersion relaxation element. Matches `velo-spectroz-circuits` Cole-Cole impedance.

```
CC1{50,1e-3,0.8}
```

- **Parameters:** 3 — R (Ω), τ (s), α
- **DSL code:** `CC`
- **Range:** R,τ > 0; 0.3 ≤ α ≤ 1.0

## Havriliak-Negami (`HN`)

Generalized dispersion with dual exponents.

```
HN1{50,1e-3,0.8,0.9}
```

- **Parameters:** 4 — R (Ω), τ (s), α, β
- **DSL code:** `HN`
- **Range:** R,τ > 0; 0.3 ≤ α ≤ 1.0; 0 ≤ β ≤ 1.0

## Parameter embedding

Parameters can be embedded in the linear DSL using braces (canonical) or brackets (alias):

```
R0{50}-Q1{5e-5,0.8}
R0[50]              # alias
```

## ELEMENT_KINDS Table

| Code | Label | Parameters |
|------|-------|------------|
| `R` | Resistor | 1 |
| `C` | Capacitor | 1 |
| `L` | Inductor | 1 |
| `Q` | CPE | 2 |
| `W` | Warburg Infinite | 1 |
| `Ws` | Warburg Short | 2 |
| `Wo` | Warburg Open | 2 |
| `G` | Gerischer | 2 |
| `Pdw` | Parallel Diffusion Warburg | 4 |
| `CC` | Cole-Cole | 3 |
| `HN` | Havriliak-Negami | 4 |