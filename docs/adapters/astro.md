# Astro

> **Package:** `velo-circuit` · **Adapter:** `velo-circuit/astro` · [Overview](/adapters/) · [Editor Presets](/guide/editor-presets)

Use **client islands** (`client:load`). Same three levels as other adapters:

| Level | API |
|-------|-----|
| DSL only | `mountAstroDslCodeMirror` |
| Canvas only | `mountAstroCircuitEditor` |
| DSL + canvas synced | `mountAstroCircuitWorkbench` |

## DSL only (island)

```astro
---
// DslField.astro
---
<div id="dsl-host" class="circuit-dsl-field"></div>

<script>
  import { mountAstroDslCodeMirror } from 'velo-circuit/astro'

  const el = document.getElementById('dsl-host')
  if (el) {
    const field = mountAstroDslCodeMirror(el, {
      id: 'sidebar-dsl',
      initialDsl: 'R0-p(R1,C1)',
      themeMode: 'dark',
      onChange: (dsl) => console.log(dsl),
    })
  }
</script>
```

```astro
<DslField client:load />
```

## Lite canvas

```astro
<div id="canvas-host" style="min-height:400px"></div>
<script>
  import { mountAstroCircuitEditor } from 'velo-circuit/astro'
  const el = document.getElementById('canvas-host')
  if (el) {
    mountAstroCircuitEditor(el, {
      preset: 'lite',
      initialDsl: 'R0',
      themeMode: 'dark',
    })
  }
</script>
```

## Workbench (synced)

```astro
<div class="workbench">
  <div id="dsl-host"></div>
  <div id="editor-host" style="min-height:420px"></div>
</div>
<script>
  import { mountAstroCircuitWorkbench } from 'velo-circuit/astro'

  const dsl = document.getElementById('dsl-host')
  const editor = document.getElementById('editor-host')
  if (dsl && editor) {
    const wb = mountAstroCircuitWorkbench(dsl, editor, {
      id: 'main-wb',
      initialDsl: 'R0-p(R1,C1)',
      editorPreset: 'lite',
      themeMode: 'dark',
      onChange: (d) => console.log(d),
    })
  }
</script>
```

## Extended editor

```astro
<CircuitEditor client:load />
```

```ts
mountAstroCircuitEditor(el, { preset: 'extended', initialDsl: 'R0' })
```

## Storage by id

```ts
import {
  mountAstroDslCodeMirror,
  unmountAstroDslCodeMirror,
  mountAstroCircuitWorkbench,
  unmountAstroCircuitWorkbench,
} from 'velo-circuit/astro'

mountAstroDslCodeMirror(el, { id: 'dsl' })
unmountAstroDslCodeMirror('dsl')

mountAstroCircuitWorkbench(dslEl, editorEl, { id: 'wb' })
unmountAstroCircuitWorkbench('wb')
```

## Static SVG (SSR)

```astro
---
import { renderDslPreviewSvg } from 'velo-circuit'
const svg = renderDslPreviewSvg('R0-p(R1,C1)', { themeMode: 'dark' })
---
<Fragment set:html={svg} />
```

## Related

- [React adapter](/adapters/react) · [Vanilla](/adapters/vanilla)
