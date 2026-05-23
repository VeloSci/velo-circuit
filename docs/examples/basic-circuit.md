# Basic Circuit

Build a simple series circuit with a resistor and capacitor.

## DSL

```
R0-C1
```

<CircuitSvgPreview dsl="R0-C1" />

### Wire styles

Previews default to **curved wires** (same as the editor). Use `wires="orthogonal"` for right-angle routing. A parallel branch makes the difference clear:

<CircuitSvgPreview dsl="R0-p(R1,C1)" caption="Curved wires" />

<CircuitSvgPreview dsl="R0-p(R1,C1)" wires="orthogonal" caption="Orthogonal wires" />

For a single stroke color that follows the theme, add `colorMode="bicolor"`.

## Live Example

```ts
import { createEditor } from 'velo-circuit-editor'

const editor = createEditor()

editor.mount(document.getElementById('canvas'), {
  initialDsl: 'R0-C1',
  width: 600,
  height: 300,
})

editor.on('ast-changed', () => {
  const dsl = editor.getValue()
  document.getElementById('dsl-display').textContent = dsl
})
```

## Adding More Elements

Append elements with `-` (series) or use `insertElement()`:

```ts
// Manual DSL editing
editor.setValue('R0-C1-L2')

// Programmatic insertion with auto-ID
editor.insertElement('L', 'series')
// Automatically assigns the next available ID
```

## Layout

The layout engine places elements horizontally in series:

<CircuitSvgPreview dsl="R0-C1-L2" />

## Programmatic Inspection

```ts
const doc = editor.getDocument()
const { ast } = doc

// ast → { type: 'series', children: [
//   { type: 'element', kind: 'R', id: 0 },
//   { type: 'element', kind: 'C', id: 1 },
//   { type: 'element', kind: 'L', id: 2 }
// ]}

const svg = editor.render()
// → '<svg>...</svg>'

// Validation
const result = editor.getValidation()
console.log(result.hasErrors) // false
```

## Next

[Build a Randles circuit](/examples/randles-circuit)
