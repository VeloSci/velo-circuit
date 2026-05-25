import { ElementKind, elementKindFromCode } from '../domain/circuit.js';
import { buildSvgElementSymbol } from '../render-svg/symbols.js';
import { getTheme, type ThemeMode } from '../render-svg/themes.js';

const iconCache = new Map<string, HTMLElement>();

function cacheKey(mode: ThemeMode, kind: ElementKind): string {
  return `${mode}:${kind}`;
}

/** Mini schematic icon for autocomplete rows (~28×14 display). */
export function createElementSymbolIcon(kind: ElementKind, themeMode: ThemeMode): HTMLElement {
  const key = cacheKey(themeMode, kind);
  const cached = iconCache.get(key);
  if (cached) return cached.cloneNode(true) as HTMLElement;

  const theme = getTheme(themeMode);
  const inner = buildSvgElementSymbol(kind, theme);
  const wrap = document.createElement('span');
  wrap.className = 'ce-completion-symbol';
  wrap.innerHTML = `<svg viewBox="0 0 80 40" width="28" height="14" aria-hidden="true">${inner}</svg>`;
  iconCache.set(key, wrap);
  return wrap.cloneNode(true) as HTMLElement;
}

export { elementKindFromCode } from '../domain/circuit.js';

export function clearElementSymbolIconCache(): void {
  iconCache.clear();
}
