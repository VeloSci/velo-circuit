# Boukamp DSL Reference

Circuits use Boukamp notation: series `-`, parallel `p(…)`, and eleven element codes with optional embedded parameters.

## Syntax

```text
circuit   ::= element | series | parallel
series    ::= circuit "-" circuit
parallel  ::= "p(" circuit ("," circuit)+ ")"
element   ::= CODE ID param_block?
param_block ::= "{" number ("," number)* "}" | "[" number ("," number)* "]"
```

Full grammar and examples: [Boukamp Syntax Reference](/reference/boukamp-syntax).

## Element kinds (11)

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

Per-kind detail, symbols, and ranges: [Element Types Reference](/reference/element-types).

## Examples

### Series

```text
R0-C1
R0-C1-L2
R0-p(Q1,R2-Pdw3)
CC1{50,1e-3,0.8}-R2
```

### Parallel

```text
p(R0,C1)
p(R0,p(C1,Q2))
```

### Mixed

```text
R0-p(R1,C1)              # Randles simplified
R0-p(R1,C1)-Wo2          # Randles + Warburg (open)
R0-p(Ws1,Wo2)-G3         # Finite diffusion + Gerischer
```

## Validation Rules

The parser validates:

- **Duplicate IDs** — `R0-p(R0,C1)` → error: `R0` appears twice
- **Unknown codes** — `X0` → lex error at position
- **Unbalanced parentheses** — `p(R0,C1` → parse error
- **Embedded param count** — `Q1{1}` → parameter-count error (expects 2)
- **DC path** — `p(C0,L1)` → warning: no resistive path

## Next

- [Element Types Reference](/reference/element-types)
- [Symbol Design System](/reference/symbol-design-system)
- [Static SVG Rendering](/guide/static-rendering) — live diagrams in [Examples](/examples/basic-circuit)
