import type { CircuitGridRow } from '../domain/document.js';
import { parseBoukamp } from '../parser-bridge/parser.js';
import { validate } from '../parser-bridge/validate.js';
import { ElementRegistry } from '../parser-bridge/element-registry.js';
import { renderDslToSvg } from '../render-svg/renderer.js';
import { getTheme, type ThemeMode } from '../render-svg/themes.js';
import { DEFAULT_THEME } from '../render-svg/symbols.js';
import { applyGridThemeClass, ensureGridThemeStyles, type GridThemeMode } from './grid-theme.js';

export type GridColumnType = 'dsl' | 'svg' | 'text' | 'params' | 'custom';

export interface GridColumnDef {
  id: string;
  label: string;
  type: GridColumnType;
  width?: number;
  render?: (row: CircuitGridRow, ctx: GridRenderContext) => string;
}

export interface GridRenderContext {
  rowIndex: number;
  columnIndex: number;
  strict: boolean;
  hasError: boolean;
  hasWarning: boolean;
}

export interface CircuitGridOptions {
  height: number;
  columnWidths?: number[];
  columns: GridColumnDef[];
  rowHeight: number;
  strict?: boolean;
  initialRows?: CircuitGridRow[];
  theme?: typeof DEFAULT_THEME;
  /** Sync grid chrome with editor / docs dark mode. */
  themeMode?: GridThemeMode;
}

export type GridEventType = 'mount' | 'destroy' | 'row-changed' | 'row-selected' | 'row-double-click' | 'viewport-changed';

export interface CircuitGridInstance {
  mount(container: HTMLElement): void;
  destroy(): void;
  getRows(): CircuitGridRow[];
  setRows(rows: CircuitGridRow[]): void;
  addRow(row?: Partial<CircuitGridRow>): void;
  updateRow(id: string, dsl: string): void;
  setThemeMode(mode: GridThemeMode): void;
  on(event: GridEventType, handler: (payload?: unknown) => void): () => void;
}

const DEFAULT_COLUMNS: GridColumnDef[] = [
  { id: 'dsl', label: 'DSL', type: 'dsl', width: 280 },
  { id: 'svg', label: 'SVG', type: 'svg', width: 200 },
  { id: 'params', label: 'Params', type: 'params', width: 180 },
];

const HEADER_HEIGHT = 32;
const CELL_PAD = 10;

function columnWidth(columns: GridColumnDef[], idx: number, overrides?: number[]): number {
  if (overrides?.[idx] !== undefined) return overrides[idx];
  return columns[idx].width ?? 160;
}

function totalWidth(columns: GridColumnDef[], overrides?: number[]): number {
  return columns.reduce((sum, _c, i) => sum + columnWidth(columns, i, overrides), 0);
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(text: string): string {
  return escapeXml(text);
}

interface RowStatus {
  parseError: boolean;
  hasError: boolean;
  hasWarning: boolean;
}

function rowStatus(dsl: string, strict: boolean): RowStatus {
  const ast = parseBoukamp(dsl);
  if ('type' in ast) {
    return { parseError: true, hasError: true, hasWarning: false };
  }
  const result = validate(ast, { strict });
  return {
    parseError: false,
    hasError: result.hasErrors,
    hasWarning: result.hasWarnings,
  };
}

function formatParamValue(v: number): string {
  if (!Number.isFinite(v)) return '?';
  if (Math.abs(v) >= 1e4 || (Math.abs(v) > 0 && Math.abs(v) < 1e-3)) return v.toExponential(2);
  return String(Number(v.toPrecision(4)));
}

function paramsSummary(dsl: string): { text: string; title: string } {
  const ast = parseBoukamp(dsl);
  if ('type' in ast) return { text: '—', title: 'Invalid DSL' };
  const registry = ElementRegistry.fromCircuit(ast);
  const names = registry.paramNames();
  const vals = registry.flatParamVector(ast);
  if (vals.length === 0) return { text: '(topology only)', title: 'No embedded parameter values' };
  const parts = vals.map((v, i) => `${names[i] ?? `p${i}`}=${formatParamValue(v)}`);
  return { text: parts.join(' · '), title: parts.join('\n') };
}

function extractCircuitSvgInner(preview: string): { viewBox: string; inner: string } {
  const viewBox = preview.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 100 60';
  const inner = preview
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/<style[\s\S]*?<\/style>/g, '');
  return { viewBox, inner };
}

function buildRowSvg(
  dsl: string,
  cellX: number,
  cellY: number,
  cellW: number,
  cellH: number,
  theme: typeof DEFAULT_THEME,
): string {
  const innerW = Math.max(40, cellW - CELL_PAD * 2);
  const innerH = Math.max(28, cellH - CELL_PAD * 2);
  const preview = renderDslToSvg(dsl, {
    width: innerW,
    height: innerH,
    showParams: false,
    theme,
  });

  const ox = cellX + CELL_PAD;
  const oy = cellY + CELL_PAD;

  if (!preview) {
    return `<text x="${ox + innerW / 2}" y="${oy + innerH / 2 + 4}" text-anchor="middle" font-size="10" fill="var(--ce-error)">invalid</text>`;
  }

  const { viewBox, inner } = extractCircuitSvgInner(preview);
  return `<g class="grid-cell-svg" transform="translate(${ox}, ${oy})">
    <svg width="${innerW}" height="${innerH}" viewBox="${viewBox}" overflow="hidden" color="var(--ce-text)">
      ${inner}
    </svg>
  </g>`;
}

function cellStroke(status: RowStatus): { color: string; width: number } {
  if (status.parseError || status.hasError) {
    return { color: 'var(--ce-error)', width: 1.5 };
  }
  if (status.hasWarning) {
    return { color: 'var(--ce-warn)', width: 1.5 };
  }
  return { color: 'var(--ce-border)', width: 1 };
}

export function createCircuitGrid(options: CircuitGridOptions): CircuitGridInstance {
  const columns = options.columns.length > 0 ? options.columns : DEFAULT_COLUMNS;
  const rowHeight = options.rowHeight;
  const height = options.height;
  const strict = options.strict ?? false;
  let themeMode: GridThemeMode = options.themeMode ?? 'light';
  let theme = options.theme ?? getTheme(themeMode as ThemeMode);

  let container: HTMLElement | null = null;
  let rows: CircuitGridRow[] = options.initialRows ?? [{ id: 'row-0', dsl: 'R0{50}-p(R1{100},C1{1e-5})' }];
  let scrollY = 0;
  const listeners = new Map<GridEventType, Set<(payload?: unknown) => void>>();

  function emit(type: GridEventType, payload?: unknown): void {
    listeners.get(type)?.forEach(h => h(payload));
  }

  function on(event: GridEventType, handler: (payload?: unknown) => void): () => void {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(handler);
    return () => listeners.get(event)?.delete(handler);
  }

  function visibleRowRange(): { start: number; end: number } {
    const bodyH = Math.max(0, height - HEADER_HEIGHT);
    const buffer = 2;
    const start = Math.max(0, Math.floor(scrollY / rowHeight) - buffer);
    const visibleCount = Math.ceil(bodyH / rowHeight) + buffer * 2;
    const end = Math.min(rows.length, start + visibleCount);
    return { start, end };
  }

  function renderHeader(totalW: number): string {
    let x = 0;
    const cells = columns.map((col, i) => {
      const w = columnWidth(columns, i, options.columnWidths);
      const cell = `<rect x="${x}" y="0" width="${w}" height="${HEADER_HEIGHT}" fill="var(--ce-surface)" stroke="none"/>
        <line x1="${x}" y1="${HEADER_HEIGHT}" x2="${x + w}" y2="${HEADER_HEIGHT}" stroke="var(--ce-border)" stroke-width="1"/>
        <line x1="${x}" y1="0" x2="${x}" y2="${HEADER_HEIGHT}" stroke="var(--ce-border)" stroke-width="1"/>
        <text x="${x + 12}" y="20" font-size="11" font-weight="600" fill="var(--ce-text-secondary)" font-family="var(--ce-font)">${escapeXml(col.label)}</text>`;
      x += w;
      return cell;
    }).join('');

    return `<g class="grid-header">
      <rect x="0" y="0" width="${totalW}" height="${HEADER_HEIGHT}" fill="var(--ce-surface)"/>
      ${cells}
      <line x1="${totalW}" y1="0" x2="${totalW}" y2="${HEADER_HEIGHT}" stroke="var(--ce-border)" stroke-width="1"/>
      <line x1="0" y1="${HEADER_HEIGHT}" x2="${totalW}" y2="${HEADER_HEIGHT}" stroke="var(--ce-border)" stroke-width="1"/>
    </g>`;
  }

  function renderRow(row: CircuitGridRow, rowIndex: number, totalW: number): string {
    const y = rowIndex * rowHeight;
    const status = rowStatus(row.dsl, strict);
    const stroke = cellStroke(status);
    const rowFill = rowIndex % 2 === 0 ? 'var(--ce-bg)' : 'var(--ce-soft)';
    const params = paramsSummary(row.dsl);

    let x = 0;
    const cells = columns.map((col, colIdx) => {
      const w = columnWidth(columns, colIdx, options.columnWidths);
      const ctx: GridRenderContext = {
        rowIndex,
        columnIndex: colIdx,
        strict,
        hasError: status.hasError,
        hasWarning: status.hasWarning,
      };

      let content = '';
      switch (col.type) {
        case 'dsl':
          content = `<foreignObject x="${x + CELL_PAD}" y="${y + 8}" width="${w - CELL_PAD * 2}" height="${rowHeight - 16}">
            <motion xmlns="http://www.w3.org/1999/xhtml" style="font:11px var(--ce-font-mono);color:var(--ce-text);line-height:1.45;word-break:break-all;">${escapeXml(row.dsl)}</motion>
          </foreignObject>`;
          break;
        case 'svg':
          content = buildRowSvg(row.dsl, x, y, w, rowHeight, theme);
          break;
        case 'params':
          content = `<foreignObject x="${x + CELL_PAD}" y="${y + 8}" width="${w - CELL_PAD * 2}" height="${rowHeight - 16}">
            <div xmlns="http://www.w3.org/1999/xhtml" title="${escapeAttr(params.title)}" style="font:10px var(--ce-font-mono);color:var(--ce-text-secondary);line-height:1.45;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;">${escapeXml(params.text)}</div>
          </foreignObject>`;
          break;
        case 'text': {
          const label = (row.meta?.label as string | undefined) ?? row.id;
          content = `<text x="${x + 12}" y="${y + rowHeight / 2 + 4}" font-size="12" font-weight="600" fill="var(--ce-text)" font-family="var(--ce-font)">${escapeXml(label)}</text>`;
          break;
        }
        case 'custom':
          content = col.render?.(row, ctx) ?? '';
          break;
      }

      const cell = `<g class="grid-row" data-row-id="${row.id}">
        <rect x="${x}" y="${y}" width="${w}" height="${rowHeight}" fill="${rowFill}" stroke="${stroke.color}" stroke-width="${stroke.width}"/>
        ${content}
      </g>`;
      x += w;
      return cell;
    }).join('');

    return cells;
  }

  function syncSvg(): void {
    if (!container) return;
    const totalW = totalWidth(columns, options.columnWidths);
    const totalContentH = rows.length * rowHeight;
    const { start, end } = visibleRowRange();

    const svg = container.querySelector('svg.circuit-grid-root');
    if (!svg) return;

    const headerEl = svg.querySelector('#header-layer');
    const contentEl = svg.querySelector('#content-layer') as SVGGElement | null;
    const viewport = svg.querySelector('#viewport') as SVGGElement | null;

    if (headerEl) headerEl.innerHTML = renderHeader(totalW);
    if (contentEl) {
      contentEl.innerHTML = visibleRowsHtml(start, end, totalW);
      contentEl.setAttribute('transform', `translate(0, ${HEADER_HEIGHT - scrollY})`);
    }

    const scrollTrack = svg.querySelector('#scroll-track') as SVGRectElement | null;
    if (scrollTrack) {
      scrollTrack.setAttribute('height', String(Math.max(height, totalContentH + HEADER_HEIGHT)));
    }

    viewport?.setAttribute('transform', 'translate(0, 0)');
    emit('viewport-changed', { scrollY });
  }

  function visibleRowsHtml(start: number, end: number, totalW: number): string {
    return rows.slice(start, end).map((row, i) => renderRow(row, start + i, totalW)).join('');
  }

  function mountShell(): void {
    if (!container) return;
    ensureGridThemeStyles(container.ownerDocument);
    container.classList.add('circuit-grid-host');
    applyGridThemeClass(container, themeMode);

    const totalW = totalWidth(columns, options.columnWidths);
    const totalContentH = rows.length * rowHeight;

    container.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" class="circuit-grid-root" width="100%" height="${height}" viewBox="0 0 ${totalW} ${height}">
  <rect width="${totalW}" height="${height}" fill="var(--ce-bg)"/>
  <g id="header-layer"></g>
  <defs>
    <clipPath id="grid-body-clip">
      <rect x="0" y="${HEADER_HEIGHT}" width="${totalW}" height="${Math.max(0, height - HEADER_HEIGHT)}"/>
    </clipPath>
  </defs>
  <g id="viewport" clip-path="url(#grid-body-clip)">
    <rect id="scroll-track" x="0" y="${HEADER_HEIGHT}" width="${totalW}" height="${totalContentH}" fill="transparent"/>
    <g id="content-layer"></g>
  </g>
</svg>`;

    const svg = container.querySelector('svg')!;
    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const maxScroll = Math.max(0, totalContentH - (height - HEADER_HEIGHT));
      scrollY = Math.max(0, Math.min(maxScroll, scrollY + e.deltaY));
      syncSvg();
    }, { passive: false });

    svg.addEventListener('dblclick', (e) => {
      const rowG = (e.target as Element).closest('[data-row-id]');
      if (!rowG) return;
      const id = rowG.getAttribute('data-row-id');
      const row = rows.find(r => r.id === id);
      if (row) emit('row-double-click', row);
    });

    syncSvg();
    emit('mount');
  }

  return {
    mount(el: HTMLElement) {
      container = el;
      mountShell();
    },
    destroy() {
      if (container) {
        container.innerHTML = '';
        container.classList.remove('circuit-grid-host', 'ce-dark');
      }
      container = null;
      listeners.clear();
      emit('destroy');
    },
    getRows() {
      return [...rows];
    },
    setRows(newRows: CircuitGridRow[]) {
      rows = newRows;
      scrollY = 0;
      syncSvg();
    },
    addRow(row?: Partial<CircuitGridRow>) {
      const id = row?.id ?? `row-${rows.length}`;
      rows.push({ id, dsl: row?.dsl ?? 'R0', meta: row?.meta });
      syncSvg();
    },
    updateRow(id: string, dsl: string) {
      const idx = rows.findIndex(r => r.id === id);
      if (idx >= 0) {
        rows[idx] = { ...rows[idx], dsl };
        syncSvg();
        emit('row-changed', rows[idx]);
      }
    },
    setThemeMode(mode: GridThemeMode) {
      themeMode = mode;
      theme = getTheme(mode as ThemeMode);
      if (container) {
        applyGridThemeClass(container, mode);
        syncSvg();
      }
    },
    on,
  };
}

export function importSpectrozCatalog(entries: Array<{ dsl: string; params?: number[]; meta?: Record<string, unknown> }>): CircuitGridRow[] {
  return entries.map((entry, i) => {
    let dsl = entry.dsl;
    if (entry.params && entry.params.length > 0 && !dsl.includes('{') && !dsl.includes('[')) {
      void entry.params;
    }
    return { id: `catalog-${i}`, dsl, meta: entry.meta };
  });
}
