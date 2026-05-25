# Svelte

> **Package:** `velo-circuit` · **Adapter:** `velo-circuit/svelte` · [Overview](/adapters/) · [Editor Presets](/guide/editor-presets)

Three integration levels (same as [React](/adapters/react)):

| Level | API |
|-------|-----|
| DSL only | `use:dslCodeMirror` action |
| Canvas only | `use:circuitEditor` action |
| DSL + canvas synced | `bindCircuitWorkbench()` |

## DSL only

```svelte
<script lang="ts">
  let dsl = $state('R0-p(R1,C1)')
</script>

<div
  use:dslCodeMirror={{
    value: dsl,
    themeMode: 'dark',
    onChange: (v) => (dsl = v),
  }}
  class="circuit-dsl-field"
/>
```

```svelte
<script lang="ts">
  import { dslCodeMirror } from 'velo-circuit/svelte'
</script>
```

## Lite canvas only

```svelte
<script lang="ts">
  import { circuitEditor } from 'velo-circuit/svelte'
  let dsl = $state('R0')
</script>

<div
  use:circuitEditor={{ preset: 'lite', value: dsl, themeMode: 'dark', onChange: (v) => (dsl = v) }}
  style="height: 400px"
/>
```

## Extended editor

```svelte
<div use:circuitEditor={{ preset: 'extended', value: dsl, onChange: (v) => (dsl = v) }} />
```

## Workbench — DSL + lite as one

```svelte
<script lang="ts">
  import { bindCircuitWorkbench } from 'velo-circuit/svelte'

  let dsl = $state('R0-p(R1,C1)')
  let dslEl: HTMLDivElement
  let editorEl: HTMLDivElement
  let wb: ReturnType<typeof bindCircuitWorkbench> | undefined

  $effect(() => {
    wb?.destroy()
    if (!dslEl || !editorEl) return
    wb = bindCircuitWorkbench({
      dslElement: dslEl,
      editorElement: editorEl,
      value: dsl,
      editorPreset: 'lite',
      themeMode: 'dark',
      onChange: (v) => (dsl = v),
    })
    return () => wb?.destroy()
  })
</script>

<div class="workbench">
  <div bind:this={dslEl} class="workbench-dsl" />
  <div bind:this={editorEl} class="workbench-canvas" style="min-height: 400px" />
</div>
```

## Static SVG

```svelte
<script lang="ts">
  import { renderDslPreviewSvg } from 'velo-circuit'
  let { dsl } = $props()
  const svg = $derived(renderDslPreviewSvg(dsl, { themeMode: 'dark' }))
</script>
{@html svg}
```

## Exports

| Export | Description |
|--------|-------------|
| `dslCodeMirror` | Action — standalone Boukamp field |
| `circuitEditor` | Action — canvas (`preset`, `themeMode`, `onChange`) |
| `bindCircuitWorkbench` | Imperative bind when both nodes are ready |
| `createSvelteCircuitEditor` | Low-level `EditorInstance` |

## Related

- [React adapter](/adapters/react) · [DSL Editor API](/api/dsl-editor)
