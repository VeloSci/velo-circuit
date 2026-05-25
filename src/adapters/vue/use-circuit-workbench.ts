import { ref, watch, onMounted, onBeforeUnmount, type Ref } from 'vue';
import { createEditor, type EditorEventType } from '../../core/index.js';
import { resolvePlugins } from '../shared.js';
import type { EditorPreset } from '../shared.js';
import type { ThemeMode } from '../../core/render-svg/themes.js';
import { CircuitSyncLock } from '../circuit-sync.js';
import type { VueEditorInstance } from './index.js';
import { useDslCodeMirror } from './use-dsl-codemirror.js';

export interface VueWorkbenchOptions {
  value?: Ref<string>;
  initialDsl?: string;
  editorPreset?: EditorPreset;
  themeMode?: ThemeMode;
  width?: number;
  height?: number;
  readOnly?: boolean;
  onDslChange?: (dsl: string) => void;
  onEvent?: (e: { type: EditorEventType; payload?: unknown }) => void;
}

function createVueEditorInstance(
  container: HTMLElement,
  options: VueWorkbenchOptions,
  onAst: (dsl: string) => void,
): VueEditorInstance {
  const preset = options.editorPreset ?? 'lite';
  const editor = createEditor({ plugins: resolvePlugins(preset) });
  editor.mount(container, {
    initialDsl: options.value?.value ?? options.initialDsl,
    width: options.width,
    height: options.height,
    themeMode: options.themeMode,
  });
  editor.on('ast-changed', () => onAst(editor.getValue()));
  if (options.onEvent) {
    editor.on('error', (e) => options.onEvent!({ type: e.type, payload: e.payload }));
  }
  return {
    setValue: (dsl) => editor.setValue(dsl),
    getValue: () => editor.getValue(),
    undo: () => editor.undo(),
    redo: () => editor.redo(),
    destroy: () => editor.destroy(),
    fitView: () => editor.fitView(),
    setShowParams: (s) => editor.setShowParams(s),
    setStrict: (s) => editor.setStrict(s),
  };
}

export function useCircuitWorkbench(options: VueWorkbenchOptions) {
  const editorPreset = options.editorPreset ?? 'lite';
  const showExternalDsl = editorPreset !== 'extended' || options.value !== undefined;
  const lock = new CircuitSyncLock();
  const editorRef = ref<HTMLElement | null>(null);
  const editorInstance = ref<VueEditorInstance | null>(null);

  const dsl = useDslCodeMirror({
    value: showExternalDsl ? options.value : undefined,
    initialDsl: options.initialDsl,
    themeMode: options.themeMode,
    readOnly: options.readOnly,
    onDslChange: (next) => {
      if (lock.active) return;
      lock.run(() => {
        editorInstance.value?.setValue(next);
        options.onDslChange?.(next);
        if (options.value) options.value.value = next;
      });
    },
  });

  onMounted(() => {
    if (!editorRef.value) return;
    editorInstance.value = createVueEditorInstance(editorRef.value, options, (next) => {
      if (lock.active) return;
      lock.run(() => {
        if (showExternalDsl) dsl.handleRef.value?.setValue(next);
        options.onDslChange?.(next);
        if (options.value) options.value.value = next;
      });
    });
  });

  onBeforeUnmount(() => {
    editorInstance.value?.destroy();
    editorInstance.value = null;
  });

  if (options.value) {
    watch(options.value, (next) => {
      if (!editorInstance.value || next === editorInstance.value.getValue()) return;
      lock.run(() => {
        editorInstance.value!.setValue(next);
        if (showExternalDsl) dsl.handleRef.value?.setValue(next);
      });
    });
  }

  return {
    dslRef: dsl.containerRef,
    editorRef,
    editorInstance,
    dslHandleRef: dsl.handleRef,
  };
}
