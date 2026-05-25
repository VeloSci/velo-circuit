import {
  mountCircuitWorkbenchPair,
  type WorkbenchHandle,
  type WorkbenchMountOptions,
} from '../composition.js';
import type { EditorPreset } from '../shared.js';
import type { ThemeMode } from '../../core/render-svg/themes.js';

export interface SvelteWorkbenchOptions {
  dslElement: HTMLElement;
  editorElement: HTMLElement;
  value?: string;
  initialDsl?: string;
  editorPreset?: EditorPreset;
  themeMode?: ThemeMode;
  width?: number;
  height?: number;
  readOnly?: boolean;
  onChange?: (dsl: string) => void;
}

export type SvelteWorkbenchHandle = WorkbenchHandle;

/**
 * Bind DSL + editor nodes (use in onMount / $effect when both refs are set).
 *
 * ```svelte
 * <script>
 *   let dslEl, editorEl, wb
 *   $effect(() => {
 *     wb?.destroy()
 *     if (dslEl && editorEl) wb = bindCircuitWorkbench({ dslElement: dslEl, editorElement: editorEl, onChange: (d) => dsl = d })
 *     return () => wb?.destroy()
 *   })
 * </script>
 * <div bind:this={dslEl} use:dslCodeMirror={{ value: dsl, themeMode: 'dark' }} />
 * <div bind:this={editorEl} />
 * ```
 *
 * Or pass both elements only to `bindCircuitWorkbench` (recommended for sync).
 */
export function bindCircuitWorkbench(options: SvelteWorkbenchOptions): SvelteWorkbenchHandle {
  const mountOpts: WorkbenchMountOptions = {
    dslContainer: options.dslElement,
    editorContainer: options.editorElement,
    initialDsl: options.value ?? options.initialDsl,
    editorPreset: options.editorPreset,
    themeMode: options.themeMode,
    width: options.width,
    height: options.height,
    readOnly: options.readOnly,
    onChange: options.onChange,
  };
  return mountCircuitWorkbenchPair(mountOpts);
}
