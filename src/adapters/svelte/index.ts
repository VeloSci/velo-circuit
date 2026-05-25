import type { EditorInstance, EditorOptions } from '../../core/index.js';
import type { EditorPreset } from '../shared.js';
import type { ThemeMode } from '../../core/render-svg/themes.js';
import { mountCircuitEditorSurface } from '../composition.js';

export type { EditorPreset } from '../shared.js';
export { dslCodeMirror, type SvelteDslFieldOptions } from './dsl-codemirror.js';
export {
  bindCircuitWorkbench,
  type SvelteWorkbenchOptions,
  type SvelteWorkbenchHandle,
} from './workbench.js';

export interface SvelteEditorOptions extends EditorOptions {
  value?: string;
  readonly?: boolean;
  width?: number;
  height?: number;
  /** Editor UI preset: `extended` (default), `lite`, or `minimal` */
  preset?: EditorPreset;
  themeMode?: ThemeMode;
  onChange?: (dsl: string) => void;
}

export interface SvelteEditorEvents {
  change: CustomEvent<string>;
  error: CustomEvent<{ type: string; payload: unknown }>;
}

export function createSvelteCircuitEditor(element: HTMLElement, options?: SvelteEditorOptions): EditorInstance {
  const editor = mountCircuitEditorSurface({
    container: element,
    preset: options?.preset,
    initialDsl: options?.value ?? options?.initialDsl,
    width: options?.width,
    height: options?.height,
    themeMode: options?.themeMode,
    onChange: options?.onChange,
  });

  editor.on('ast-changed' as never, () => {
    element.dispatchEvent(new CustomEvent('change', { detail: editor.getValue(), bubbles: true }));
  });

  editor.on('error' as never, (e) => {
    element.dispatchEvent(
      new CustomEvent('error', { detail: { type: e.type, payload: e.payload }, bubbles: true }),
    );
  });

  return editor;
}

export function getSvelteEditorEvents(): string[] {
  return ['change', 'error'];
}

export function circuitEditor(node: HTMLElement, options: SvelteEditorOptions = {}) {
  let editor = createSvelteCircuitEditor(node, options);

  return {
    update(newOptions: SvelteEditorOptions) {
      if (newOptions.value !== undefined && newOptions.value !== editor.getValue()) {
        editor.setValue(newOptions.value);
      }
      if (
        newOptions.preset !== options.preset ||
        newOptions.themeMode !== options.themeMode
      ) {
        editor.destroy();
        options = newOptions;
        editor = createSvelteCircuitEditor(node, options);
      }
    },
    destroy() {
      editor.destroy();
    },
  };
}
