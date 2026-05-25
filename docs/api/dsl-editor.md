# DSL Editor API

`createDslCodeMirror()` provides a standalone Boukamp DSL text field with syntax highlighting, debounced lint, and contextual completions (element icons, `p(` branches, `{param}` templates).

Use it **beside** the canvas editor, in sidebars, or in framework apps without mounting the full `createEditor()` UI.

## createDslCodeMirror

```ts
import { createDslCodeMirror } from 'velo-circuit'
import { parseBoukamp } from 'velo-circuit'

let ast: ReturnType<typeof parseBoukamp> | null = null

const handle = createDslCodeMirror({
  parent: document.getElementById('dsl-panel')!,
  initialValue: 'R0{10}-p(R1{100},C1{1e-5})',
  getAst: () => (ast && 'type' in ast && ast.type !== 'lex' ? ast : null),
  themeMode: 'dark',
  onChange: (dsl) => {
    ast = parseBoukamp(dsl)
    syncCanvas(dsl)
  },
  onDiagnostics: (issues) => showIssues(issues),
})

handle.setValue('R0-C1')
handle.destroy()
```

## Options

| Option | Type | Description |
|--------|------|-------------|
| `parent` | `HTMLElement` | Mount target |
| `initialValue` | `string` | Starting DSL |
| `getAst` | `() => CircuitNode \| null` | AST for contextual lint/completions |
| `onChange` | `(value: string) => void` | Called on edit |
| `onDiagnostics` | `(Diagnostic[]) => void` | Debounced validation (~250ms) |
| `readOnly` | `boolean` | Disable editing |
| `placeholder` | `string` | Empty-state hint |
| `theme` | `DslCodeMirrorTheme` | Per-field color overrides (optional) |
| `themeMode` | `'light' \| 'dark'` | Autocomplete tooltips and symbol icons |

## Handle

| Method | Description |
|--------|-------------|
| `getValue()` / `setValue(text)` | Read/write DSL |
| `focus()` / `hasFocus()` | Focus management |
| `setReadOnly(bool)` | Toggle read-only |
| `destroy()` | Tear down CodeMirror |

```ts
import { clearElementSymbolIconCache } from 'velo-circuit'
// Call after theme switch if completion icons look stale
clearElementSymbolIconCache()
```

## Theme rule (important)

**The DSL editor does not ship a fixed palette.** Colors follow the active application theme.

| Context | Behavior |
|---------|----------|
| **Inside extended editor** (`dslCodemirrorPanelPlugin`) | Reads `ce-dark` on editor container; maps `getTheme(mode)` to CodeMirror colors; **remounts** on `theme-changed` |
| **Standalone** | You must pass `themeMode` **synchronized** with your app/editor theme |

### Correct: sync with app theme

```ts
function mountDsl(parent: HTMLElement, isDark: boolean) {
  return createDslCodeMirror({
    parent,
    initialValue: 'R0',
    getAst: () => null,
    themeMode: isDark ? 'dark' : 'light',
    onChange: () => {},
  })
}

// When user toggles theme:
handle.destroy()
handle = mountDsl(parent, newIsDark)
```

Or update `themeMode` by recreating the handle when the parent gains/loses `ce-dark` (same pattern as the built-in plugin).

### Anti-pattern: hard-coded dark DSL while app is light

```ts
// Avoid — completions and editor surface won't match your UI
createDslCodeMirror({ themeMode: 'dark', /* app is light */ ... })
```

Optional `theme` overrides individual fields (`bg`, `text`, `border`, `accent`, …). Prefer CSS variables from the editor (`var(--ce-bg)`, etc.) when embedding next to `themePlugin`.

## Features

| Feature | Behavior |
|---------|----------|
| Lint | Debounced; `validate` with `mode: 'editor'` skips heavy topology while typing |
| Ctrl+Space | Contextual completions at cursor |
| After `-` | Full element list R…HN with schematic icons |
| After `p(` or `,` | Element list for parallel branches |
| Tab after element id | Inserts `{param}` template |

## Related

- [Editor API](/api/editor) — integrated DSL panel (extended preset)
- [Parser API](/api/parser) — `parseBoukamp`, `validate`
- [Boukamp Syntax](/reference/boukamp-syntax)
