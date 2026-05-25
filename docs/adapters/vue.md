# Vue 3

> **Package:** `velo-circuit` · **Adapter:** `velo-circuit/vue` · [Overview](/adapters/) · [Editor Presets](/guide/editor-presets)

Same three levels as React: `useDslCodeMirror` (DSL only), `useCircuitEditor` (canvas), `useCircuitWorkbench` (synced pair). See [React adapter](/adapters/react) for the composition pattern.

## Extended editor

```vue
<script setup lang="ts">
import { useCircuitEditor } from 'velo-circuit/vue'

const { containerRef } = useCircuitEditor({
  preset: 'extended',
  initialDsl: 'R0-p(R1,C1)',
  onDslChange: (dsl) => console.log(dsl),
})
</script>

<template>
  <div ref="containerRef" style="width: 800px; height: 600px" />
</template>
```

## Lite embed

```vue
<script setup lang="ts">
import { useCircuitEditor } from 'velo-circuit/vue'

const { containerRef } = useCircuitEditor({ preset: 'lite', initialDsl: 'R0' })
</script>

<template>
  <div ref="containerRef" class="circuit-canvas" />
</template>
```

## Controlled DSL

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useCircuitEditor } from 'velo-circuit/vue'

const dsl = ref('R0-p(R1,C1)')
const { containerRef } = useCircuitEditor({
  preset: 'extended',
  value: dsl,
  onDslChange: (v) => (dsl.value = v),
})
</script>
```

## Static SVG

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { renderDslPreviewSvg } from 'velo-circuit'

const props = defineProps<{ dsl: string }>()
const svg = computed(() =>
  renderDslPreviewSvg(props.dsl, { themeMode: 'dark', colorMode: 'multicolor' }),
)
</script>

<template>
  <div v-html="svg" />
</template>
```

## Standalone DSL (theme-synced)

```vue
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { createDslCodeMirror } from 'velo-circuit'

const parent = ref<HTMLElement | null>(null)
const theme = ref<'light' | 'dark'>('dark')
let handle: ReturnType<typeof createDslCodeMirror> | null = null

function mountDsl() {
  handle?.destroy()
  if (!parent.value) return
  handle = createDslCodeMirror({
    parent: parent.value,
    initialValue: 'R0',
    getAst: () => null,
    themeMode: theme.value,
    onChange: () => {},
  })
}

onMounted(mountDsl)
watch(theme, mountDsl)
onBeforeUnmount(() => handle?.destroy())
</script>

<template>
  <button @click="theme = theme === 'dark' ? 'light' : 'dark'">Theme</button>
  <div ref="parent" />
</template>
```

## Standalone grid

```ts
import { createVueCircuitEditor } from 'velo-circuit/vue'
import { createCircuitGrid } from 'velo-circuit'

// Or mount grid in onMounted with createCircuitGrid — see Grid API
```

## Options (`useCircuitEditor`)

| Option | Type | Default |
|--------|------|---------|
| `preset` | `'extended' \| 'lite' \| 'minimal'` | `'extended'` |
| `initialDsl` | `string` | — |
| `value` | `Ref<string>` | — |
| `width` / `height` | `number` | — |
| `onDslChange` | `(dsl: string) => void` | — |
| `onEvent` | `(e) => void` | — |

## DSL only

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useDslCodeMirror } from 'velo-circuit/vue'

const dsl = ref('R0-p(R1,C1)')
const { containerRef } = useDslCodeMirror({ value: dsl, themeMode: 'dark' })
</script>
<template><div ref="containerRef" /></template>
```

## Workbench (DSL + lite)

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useCircuitWorkbench } from 'velo-circuit/vue'

const dsl = ref('R0')
const { dslRef, editorRef } = useCircuitWorkbench({
  value: dsl,
  editorPreset: 'lite',
  themeMode: 'dark',
})
</script>
<template>
  <div ref="dslRef" />
  <div ref="editorRef" style="height: 400px" />
</template>
```

## API

| Export | Description |
|--------|-------------|
| `useDslCodeMirror` | Standalone Boukamp field |
| `useCircuitWorkbench` | Synced DSL + editor |
| `useCircuitEditor` | Composition API hook |
| `createVueCircuitEditor` | Imperative mount |
| `mountVueCircuitEditor` | Mount by container id |

## Related

- [Grid API](/api/grid) · [DSL Editor API](/api/dsl-editor)
