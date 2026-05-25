import type { CircuitNode } from '../domain/circuit.js';
import type { Diagnostic } from '../domain/diagnostics.js';
import type { ThemeMode } from '../render-svg/themes.js';

export interface DslCodeMirrorTheme {
  bg?: string;
  text?: string;
  border?: string;
  accent?: string;
  accentAlpha?: string;
  fontMono?: string;
  minHeight?: string;
  selection?: string;
  activeLine?: string;
}

export interface DslCodeMirrorOptions {
  parent: HTMLElement;
  initialValue: string;
  getAst: () => CircuitNode | null;
  onChange: (value: string) => void;
  onDiagnostics?: (diagnostics: Diagnostic[]) => void;
  readOnly?: boolean;
  placeholder?: string;
  theme?: DslCodeMirrorTheme;
  themeMode?: ThemeMode;
}

export interface DslCodeMirrorHandle {
  setValue(text: string): void;
  getValue(): string;
  destroy(): void;
  focus(): void;
  hasFocus(): boolean;
  setReadOnly(readOnly: boolean): void;
}
