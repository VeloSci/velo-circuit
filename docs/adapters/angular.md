# Angular

> **Package:** `velo-circuit` · **Adapter:** `velo-circuit/angular` · [Overview](/adapters/) · [Editor Presets](/guide/editor-presets)

Use `createAngularCircuitEditorAdapter()` — three mount methods:

| Level | Method |
|-------|--------|
| DSL only | `adapter.mountDsl(container, options)` |
| Canvas only | `adapter.mount(container, options)` |
| DSL + canvas synced | `adapter.mountWorkbench(dslEl, editorEl, options)` |

## Setup

```ts
import { createAngularCircuitEditorAdapter } from 'velo-circuit/angular'

const adapter = createAngularCircuitEditorAdapter()
```

## DSL only

```ts
// ngAfterViewInit
@ViewChild('dslHost') dslHost!: ElementRef<HTMLDivElement>

ngAfterViewInit() {
  this.dslField = this.adapter.mountDsl(this.dslHost.nativeElement, {
    initialDsl: 'R0-p(R1,C1)',
    themeMode: 'dark',
    onChange: (dsl) => this.dsl = dsl,
  })
}

ngOnDestroy() {
  this.dslField?.destroy()
}
```

## Lite canvas

```ts
@ViewChild('editorHost') editorHost!: ElementRef<HTMLDivElement>

ngAfterViewInit() {
  this.editor = this.adapter.mount(this.editorHost.nativeElement, {
    preset: 'lite',
    initialDsl: this.dsl,
    themeMode: 'dark',
  })
  this.editor.on('ast-changed', () => {
    this.dsl = this.editor.getValue()
  })
}
```

## Workbench (synced)

```ts
@ViewChild('dslHost') dslHost!: ElementRef<HTMLDivElement>
@ViewChild('editorHost') editorHost!: ElementRef<HTMLDivElement>

ngAfterViewInit() {
  this.workbench = this.adapter.mountWorkbench(
    this.dslHost.nativeElement,
    this.editorHost.nativeElement,
    {
      initialDsl: this.dsl,
      editorPreset: 'lite',
      themeMode: 'dark',
      onChange: (dsl) => (this.dsl = dsl),
    },
  )
}

ngOnDestroy() {
  this.workbench?.destroy()
}
```

## Component helper (`createComponent`)

```ts
this.circuit = this.adapter.createComponent(this.host.nativeElement, {
  preset: 'extended',
  initialDsl: 'R0',
})

this.circuit.dslChange.subscribe((dsl) => (this.dsl = dsl))
```

## Static SVG

```ts
import { renderDslPreviewSvg } from 'velo-circuit'

const svg = renderDslPreviewSvg(dsl, { themeMode: 'dark' })
```

## Options

| `mount` / `mountWorkbench` | Type | Default |
|----------------------------|------|---------|
| `preset` / `editorPreset` | `'extended' \| 'lite' \| 'minimal'` | `'extended'` / `'lite'` |
| `themeMode` | `'light' \| 'dark'` | system |
| `initialDsl` | `string` | — |
| `onChange` | `(dsl) => void` | workbench only |

## Related

- [React adapter](/adapters/react) · [Package Exports](/api/exports)
