# Boukamp Syntax Reference

## Grammar

```text
circuit   ::= element | series | parallel
series    ::= circuit "-" circuit
parallel  ::= "p(" circuit ("," circuit)+ ")"
element   ::= CODE ID param_block?
param_block ::= "{" number ("," number)* "}" | "[" number ("," number)* "]"
CODE      ::= "Pdw" | "Ws" | "Wo" | "CC" | "HN" | "R" | "C" | "L" | "Q" | "W" | "G"
ID        ::= DIGIT+
DIGIT     ::= [0-9]+
```

Longest-match applies to `CODE` (e.g. `Pdw` before `P`, `Ws`/`Wo` before `W`, `CC`/`HN` before `C`/`H`).

Braces `{}` are canonical for embedded parameters; brackets `[]` are an accepted alias.

## Operator Precedence

Parallel `p()` binds tighter than series `-`. Read left-to-right for series.

## Examples

| DSL | Structure |
|-----|-----------|
| `R0` | Single resistor |
| `R0{50}` | Resistor with embedded R |
| `R0-C1` | R in series with C |
| `p(R0,C1)` | R in parallel with C |
| `R0-p(R1,C1)` | Randles simplified |
| `R0-p(R1,C1)-Wo2` | Randles with Warburg (open) |
| `R0-p(Q1,R2-Pdw3)` | PDW literature circuit |
| `R0-p(Ws1,Wo2)-G3` | Finite diffusion plus Gerischer |
| `CC1{50,1e-3,0.8}-HN2{50,1e-3,0.8,0.9}` | Dispersion elements in series |
| `p(R0,p(C1,p(Q2,Wo3)))` | Triple nested |

## Common Patterns

### Randles Simplified

```text
R0-p(R1,C1)
```

### Randles with Warburg

```text
R0-p(R1,C1)-Wo2
```

### Parallel Diffusion Warburg

```text
R0-p(Q1,R2-Pdw3)
```

### Voigt Model

```text
p(R0,C0)-p(R1,C1)-p(R2,C2)
```

### Extended Randles

```text
R0-p(R1,Q2)-p(R3,L3)-Wo4
```

See [Element Types](/reference/element-types) for parameter labels per kind.
