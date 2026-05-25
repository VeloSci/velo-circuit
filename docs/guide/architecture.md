# Architecture

## Overview

The editor is built in four layers:

```
┌───────────────────────────────────────────────┐
│  Adapter Layer (React / Vue / Angular / ...)  │
│  preset: extended | lite | minimal            │
└──────────────────────┬────────────────────────┘
                       │
┌──────────────────────▼─────────────────────┐
│  Plugin UI (toolbar, DSL panel, grid, …)   │
│  allPlugins() | litePlugins() | custom      │
└──────────────────────┬────────────────────────┘
                       │
┌──────────────────────▼─────────────────────┐
│            Editor Controller               │
│  createEditor() — orchestrates everything  │
└───────┬──────────┬──────────────┬──────────┘
        │          │              │
 ┌──────▼──┐   ┌───▼────┐    ┌────▼────────┐
 │  State  │   │ Parser │    │   Layout    │
 │ Store   │   │ Bridge │    │   Engine    │
 │ + undo  │   │ DSL→AST│    │ nodes/ports │
 └──────┬──┘   └───┬────┘    └──────┬──────┘
        │          │                │
┌───────▼──────────▼────────────────▼──────┐
│  SVG Renderer + standalone Grid / DSL CM │
└──────────────────────────────────────────┘
```

Standalone modules (`createCircuitGrid`, `createDslCodeMirror`, `renderDslPreviewSvg`) sit beside the editor and share parser/layout/render.

## Key Modules

### `core/domain`

Types and pure logic with no side effects.

| File | Purpose |
|------|---------|
| `circuit.ts` | `ElementKind`, `CircuitNode`, `ELEMENT_KINDS` |
| `graph.ts` | `EditableGraph`, `ElementNode`, `Port`, `Connection` |
| `document.ts` | `CircuitDocument`, `ViewportState`, `SelectionState` |
| `validation.ts` | `ValidationError`, `ValidationWarning`, `ValidationIssue` |
| `commands.ts` | All command types for the editor |
| `translator.ts` | `astToGraph()`, `graphToAst()` |
| `persistence.ts` | `serializeCircuit()`, `deserializeCircuit()` |

### `core/state`

Command-driven store with undo/redo.

```ts
const store = createStore()
store.dispatch({ type: 'load-circuit', ... })
store.subscribe(event => { ... })
store.undo()
store.redo()
```

### `core/parser-bridge`

The Boukamp DSL layer.

```ts
const result = parseBoukamp('R0-p(R1,C1)-Wo2')
// → { type: 'series', children: [...] }
serialize(ast) // → 'R0-p(R1,C1)-Wo2'
validate(ast)   // → { issues: [], hasErrors: false }
```

### `core/layout`

Deterministic node positioning from AST.

```ts
const graph = buildLayout(ast)
// → { nodes: Map, connections: [], rootNodeId: 'node-1' }
```

### `core/render-svg`

SVG generation from the graph — interactive editor and static preview paths.

```ts
// Interactive editor output
const svg = renderCircuit(graph, viewport, { theme: getTheme('dark') })

// Static preview (docs, thumbnails)
const preview = renderDslPreviewSvg('R0-p(R1,C1)', {
  themeMode: 'dark',
  colorMode: 'multicolor',
  connectionStyle: 'curved',
})
```

Preview mode (`preview: true`) omits selection chrome. Junction dots use `getJunctionHub()` so they align with wire convergence points in both curved and orthogonal modes.

### `core/plugins`

Composable UI via `EditorPlugin` factories. Presets: [Editor Presets](/guide/editor-presets).

### `core/grid`

Virtualized catalog table (`createCircuitGrid`) — used standalone or via `gridViewPlugin` in extended mode.

## Design Principles

1. **No framework coupling** — the core never imports React, Vue, or any other library.
2. **Immutable public operations** — all state changes go through the command system.
3. **SVG-only rendering** — no canvas, no WebGL.
4. **Stable parser contract** — the parser bridge can be swapped without touching the editor.

## Next

- [Editor Presets](/guide/editor-presets)
- [Plugins API](/api/plugins)
- [Core Concepts](/guide/core-concepts)