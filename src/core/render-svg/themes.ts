import type { RenderTheme, ThemeColors } from './symbols.js';
import { SYMBOL_STROKE_WIDTH } from './symbols.js';

export const DARK_THEME: RenderTheme = {
  colors: {
    stroke: '#f8fafc',
    fill: '#0f172a',
    text: '#f1f5f9',
    highlight: '#38bdf8',
    error: '#f87171',
    warning: '#fbbf24',
    grid: '#1e293b',
  },
  strokeWidth: SYMBOL_STROKE_WIDTH,
  fontSize: 12,
  fontFamily: 'monospace',
  elementWidth: 80,
  elementHeight: 40,
};

export type ThemeMode = 'light' | 'dark';

export const THEMES: Record<ThemeMode, RenderTheme> = {
  light: {
    colors: {
      stroke: '#1e293b',
      fill: '#ffffff',
      text: '#0f172a',
      highlight: '#3b82f6',
      error: '#ef4444',
      warning: '#f59e0b',
      grid: '#94a3b8', // Much darker grid color for light mode
    },
    strokeWidth: SYMBOL_STROKE_WIDTH,
    fontSize: 12,
    fontFamily: 'monospace',
    elementWidth: 80,
    elementHeight: 40,
  },
  dark: DARK_THEME,
};

export function getTheme(mode: ThemeMode): RenderTheme {
  return THEMES[mode] ?? THEMES.light;
}

export function toggleTheme(current: ThemeMode): ThemeMode {
  return current === 'light' ? 'dark' : 'light';
}

/** Standalone preview: single stroke color (theme-aware). Multicolor: per-kind colors like the editor. */
export type SymbolColorMode = 'bicolor' | 'multicolor';

export interface ThemeCSSOptions {
  colorMode?: SymbolColorMode;
  themeMode?: ThemeMode;
}

/** Per-kind stroke tokens — aligned with `theme.plugin.ts` editor CSS. */
export const ELEMENT_STROKE_COLORS: Record<ThemeMode, Record<string, string>> = {
  light: {
    R: '#dc2626',
    C: '#2563eb',
    L: '#059669',
    Q: '#d97706',
    W: '#7c3aed',
    Ws: '#7c3aed',
    Wo: '#7c3aed',
    G: '#0891b2',
    Pdw: '#9333ea',
    CC: '#ea580c',
    HN: '#db2777',
  },
  dark: {
    R: '#f87171',
    C: '#60a5fa',
    L: '#34d399',
    Q: '#fbbf24',
    W: '#a78bfa',
    Ws: '#a78bfa',
    Wo: '#a78bfa',
    G: '#22d3ee',
    Pdw: '#c084fc',
    CC: '#fb923c',
    HN: '#f472b6',
  },
};

export function buildElementStrokeCSS(themeMode: ThemeMode, scope = ''): string {
  const colors = ELEMENT_STROKE_COLORS[themeMode];
  const node = scope ? `${scope} .circuit-node` : '.circuit-node';
  const rules: string[] = [
    `${node}[data-kind="R"] { --ce-R-stroke: ${colors.R}; }`,
    `${node}[data-kind="C"] { --ce-C-stroke: ${colors.C}; }`,
    `${node}[data-kind="L"] { --ce-L-stroke: ${colors.L}; }`,
    `${node}[data-kind="Q"] { --ce-Q-stroke: ${colors.Q}; }`,
    `${node}[data-kind="W"], ${node}[data-kind="Ws"], ${node}[data-kind="Wo"] { --ce-W-stroke: ${colors.W}; --ce-Ws-stroke: ${colors.Ws}; --ce-Wo-stroke: ${colors.Wo}; }`,
    `${node}[data-kind="G"] { --ce-G-stroke: ${colors.G}; }`,
    `${node}[data-kind="Pdw"] { --ce-Pdw-stroke: ${colors.Pdw}; }`,
    `${node}[data-kind="CC"] { --ce-CC-stroke: ${colors.CC}; }`,
    `${node}[data-kind="HN"] { --ce-HN-stroke: ${colors.HN}; }`,
  ];
  return rules.join('\n    ');
}

export function buildThemeCSS(theme: RenderTheme, options: ThemeCSSOptions = {}): string {
  const { colorMode = 'multicolor', themeMode = 'dark' } = options;
  const elementColors = colorMode === 'multicolor' ? buildElementStrokeCSS(themeMode) : '';

  return `
    .circuit-editor {
      --ce-stroke: ${theme.colors.stroke};
      --ce-fill: ${theme.colors.fill};
      --ce-text: ${theme.colors.text};
      --ce-highlight: ${theme.colors.highlight};
      --ce-error: ${theme.colors.error};
      --ce-warning: ${theme.colors.warning};
      --ce-grid: ${theme.colors.grid};
      --ce-grid-dot: ${theme.colors.grid};
      --ce-stroke-width: ${theme.strokeWidth};
      --ce-font-size: ${theme.fontSize}px;
      --ce-font-family: ${theme.fontFamily};
      --ce-element-width: ${theme.elementWidth}px;
      --ce-element-height: ${theme.elementHeight}px;
      background-color: ${theme.colors.fill};
      color: ${theme.colors.text};
      user-select: none;
    }
    .circuit-node .node-hit { fill: transparent; stroke: none; }
    .circuit-node .node-bg { fill: none; }
    .circuit-node:hover .node-bg { stroke: var(--ce-highlight); }
    .circuit-node.selected .node-bg { stroke: var(--ce-highlight); stroke-width: calc(var(--ce-stroke-width) * 1.5); }
    .circuit-node text { fill: var(--ce-text); font-weight: 500; }
    .circuit-connection path { stroke: var(--ce-stroke); fill: none; }
    .circuit-junction circle { fill: var(--ce-stroke); }
    ${elementColors}
  `.trim();
}

/** Minimal CSS for static documentation previews — no selection chrome or opaque background. */
export function buildPreviewThemeCSS(theme: RenderTheme, options: ThemeCSSOptions = {}): string {
  const { colorMode = 'multicolor', themeMode = 'dark' } = options;
  const elementColors = colorMode === 'multicolor' ? buildElementStrokeCSS(themeMode, '.circuit-preview') : '';

  return `
    .circuit-preview {
      --ce-stroke: ${theme.colors.stroke};
      --ce-text: ${theme.colors.text};
      --ce-stroke-width: ${theme.strokeWidth};
      --ce-font-size: ${theme.fontSize}px;
      --ce-font-family: ${theme.fontFamily};
      width: 100%;
      height: auto;
      display: block;
      background: transparent;
      background-color: transparent;
      color: ${theme.colors.text};
    }
    .circuit-preview .circuit-node text { fill: var(--ce-text); font-weight: 500; }
    .circuit-preview .circuit-connection path { stroke: var(--ce-stroke); fill: none; }
    .circuit-preview .circuit-junction circle { fill: var(--ce-stroke); }
    ${elementColors}
  `.trim();
}