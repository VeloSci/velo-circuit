import type { EditorInstance, EditorOptions } from '../../core/index.js';
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

export interface AstroEditorProps extends EditorOptions {
  id?: string;
  /** Editor UI preset: `extended` (default), `lite`, or `minimal` */
  preset?: EditorPreset;
  themeMode?: ThemeMode;
  onChange?: (dsl: string) => void;
}

export interface AstroDslProps {
  id?: string;
  initialDsl?: string;
  themeMode?: ThemeMode;
  readOnly?: boolean;
  onChange?: (dsl: string) => void;
  onDiagnostics?: (issues: Diagnostic[]) => void;
}

export interface AstroWorkbenchProps {
  dslId?: string;
  editorId?: string;
  id?: string;
  initialDsl?: string;
  editorPreset?: EditorPreset;
  themeMode?: ThemeMode;
  width?: number;
  height?: number;
  onChange?: (dsl: string) => void;
}

const EDITOR_STORAGE = new Map<string, EditorInstance>();
const DSL_STORAGE = new Map<string, DslFieldHandle>();
const WORKBENCH_STORAGE = new Map<string, WorkbenchHandle>();

export function mountAstroCircuitEditor(element: HTMLElement, options?: AstroEditorProps): EditorInstance {
  const { preset = 'extended', id, onChange, themeMode, ...mountOpts } = options ?? {};
  const editor = mountCircuitEditorSurface({
    container: element,
    preset,
    initialDsl: mountOpts.initialDsl,
    width: mountOpts.width,
    height: mountOpts.height,
    themeMode,
    onChange,
  });

  if (id) EDITOR_STORAGE.set(id, editor);
  return editor;
}

export function unmountAstroCircuitEditor(id: string): void {
  const editor = EDITOR_STORAGE.get(id);
  if (editor) {
    editor.destroy();
    EDITOR_STORAGE.delete(id);
  }
}

export function getAstroCircuitEditor(id: string): EditorInstance | undefined {
  return EDITOR_STORAGE.get(id);
}

/** Standalone Boukamp DSL field (client island) */
export function mountAstroDslCodeMirror(element: HTMLElement, options?: AstroDslProps): DslFieldHandle {
  const { id, onChange, ...rest } = options ?? {};
  const field = mountDslField({
    container: element,
    initialDsl: rest.initialDsl,
    themeMode: rest.themeMode,
    readOnly: rest.readOnly,
    onChange,
    onDiagnostics: rest.onDiagnostics,
  });
  if (id) DSL_STORAGE.set(id, field);
  return field;
}

export function unmountAstroDslCodeMirror(id: string): void {
  const field = DSL_STORAGE.get(id);
  if (field) {
    field.destroy();
    DSL_STORAGE.delete(id);
  }
}

export function getAstroDslCodeMirror(id: string): DslFieldHandle | undefined {
  return DSL_STORAGE.get(id);
}

/** Synced DSL + editor pair */
export function mountAstroCircuitWorkbench(
  dslElement: HTMLElement,
  editorElement: HTMLElement,
  options?: AstroWorkbenchProps,
): WorkbenchHandle {
  const wb = mountCircuitWorkbenchPair({
    dslContainer: dslElement,
    editorContainer: editorElement,
    initialDsl: options?.initialDsl,
    editorPreset: options?.editorPreset,
    themeMode: options?.themeMode,
    width: options?.width,
    height: options?.height,
    onChange: options?.onChange,
  });
  if (options?.id) WORKBENCH_STORAGE.set(options.id, wb);
  return wb;
}

export function unmountAstroCircuitWorkbench(id: string): void {
  const wb = WORKBENCH_STORAGE.get(id);
  if (wb) {
    wb.destroy();
    WORKBENCH_STORAGE.delete(id);
  }
}

export function getAstroCircuitWorkbench(id: string): WorkbenchHandle | undefined {
  return WORKBENCH_STORAGE.get(id);
}

export function createAstroEditorWidget(containerId: string, options?: AstroEditorProps): string {
  return `<div id="${containerId}" data-circuit-editor="${options?.id ?? containerId}"></div>
<script type="module">
  import { mountAstroCircuitEditor } from 'velo-circuit/astro';
  const el = document.getElementById('${containerId}');
  if (el) {
    const editor = mountAstroCircuitEditor(el, ${JSON.stringify(options ?? {})});
    window.__circuitEditors = window.__circuitEditors || {};
    window.__circuitEditors['${options?.id ?? containerId}'] = editor;
  }
</script>`;
}
