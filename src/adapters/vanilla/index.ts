import { createEditor, type EditorOptions } from '../../core/index.js';
import { resolvePlugins, type EditorPreset } from '../shared.js';
import type { ThemeMode } from '../../core/render-svg/themes.js';

export type { EditorPreset } from '../shared.js';
export {
  mountDslCodeMirror,
  mountCircuitWorkbench,
  type VanillaDslFieldOptions,
  type VanillaDslFieldInstance,
  type VanillaWorkbenchOptions,
  type VanillaWorkbenchInstance,
} from './workbench.js';

export interface VanillaEditorOptions extends EditorOptions {
  container: HTMLElement;
  /** Editor UI preset: `extended` (default), `lite`, or `minimal` */
  preset?: EditorPreset;
  themeMode?: ThemeMode;
}

export interface VanillaEditorInstance {
  destroy(): void;
  getValue(): string;
  setValue(dsl: string): void;
  on(event: string, handler: (...args: unknown[]) => void): () => void;
  undo(): void;
  redo(): void;
  fitView(): void;
  resetView(): void;
  setShowParams(show: boolean): void;
  setStrict(strict: boolean): void;
}

export function mountCircuitEditor(options: VanillaEditorOptions): VanillaEditorInstance {
  const { container, preset = 'extended', themeMode, ...editorOptions } = options;
  const editor = createEditor({ plugins: resolvePlugins(preset) });

  editor.mount(container, { ...editorOptions, themeMode });

  return {
    destroy(): void {
      editor.destroy();
    },

    getValue(): string {
      return editor.getValue();
    },

    setValue(dsl: string): void {
      editor.setValue(dsl);
    },

    on(event: string, handler: (...args: unknown[]) => void): () => void {
      return editor.on(event as never, (e) => handler(e.type, e.payload));
    },

    undo(): void {
      editor.undo();
    },

    redo(): void {
      editor.redo();
    },

    fitView(): void {
      editor.fitView();
    },

    resetView(): void {
      editor.resetView();
    },

    setShowParams(show: boolean): void {
      editor.setShowParams(show);
    },

    setStrict(strict: boolean): void {
      editor.setStrict(strict);
    },
  };
}

export function unmountCircuitEditor(instance: VanillaEditorInstance): void {
  instance.destroy();
}

export function createCircuitEditorVanilla(containerId: string, initialDsl?: string): VanillaEditorInstance {
  const container = document.getElementById(containerId);
  if (!container) throw new Error(`Container with id "${containerId}" not found`);
  return mountCircuitEditor({ container, initialDsl });
}