import { useEffect, useRef, type RefObject } from 'react';
import { createEditor, type EditorEventType, type EventHandler } from '../../core/index.js';
import { resolvePlugins } from '../shared.js';
import type { ReactEditorProps } from './types.js';

export interface ReactEditorInstance {
  getValue(): string;
  setValue(dsl: string): void;
  on(event: EditorEventType, handler: EventHandler): () => void;
  undo(): void;
  redo(): void;
  destroy(): void;
  fitView(): void;
  setShowParams(show: boolean): void;
  setStrict(strict: boolean): void;
}

export function createReactCircuitEditor(
  container: HTMLElement,
  options: ReactEditorProps,
): ReactEditorInstance {
  const editor = createEditor({ plugins: resolvePlugins(options.preset ?? 'extended') });

  editor.mount(container, {
    initialDsl: options.value ?? options.initialDsl,
    width: options.width,
    height: options.height,
    themeMode: options.themeMode,
  });

  editor.on('ast-changed', () => {
    options.onChange?.(editor.getValue());
  });

  if (options.onEvent) {
    const handler: EventHandler = (e) => options.onEvent!({ type: e.type, payload: e.payload });
    editor.on('error', handler);
  }

  return {
    getValue() { return editor.getValue(); },
    setValue(dsl: string) { editor.setValue(dsl); },
    on(event: EditorEventType, handler: EventHandler) { return editor.on(event, handler); },
    undo() { editor.undo(); },
    redo() { editor.redo(); },
    destroy() { editor.destroy(); },
    fitView() { editor.fitView(); },
    setShowParams(show: boolean) { editor.setShowParams(show); },
    setStrict(strict: boolean) { editor.setStrict(strict); },
  };
}

export function useCircuitEditor(options: ReactEditorProps): {
  containerRef: RefObject<HTMLDivElement | null>;
  editorRef: RefObject<ReactEditorInstance | null>;
} {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<ReactEditorInstance | null>(null);
  const onChangeRef = useRef(options.onChange);
  onChangeRef.current = options.onChange;

  useEffect(() => {
    if (!containerRef.current) return;

    const editor = createReactCircuitEditor(containerRef.current, {
      ...options,
      onChange: (dsl) => onChangeRef.current?.(dsl),
    });
    editorRef.current = editor;

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.preset, options.themeMode]);

  useEffect(() => {
    if (editorRef.current && options.value !== undefined && options.value !== editorRef.current.getValue()) {
      editorRef.current.setValue(options.value);
    }
  }, [options.value]);

  return { containerRef, editorRef };
}
