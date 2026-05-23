# React

> **Package:** `velo-circuit` · **Adapter:** `velo-circuit/react` · [Adapters overview](/adapters/) · [Static SVG](/guide/static-rendering)

## Static SVG in React

```tsx
import { renderDslPreviewSvg } from 'velo-circuit'

function CircuitDiagram({ dsl }: { dsl: string }) {
  const svg = renderDslPreviewSvg(dsl, {
    themeMode: 'dark',
    colorMode: 'multicolor',
    connectionStyle: 'curved',
  })
  return <div dangerouslySetInnerHTML={{ __html: svg }} />
}
```

## useCircuitEditor Hook

```tsx
import { useCircuitEditor } from 'velo-circuit/react'

function CircuitEditor({ initialDsl = 'R0-p(R1,C1)' }: { initialDsl?: string }) {
  const { containerRef } = useCircuitEditor({ initialDsl })
  return <div ref={containerRef} style={{ width: 800, height: 600 }} />
}
```

## Controlled Component

```tsx
import { useState } from 'react'
import { useRef, useEffect } from 'react'
import { createReactCircuitEditor } from 'velo-circuit/react'

function ControlledEditor({ value, onChange }: { value: string; onChange: (dsl: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<ReturnType<typeof createReactCircuitEditor> | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const editor = createReactCircuitEditor(containerRef.current, { initialDsl: value, onChange })
    editorRef.current = editor
    return () => editor.destroy()
  }, [])

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value)
    }
  }, [value])

  return <div ref={containerRef} />
}
```

## Complete Playground Example

This is a complete, copy-pasteable implementation of an interactive playground using the `useCircuitEditor` hook. It mirrors the vanilla playground exactly!

```tsx
import React, { useState } from 'react';
import { useCircuitEditor } from 'velo-circuit/react';

export default function CircuitPlayground() {
  const [dsl, setDsl] = useState('R0-p(R1,C1)');
  
  // Initialize the editor with our React Hook adapter
  const { containerRef, editorRef } = useCircuitEditor({
    value: dsl,
    onChange: (newDsl) => setDsl(newDsl)
  });

  const appendSeries = (elementCode: string) => {
    if (!editorRef.current) return;
    const current = editorRef.current.getValue();
    editorRef.current.setValue(current ? \`\${current}-\${elementCode}\` : elementCode);
  };

  return (
    <div className="playground-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', background: '#1e1e1e', color: 'white', borderRadius: '8px' }}>
      
      {/* Top Toolbar */}
      <div className="toolbar" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => appendSeries('R')} style={btnStyle}>Resistor (R)</button>
        <button onClick={() => appendSeries('C')} style={btnStyle}>Capacitor (C)</button>
        <button onClick={() => appendSeries('L')} style={btnStyle}>Inductor (L)</button>
        <div style={{ flex: 1 }}></div>
        <button onClick={() => editorRef.current?.undo()} style={btnStyle}>Undo</button>
        <button onClick={() => editorRef.current?.redo()} style={btnStyle}>Redo</button>
      </div>

      {/* Editor Canvas Container */}
      <div 
        ref={containerRef} 
        style={{ width: '100%', height: '400px', border: '1px solid #333', borderRadius: '4px', overflow: 'hidden' }}
      />

      {/* State Diagnostics */}
      <div className="diagnostics" style={{ background: '#000', padding: '1rem', borderRadius: '4px', fontFamily: 'monospace' }}>
        <strong>Current DSL:</strong> {dsl || 'Empty Circuit'}
      </div>

    </div>
  );
}

const btnStyle = {
  padding: '6px 12px',
  background: '#3a3a3a',
  color: 'white',
  border: '1px solid #555',
  borderRadius: '4px',
  cursor: 'pointer'
};
```