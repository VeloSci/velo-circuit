import { useEffect, useRef, useCallback, type RefObject } from 'react';
import type { DslCodeMirrorHandle } from '../../core/index.js';
import { CircuitSyncLock } from '../circuit-sync.js';
import type { ReactWorkbenchProps } from './types.js';
import { createReactCircuitEditor, type ReactEditorInstance } from './use-circuit-editor.js';
import { useDslCodeMirror } from './use-dsl-codemirror.js';

export interface CircuitWorkbenchRefs {
  /** Boukamp DSL CodeMirror — omit when `editorPreset: 'extended'` and using built-in panel only */
  dslRef: RefObject<HTMLDivElement | null>;
  /** Lite or extended canvas */
  editorRef: RefObject<HTMLDivElement | null>;
  editorInstanceRef: RefObject<ReactEditorInstance | null>;
  dslHandleRef: RefObject<DslCodeMirrorHandle | null>;
  getValue: () => string;
  setValue: (dsl: string) => void;
}

/**
 * Unified DSL + editor: one `value`/`onChange`, bidirectional sync, shared `themeMode`.
 *
 * - `editorPreset: 'lite'` (default): place `dslRef` and `editorRef` side by side
 * - `editorPreset: 'extended'`: full editor; optional external `dslRef` stays in sync
 */
export function useCircuitWorkbench(options: ReactWorkbenchProps): CircuitWorkbenchRefs {
  const editorPreset = options.editorPreset ?? 'lite';
  const showExternalDsl = editorPreset !== 'extended' || options.value !== undefined;

  const lock = useRef(new CircuitSyncLock());
  const editorInstanceRef = useRef<ReactEditorInstance | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(options.onChange);
  onChangeRef.current = options.onChange;

  const dsl = useDslCodeMirror({
    value: showExternalDsl ? options.value : undefined,
    initialDsl: options.initialDsl,
    themeMode: options.themeMode,
    readOnly: options.readOnly,
    onChange: (next) => {
      if (lock.current.active) return;
      lock.current.run(() => {
        editorInstanceRef.current?.setValue(next);
        onChangeRef.current?.(next);
      });
    },
  });

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    const editor = createReactCircuitEditor(el, {
      preset: editorPreset,
      initialDsl: options.value ?? options.initialDsl,
      width: options.width,
      height: options.height,
      themeMode: options.themeMode,
      onEvent: options.onEvent,
      onChange: (next) => {
        if (lock.current.active) return;
        lock.current.run(() => {
          if (showExternalDsl) dsl.setValue(next);
          onChangeRef.current?.(next);
        });
      },
    });

    editorInstanceRef.current = editor;

    return () => {
      editor.destroy();
      editorInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorPreset, options.themeMode, options.width, options.height]);

  useEffect(() => {
    if (options.value === undefined || !editorInstanceRef.current) return;
    const current = editorInstanceRef.current.getValue();
    if (options.value === current) return;
    lock.current.run(() => {
      editorInstanceRef.current!.setValue(options.value!);
      if (showExternalDsl) dsl.setValue(options.value!);
    });
  }, [options.value, showExternalDsl, dsl]);

  const getValue = useCallback(
    () => editorInstanceRef.current?.getValue() ?? dsl.getValue(),
    [dsl],
  );

  const setValue = useCallback(
    (next: string) => {
      lock.current.run(() => {
        editorInstanceRef.current?.setValue(next);
        if (showExternalDsl) dsl.setValue(next);
        onChangeRef.current?.(next);
      });
    },
    [dsl, showExternalDsl],
  );

  return {
    dslRef: dsl.containerRef,
    editorRef,
    editorInstanceRef,
    dslHandleRef: dsl.handleRef,
    getValue,
    setValue,
  };
}
