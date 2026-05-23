# Layout API

Position circuit nodes deterministically from an AST.

## buildLayout

```ts
import { buildLayout } from 'velo-circuit'

const graph = buildLayout(ast)
// → EditableGraph
```

## computeBounds

```ts
import { computeBounds } from 'velo-circuit'

const bounds = computeBounds(graph)
// → { width, height, minX, minY }
```

## Layout Options

```ts
import { DEFAULT_LAYOUT_OPTIONS } from 'velo-circuit'

buildLayout(ast, {
  horizontalSpacing: 80,  // default: 60
  verticalSpacing: 50,     // default: 40
  elementWidth: 100,      // default: 80
  elementHeight: 50,       // default: 40
  parallelWidth: 150,      // default: 120
})
```

## EditableGraph Structure

```ts
interface EditableGraph {
  nodes: Map<string, ElementNode>
  connections: Connection[]
  rootNodeId: string
}

interface ElementNode {
  nodeId: string
  circuitNode: CircuitNode
  visualX: number
  visualY: number
  width: number
  height: number
  ports: Port[]
}
```

## Resetting Node ID Counter

```ts
import { resetNodeIdCounter } from 'velo-circuit'

resetNodeIdCounter()
```

## Junction hubs

Parallel branches insert empty junction nodes. Dots are rendered at the port where wires converge. The helper lives in `domain/graph.ts` and is exported from the package root:

```ts
import { getJunctionHub } from 'velo-circuit'

const { x, y } = getJunctionHub(junctionNode, graph)
```

## Use with Renderer

```ts
import { buildLayout, computeBounds, renderDslPreviewSvg, renderCircuit, getTheme } from 'velo-circuit'

// Recommended for static output
const svg = renderDslPreviewSvg('R0-p(R1,C1)', { themeMode: 'dark' })

// Lower-level
const graph = buildLayout(ast)
const bounds = computeBounds(graph)
const raw = renderCircuit(graph, {
  panX: -bounds.minX + 20,
  panY: -bounds.minY + 20,
  zoom: 1,
  width: bounds.width,
  height: bounds.height,
}, { preview: true, theme: getTheme('dark') })
```