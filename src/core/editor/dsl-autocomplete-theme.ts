import { EditorView } from '@codemirror/view';
import type { DslCodeMirrorTheme } from './dsl-editor-types.js';
import type { ThemeMode } from '../render-svg/themes.js';

/**
 * Autocomplete tooltip theme (~half default width).
 * Uses unconditional colors — CM tooltips are portaled to document.body and
 * must not rely on &light/&dark facets from the parent page.
 */
export function buildAutocompleteThemeExtension(
  theme?: DslCodeMirrorTheme,
  themeMode: ThemeMode = 'light',
): ReturnType<typeof EditorView.theme> {
  const isDark = themeMode === 'dark';
  const bg = theme?.bg ?? (isDark ? '#1e293b' : '#ffffff');
  const text = theme?.text ?? (isDark ? '#e2e8f0' : '#1e293b');
  const border = theme?.border ?? (isDark ? '#475569' : '#e2e8f0');
  const accent = theme?.accent ?? (isDark ? '#38bdf8' : '#3b82f6');
  const muted = isDark ? '#94a3b8' : '#64748b';

  const tooltipBase = {
    backgroundColor: `${bg} !important`,
    color: `${text} !important`,
    border: `1px solid ${border} !important`,
    borderRadius: '8px',
    boxShadow: isDark
      ? '0 8px 24px rgba(0,0,0,0.55)'
      : '0 8px 24px rgba(0,0,0,0.12)',
    maxWidth: 'min(350px, 42vw)',
    minWidth: '200px',
  };

  return EditorView.theme({
    '.cm-tooltip.cm-tooltip-autocomplete': tooltipBase,
    '&.cm-focused .cm-tooltip.cm-tooltip-autocomplete': tooltipBase,
    '.cm-tooltip-autocomplete > ul': {
      fontFamily: theme?.fontMono ?? 'ui-monospace, monospace',
      fontSize: '12px',
      maxHeight: 'min(280px, 40vh)',
      backgroundColor: bg,
      color: text,
    },
    '.cm-tooltip-autocomplete > ul > li': {
      padding: '4px 8px 4px 4px',
      lineHeight: '1.35',
      color: text,
      backgroundColor: 'transparent',
    },
    '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
      backgroundColor: `${accent} !important`,
      color: '#ffffff !important',
    },
    '.cm-tooltip-autocomplete > ul > li[aria-selected] .cm-completionDetail': {
      color: 'rgba(255,255,255,0.9) !important',
    },
    '.cm-completionIcon': {
      display: 'none !important',
    },
    '.cm-completionLabel': {
      fontWeight: '500',
      color: 'inherit',
    },
    '.cm-completionDetail': {
      fontStyle: 'normal',
      opacity: 0.9,
      marginLeft: '6px',
      fontSize: '11px',
      color: muted,
    },
    '.cm-completionMatchedText': {
      textDecoration: 'underline',
      fontWeight: '600',
    },
    '.ce-completion-symbol': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '16px',
      marginRight: '6px',
      flexShrink: '0',
      verticalAlign: 'middle',
    },
    '.ce-completion-symbol svg': {
      display: 'block',
    },
    '.cm-completionInfo': {
      backgroundColor: `${bg} !important`,
      color: `${text} !important`,
      border: `1px solid ${border} !important`,
      padding: '6px 10px',
      fontSize: '11px',
      maxWidth: '280px',
    },
    '.cm-tooltip.cm-completionInfo': {
      backgroundColor: `${bg} !important`,
      color: `${text} !important`,
      border: `1px solid ${border} !important`,
    },
  });
}
