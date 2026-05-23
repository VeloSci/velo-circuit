# Unified Circuit DSL

`velo-circuit` and `velo-spectroz` share the same Boukamp-compatible element vocabulary (11 kinds). `velo-circuit` owns editing, validation, serialization, and rendering; `velo-spectroz` owns numerical impedance, fitting, and validation against experimental data.

## Grammar

```text
circuit   ::= element | series | parallel
series    ::= circuit "-" circuit
parallel  ::= "p(" circuit ("," circuit)+ ")"
element   ::= CODE ID param_block?
param_block ::= "{" number ("," number)* "}" | "[" number ("," number)* "]"
CODE      ::= "Pdw" | "Ws" | "Wo" | "CC" | "HN" | "R" | "C" | "L" | "Q" | "W" | "G"
```

## Elements

| Code | Label | Short params |
|------|-------|--------------|
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

Parameter titles and units match [`ELEMENT_KINDS`](../../src/core/domain/circuit.ts) in both projects.

## Parameter embedding

```text
R0{50}-Q1{5e-5,0.8}
G0{1e-3,0.1}
Pdw0{1e-8,1e-9,0.5,1e-3}
CC1{50,1e-3,0.8}
HN1{50,1e-3,0.8,0.9}
R0[50]    # bracket alias
```

Serialization prefers `{}`; the parser accepts `[]` as well.

## Compatibility examples

These expressions should parse and serialize identically in both projects:

```text
R0
G0
Pdw0
CC1{50,1e-3,0.8}
R0-p(Q1,R2-Pdw3)
R0-p(Ws1,Wo2)-G3
```
