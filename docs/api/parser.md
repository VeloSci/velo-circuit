# Parser API

Parse and validate the Boukamp DSL (11 element codes, optional `{…}` / `[…]` parameters).

## Supported element codes

Longest-match order: `Pdw`, `Ws`, `Wo`, `CC`, `HN`, then `R`, `C`, `L`, `Q`, `W`, `G`.

| Code | Kind |
|------|------|
| `R` | Resistor |
| `C` | Capacitor |
| `L` | Inductor |
| `Q` | CPE |
| `W` | Warburg (infinite) |
| `Ws` | Warburg (short) |
| `Wo` | Warburg (open) |
| `G` | Gerischer |
| `Pdw` | Parallel Diffusion Warburg |
| `CC` | Cole-Cole |
| `HN` | Havriliak-Negami |

Unknown codes produce a **lex** error. After parsing, `validate()` checks duplicate IDs, embedded parameter counts, value ranges (CC/HN exponents, CPE `n`, etc.), DC resistive path, and conflicting reactive branches.

## parseBoukamp

```ts
import { parseBoukamp } from 'velo-circuit-editor'

const result = parseBoukamp('R0-p(R1,C1)')

if ('type' in result && result.type === 'lex') {
  console.error(result.position, result.message)
} else if ('type' in result && result.type === 'parse') {
  console.error(result.expected, result.found)
} else {
  const ast = result
}
```

Embedded parameters:

```ts
parseBoukamp('Q1{5e-5,0.8}')
parseBoukamp('CC1[50,1e-3,0.8]')  // bracket alias
```

## tokenize

```ts
import { tokenize } from 'velo-circuit-editor'

const tokens = tokenize('R0-p(R1,C1)')
```

## serialize

```ts
import { serialize } from 'velo-circuit-editor'

const dsl = serialize(ast)
// → 'R0-p(R1,C1)-Wo2'
```

## validate

```ts
import { validate } from 'velo-circuit-editor'

const result = validate(ast)
// → { issues: [...], hasErrors: false, hasWarnings: false }
```

Use `validateParameterValues(ast, params)` when a flat parameter vector is supplied separately from the DSL.

## Error Types

```ts
interface LexError {
  type: 'lex'
  position: number
  found: string
  message: string
}

interface ParseError {
  type: 'parse'
  position: number
  expected: string
  found: string
  message: string
}
```

## Round-Trip

```ts
const dsl = 'R0-p(R1,C1)-Wo2'
const ast = parseBoukamp(dsl)
const output = serialize(ast)
assert(output === dsl) // true for valid input without embedded params reordering
```
