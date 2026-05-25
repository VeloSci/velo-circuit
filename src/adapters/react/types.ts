import type { EditorEventType } from '../../core/index.js';
import type { Diagnostic } from '../../core/domain/diagnostics.js';
import type { ThemeMode } from '../../core/render-svg/themes.js';
import type { EditorPreset } from '../shared.js';

export type { EditorPreset, ThemeMode };

/** Shared controlled/uncontrolled circuit string state */
export interface CircuitValueProps {
  /** Controlled DSL string */
  value?: string;
  /** Initial DSL when uncontrolled */
  initialDsl?: string;
  /** Called when DSL changes from any sub-widget */
  onChange?: (dsl: string) => void;
}

export interface ReactEditorProps extends CircuitValueProps {
  width?: number;
  height?: number;
  /** Editor UI preset: `extended` (default), `lite`, or `minimal` */
  preset?: EditorPreset;
  /** Canvas chrome theme (important for lite + paired DSL field) */
  themeMode?: ThemeMode;
  onEvent?: (event: { type: EditorEventType; payload?: unknown }) => void;
}

export interface ReactDslFieldProps extends CircuitValueProps {
  themeMode?: ThemeMode;
  readOnly?: boolean;
  placeholder?: string;
  onDiagnostics?: (issues: Diagnostic[]) => void;
}

export interface ReactWorkbenchProps extends CircuitValueProps {
  /**
   * Editor part of the workbench.
   * - `lite` (default): canvas only — pair with DSL field
   * - `extended`: full editor including built-in DSL panel (DSL ref optional)
   */
  editorPreset?: EditorPreset;
  themeMode?: ThemeMode;
  width?: number;
  height?: number;
  readOnly?: boolean;
  onEvent?: ReactEditorProps['onEvent'];
}
