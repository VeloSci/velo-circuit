import type { EditorInstance } from '../../core/index.js';
import type { EditorPreset } from '../shared.js';
import type { ThemeMode } from '../../core/render-svg/themes.js';
import type { Diagnostic } from '../../core/domain/diagnostics.js';
import {
  mountDslField,
  mountCircuitWorkbenchPair,
  mountCircuitEditorSurface,
  type DslFieldHandle,
  type WorkbenchHandle,
} from '../composition.js';

export type { EditorPreset } from '../shared.js';

export interface AngularEditorMountOptions {
  initialDsl?: string;
  width?: number;
  height?: number;
  /** Editor UI preset: `extended` (default), `lite`, or `minimal` */
  preset?: EditorPreset;
  themeMode?: ThemeMode;
}

export interface AngularDslMountOptions {
  initialDsl?: string;
  themeMode?: ThemeMode;
  readOnly?: boolean;
  placeholder?: string;
  onChange?: (dsl: string) => void;
  onDiagnostics?: (issues: Diagnostic[]) => void;
}

export interface AngularDslHandle {
  getValue(): string;
  setValue(dsl: string): void;
  destroy(): void;
}

export interface AngularWorkbenchMountOptions {
  initialDsl?: string;
  editorPreset?: EditorPreset;
  themeMode?: ThemeMode;
  width?: number;
  height?: number;
  readOnly?: boolean;
  onChange?: (dsl: string) => void;
}

export type AngularWorkbenchHandle = WorkbenchHandle;

export interface AngularEditorComponentHandle {
  getValue: () => string;
  setValue: (dsl: string) => void;
  undo: () => void;
  redo: () => void;
  fitView: () => void;
  setShowParams: (show: boolean) => void;
  setStrict: (strict: boolean) => void;
  destroy: () => void;
  dslChange: { subscribe: (fn: (dsl: string) => void) => () => void };
  editorEvent: { subscribe: (fn: (e: { type: string; payload?: unknown }) => void) => () => void };
}

export interface AngularEditorAdapter {
  /** Canvas only — extended, lite, or minimal */
  mount(container: HTMLElement, options?: AngularEditorMountOptions): EditorInstance;
  /** Boukamp DSL CodeMirror only */
  mountDsl(container: HTMLElement, options?: AngularDslMountOptions): AngularDslHandle;
  /** DSL + editor kept in sync (lite by default) */
  mountWorkbench(
    dslContainer: HTMLElement,
    editorContainer: HTMLElement,
    options?: AngularWorkbenchMountOptions,
  ): AngularWorkbenchHandle;
  createComponent(container: HTMLElement, options?: AngularEditorMountOptions): AngularEditorComponentHandle;
}

export function createAngularCircuitEditorAdapter(): AngularEditorAdapter {
  function mount(container: HTMLElement, options?: AngularEditorMountOptions): EditorInstance {
    return mountCircuitEditorSurface({
      container,
      preset: options?.preset ?? 'extended',
      initialDsl: options?.initialDsl,
      width: options?.width,
      height: options?.height,
      themeMode: options?.themeMode,
    });
  }

  function mountDsl(container: HTMLElement, options?: AngularDslMountOptions): AngularDslHandle {
    return mountDslField({
      container,
      initialDsl: options?.initialDsl,
      themeMode: options?.themeMode,
      readOnly: options?.readOnly,
      placeholder: options?.placeholder,
      onChange: options?.onChange,
      onDiagnostics: options?.onDiagnostics,
    });
  }

  function mountWorkbench(
    dslContainer: HTMLElement,
    editorContainer: HTMLElement,
    options?: AngularWorkbenchMountOptions,
  ): AngularWorkbenchHandle {
    return mountCircuitWorkbenchPair({
      dslContainer,
      editorContainer,
      initialDsl: options?.initialDsl,
      editorPreset: options?.editorPreset,
      themeMode: options?.themeMode,
      width: options?.width,
      height: options?.height,
      readOnly: options?.readOnly,
      onChange: options?.onChange,
    });
  }

  function createComponent(
    container: HTMLElement,
    options?: AngularEditorMountOptions,
  ): AngularEditorComponentHandle {
    const editor = mount(container, options);
    const dslHandlers: ((dsl: string) => void)[] = [];
    const eventHandlers: ((e: { type: string; payload?: unknown }) => void)[] = [];

    editor.on('ast-changed', () => {
      const dsl = editor.getValue();
      dslHandlers.forEach(h => h(dsl));
    });

    editor.on('error', (e) => {
      eventHandlers.forEach(h => h({ type: e.type, payload: e.payload }));
    });

    return {
      getValue: () => editor.getValue(),
      setValue: (dsl: string) => editor.setValue(dsl),
      undo: () => editor.undo(),
      redo: () => editor.redo(),
      fitView: () => editor.fitView(),
      setShowParams: (show: boolean) => editor.setShowParams(show),
      setStrict: (strict: boolean) => editor.setStrict(strict),
      destroy: () => editor.destroy(),
      dslChange: {
        subscribe: (fn: (dsl: string) => void) => {
          dslHandlers.push(fn);
          return () => {
            const i = dslHandlers.indexOf(fn);
            if (i >= 0) dslHandlers.splice(i, 1);
          };
        },
      },
      editorEvent: {
        subscribe: (fn: (e: { type: string; payload?: unknown }) => void) => {
          eventHandlers.push(fn);
          return () => {
            const i = eventHandlers.indexOf(fn);
            if (i >= 0) eventHandlers.splice(i, 1);
          };
        },
      },
    };
  }

  return { mount, mountDsl, mountWorkbench, createComponent };
}

export const CircuitEditorNgModule = {
  declarations: [] as unknown[],
  exports: [] as unknown[],
};
