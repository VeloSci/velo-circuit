import {
  createDslCodeMirror,
  createEditor,
  type DslCodeMirrorHandle,
  type EditorInstance,
} from '../core/index.js';
import { CircuitSyncLock, parseAstForDsl } from './circuit-sync.js';
import { resolvePlugins, type EditorPreset } from './shared.js';
import type { ThemeMode } from '../core/render-svg/themes.js';
import type { Diagnostic } from '../core/domain/diagnostics.js';

export interface DslFieldMountOptions {
  container: HTMLElement;
  initialDsl?: string;
  themeMode?: ThemeMode;
  readOnly?: boolean;
  placeholder?: string;
  onChange?: (dsl: string) => void;
  onDiagnostics?: (issues: Diagnostic[]) => void;
}

export interface DslFieldHandle {
  getValue(): string;
  setValue(dsl: string): void;
  destroy(): void;
  readonly cm: DslCodeMirrorHandle;
}

export function mountDslField(options: DslFieldMountOptions): DslFieldHandle {
  let handle: DslCodeMirrorHandle | null = null;
  handle = createDslCodeMirror({
    parent: options.container,
    initialValue: options.initialDsl ?? '',
    getAst: () => parseAstForDsl(handle?.getValue() ?? ''),
    themeMode: options.themeMode ?? 'light',
    readOnly: options.readOnly,
    placeholder: options.placeholder,
    onChange: (dsl) => options.onChange?.(dsl),
    onDiagnostics: options.onDiagnostics,
  });

  return {
    getValue: () => handle!.getValue(),
    setValue(dsl: string) { handle!.setValue(dsl); },
    destroy() { handle!.destroy(); },
    get cm() { return handle!; },
  };
}

export interface WorkbenchMountOptions {
  dslContainer: HTMLElement;
  editorContainer: HTMLElement;
  initialDsl?: string;
  editorPreset?: EditorPreset;
  themeMode?: ThemeMode;
  width?: number;
  height?: number;
  readOnly?: boolean;
  onChange?: (dsl: string) => void;
}

export interface WorkbenchHandle {
  getValue(): string;
  setValue(dsl: string): void;
  destroy(): void;
  editor: EditorInstance;
  dsl: DslFieldHandle;
}

export function mountCircuitWorkbenchPair(options: WorkbenchMountOptions): WorkbenchHandle {
  const lock = new CircuitSyncLock();
  const preset = options.editorPreset ?? 'lite';

  const editor = createEditor({ plugins: resolvePlugins(preset) });
  editor.mount(options.editorContainer, {
    initialDsl: options.initialDsl,
    width: options.width,
    height: options.height,
    themeMode: options.themeMode,
  });

  const dsl = mountDslField({
    container: options.dslContainer,
    initialDsl: options.initialDsl,
    themeMode: options.themeMode,
    readOnly: options.readOnly,
    onChange: (next) => {
      if (lock.active) return;
      lock.run(() => {
        editor.setValue(next);
        options.onChange?.(next);
      });
    },
  });

  editor.on('ast-changed', () => {
    if (lock.active) return;
    const next = editor.getValue();
    lock.run(() => {
      dsl.setValue(next);
      options.onChange?.(next);
    });
  });

  return {
    getValue: () => editor.getValue(),
    setValue(next: string) {
      lock.run(() => {
        editor.setValue(next);
        dsl.setValue(next);
        options.onChange?.(next);
      });
    },
    destroy() {
      dsl.destroy();
      editor.destroy();
    },
    editor,
    dsl,
  };
}

export interface EditorMountOptions {
  container: HTMLElement;
  preset?: EditorPreset;
  initialDsl?: string;
  width?: number;
  height?: number;
  themeMode?: ThemeMode;
  onChange?: (dsl: string) => void;
}

export function mountCircuitEditorSurface(options: EditorMountOptions): EditorInstance {
  const editor = createEditor({ plugins: resolvePlugins(options.preset ?? 'extended') });
  editor.mount(options.container, {
    initialDsl: options.initialDsl,
    width: options.width,
    height: options.height,
    themeMode: options.themeMode,
  });
  if (options.onChange) {
    editor.on('ast-changed', () => options.onChange!(editor.getValue()));
  }
  return editor;
}
