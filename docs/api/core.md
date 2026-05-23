# Core API

The core module exports all domain types, the parser bridge, and the state system.

## Types

### ElementKind

```ts
import { ElementKind } from 'velo-circuit'

ElementKind.Resistor                 // 'R'
ElementKind.Capacitor                // 'C'
ElementKind.Inductor                   // 'L'
ElementKind.Cpe                        // 'Q'
ElementKind.WarburgInfinite            // 'W'
ElementKind.WarburgShort               // 'Ws'
ElementKind.WarburgOpen                // 'Wo'
ElementKind.Gerischer                  // 'G'
ElementKind.ParallelDiffusionWarburg   // 'Pdw'
ElementKind.ColeCole                   // 'CC'
ElementKind.HavriliakNegami            // 'HN'
```

### ParamDef and ELEMENT_KINDS

Each kind in `ELEMENT_KINDS` exposes `code`, `label`, `nParams`, and `params: ParamDef[]` with:

- `short` — compact on-canvas label (≤2 chars, Greek when needed)
- `title` — full tooltip / property title (e.g. `σ — Warburg coefficient (Ω·s⁻½)`)

```ts
import { ELEMENT_KINDS, ElementKind } from 'velo-circuit'

const def = ELEMENT_KINDS.get(ElementKind.ColeCole)!
// def.code → 'CC'
// def.params → [{ short: 'R', title: 'R — resistance (Ω)' }, …]
```

### CircuitNode

```ts
import type { CircuitNode } from 'velo-circuit'

type CircuitNode =
  | { type: 'element'; kind: ElementKind; id: number; paramOffset: number; params?: number[] }
  | { type: 'series'; children: CircuitNode[] }
  | { type: 'parallel'; children: CircuitNode[] }
```

### EditableGraph

```ts
import type { EditableGraph } from 'velo-circuit'

interface EditableGraph {
  nodes: Map<string, ElementNode>
  connections: Connection[]
  rootNodeId: string | null
}
```

## Serialization

```ts
import { serialize, deserialize } from 'velo-circuit'

const dsl = serialize(ast)
// → 'R0-p(R1,C1)-Wo2'

const ast = deserialize(dsl)
```

## Validation

```ts
import { validate } from 'velo-circuit'

const result = validate(ast)
// → { issues: [], hasErrors: false, hasWarnings: false }
```

## Persistence

```ts
import { serializeCircuit, deserializeCircuit } from 'velo-circuit'

const doc = serializeCircuit(ast, { name: 'My Circuit' })
// → { version: 1, dsl: 'R0-C1', ast: {...}, metadata: {...} }

JSON.stringify(doc, null, 2)
```

## ELEMENT_KINDS Map

```ts
import { ELEMENT_KINDS } from 'velo-circuit'

for (const [kind, def] of ELEMENT_KINDS) {
  console.log(def.code, def.label, def.nParams, def.params.map(p => p.short))
}
// R Resistor 1 [ 'R' ]
// Q CPE 2 [ 'Q₀', 'n' ]
// W Warburg (infinite) 1 [ 'σ' ]
// CC Cole-Cole 3 [ 'R', 'τ', 'α' ]
// …
```

## Static SVG preview

```ts
import { renderDslPreviewSvg } from 'velo-circuit'

renderDslPreviewSvg('R0-p(R1,C1)-Wo2', {
  themeMode: 'dark',
  colorMode: 'multicolor',
  connectionStyle: 'curved',
})
```

## Junction hubs

```ts
import { getJunctionHub } from 'velo-circuit'

const hub = getJunctionHub(junctionNode, graph)
// Wire convergence point for parallel branch dots
```

See [Static SVG Rendering](/guide/static-rendering) and [Render API](/api/render).
