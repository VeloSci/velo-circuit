/** Theme tokens for `createCircuitGrid` — mirrors editor `--ce-*` variables. */
export const GRID_THEME_CSS = `
.circuit-grid-host {
  --ce-bg: #f0f2f5;
  --ce-surface: #ffffff;
  --ce-soft: #f8fafc;
  --ce-border: #e2e8f0;
  --ce-text: #1e293b;
  --ce-text-secondary: #64748b;
  --ce-accent: #4cc9f0;
  --ce-hover: #e8f4fd;
  --ce-error: #ef4444;
  --ce-warn: #f59e0b;
  --ce-ok: #22c55e;
  --ce-font: 'Inter', system-ui, -apple-system, sans-serif;
  --ce-font-mono: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--ce-bg);
  color: var(--ce-text);
  font-family: var(--ce-font);
}

.circuit-grid-host.ce-dark {
  --ce-bg: #0f172a;
  --ce-surface: #1e293b;
  --ce-soft: #162032;
  --ce-border: #334155;
  --ce-text: #e2e8f0;
  --ce-text-secondary: #94a3b8;
  --ce-accent: #38bdf8;
  --ce-hover: rgba(56, 189, 248, 0.1);
  --ce-error: #f87171;
  --ce-warn: #fbbf24;
  --ce-ok: #4ade80;
}

.circuit-grid-host svg.circuit-grid-root {
  display: block;
  width: 100%;
  user-select: none;
}

.circuit-grid-host svg.circuit-grid-root:focus {
  outline: none;
}
`.trim();

export type GridThemeMode = 'light' | 'dark';

export function applyGridThemeClass(el: HTMLElement, mode: GridThemeMode): void {
  el.classList.toggle('ce-dark', mode === 'dark');
}

let gridThemeInjected = false;

export function ensureGridThemeStyles(doc: Document = document): void {
  if (gridThemeInjected || doc.getElementById('ce-grid-theme')) return;
  const style = doc.createElement('style');
  style.id = 'ce-grid-theme';
  style.textContent = GRID_THEME_CSS;
  doc.head.appendChild(style);
  gridThemeInjected = true;
}

/** @internal test hook */
export function resetGridThemeInjectionForTests(): void {
  gridThemeInjected = false;
}
