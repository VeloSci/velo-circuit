import type { CircuitGridRow } from '../domain/document.js';
import { parseBoukamp } from '../parser-bridge/parser.js';
import { validate } from '../parser-bridge/validate.js';
import { ElementRegistry } from '../parser-bridge/element-registry.js';
import { renderDslToSvg } from '../render-svg/renderer.js';
import { DEFAULT_THEME } from '../render-svg/symbols.js';
import { buildInfiniteGridLayer } from '../render-svg/infinite-grid.js';

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
}

export interface CircuitGridOptions {
  height: number;
  columnWidths?: number[];
  columns: GridColumnDef[];
  rowHeight: number;
  strict?: boolean;
  initialRows?: CircuitGridRow[];
  theme?: typeof DEFAULT_THEME;
}

export type GridEventType = 'mount' | 'destroy' | 'row-changed' | 'row-selected' | 'row-double-click' | 'viewport-changed';

export interface CircuitGridInstance {
  mount(container: HTMLElement): void;
  destroy(): void;
  getRows(): CircuitGridRow[];
  setRows(rows: CircuitGridRow[]): void;
  addRow(row?: Partial<CircuitGridRow>): void;
  updateRow(id: string, dsl: string): void;
  on(event: GridEventType, handler: (payload?: unknown) => void): () => void;
}

const DEFAULT_COLUMNS: GridColumnDef[] = [
  { id: 'dsl', label: 'DSL', type: 'dsl', width: 280 },
  { id: 'svg', label: 'SVG', type: 'svg', width: 200 },
  { id: 'params', label: 'Params', type: 'params', width: 180 },
];

function columnWidth(columns: GridColumnDef[], idx: number, overrides?: number[]): number {
  if (overrides?.[idx] !== undefined) return overrides[idx];
  return columns[idx].width ?? 160;
}

function totalWidth(columns: GridColumnDef[], overrides?: number[]): number {
  return columns.reduce((sum, _c, i) => sum + columnWidth(columns, i, overrides), 0);
}

function rowHasError(dsl: string, strict: boolean): boolean {
  const ast = parseBoukamp(dsl);
  if ('type' in ast) return true;
  const registry = ElementRegistry.fromCircuit(ast);
  const flat = registry.flatParamVector(ast);
  const result = flat.length > 0
    ? validate(ast, { strict })
    : validate(ast, { strict });
  return result.hasErrors;
}

function paramsSummary(dsl: string): string {
  const ast = parseBoukamp(dsl);
  if ('type' in ast) return '—';
  const registry = ElementRegistry.fromCircuit(ast);
  const names = registry.paramNames();
  const vals = registry.flatParamVector(ast);
  if (vals.length === 0) return '(topology only)';
  return vals.map((v, i) => `${names[i] ?? `p${i}`}=${v}`).join(', ');
}

function buildRowSvg(
  dsl: string,
  cellW: number,
  cellH: number,
): string {
  const preview = renderDslToSvg(dsl, { width: cellW - 16, height: cellH - 16, showParams: true });
  if (!preview) {
    return `<text x="8" y="${cellH / 2}" font-size="10" fill="#e63946">invalid</text>`;
  }
  const inner = preview.replace(/^[\s\S]*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return `<svg x="8" y="8" width="${cellW - 16}" height="${cellH - 16}" viewBox="${preview.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 100 100'}" overflow="hidden">${inner}</svg>`;
}

export function createCircuitGrid(options: CircuitGridOptions): CircuitGridInstance {
  const columns = options.columns.length > 0 ? options.columns : DEFAULT_COLUMNS;
  const rowHeight = options.rowHeight;
  const height = options.height;
  const strict = options.strict ?? false;
  const theme = options.theme ?? DEFAULT_THEME;

  let container: HTMLElement | null = null;
  let rows: CircuitGridRow[] = options.initialRows ?? [{ id: 'row-0', dsl: 'R0{50}-p(R1{100},C1{1e-5})' }];
  let scrollY = 0;
  let panX = 0;
  let zoom = 1;
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
    const buffer = 2;
    const start = Math.max(0, Math.floor(scrollY / rowHeight) - buffer);
    const visibleCount = Math.ceil(height / rowHeight) + buffer * 2;
    const end = Math.min(rows.length, start + visibleCount);
    return { start, end };
  }

  function renderHeader(totalW: number): string {
    let x = 0;
    const cells = columns.map((col, i) => {
      const w = columnWidth(columns, i, options.columnWidths);
      const cell = `<rect x="${x}" y="0" width="${w}" height="28" fill="var(--ce-surface,#f8f9fa)" stroke="var(--ce-border,#ddd)"/>
        <text x="${x + 8}" y="18" font-size="11" font-weight="600" fill="var(--ce-text,#333)">${col.label}</text>`;
      x += w;
      return cell;
    }).join('');
    return `<g class="grid-header">${cells}<line x1="0" y1="28" x2="${totalW}" y2="28" stroke="var(--ce-border,#ddd)"/></g>`;
  }

  function renderRow(row: CircuitGridRow, rowIndex: number, totalW: number): string {
    const y = 28 + rowIndex * rowHeight;
    const hasError = rowHasError(row.dsl, strict);
    const stroke = hasError ? theme.colors.error : 'var(--ce-border,#ddd)';

    let x = 0;
    const cells = columns.map((col, colIdx) => {
      const w = columnWidth(columns, colIdx, options.columnWidths);
      const ctx: GridRenderContext = { rowIndex, columnIndex: colIdx, strict, hasError };

      let content = '';
      switch (col.type) {
        case 'dsl':
          content = `<foreignObject x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${rowHeight - 8}">
            <div xmlns="http://www.w3.org/1999/xhtml" style="font:11px monospace;color:var(--ce-text,#222);overflow:hidden;">${row.dsl}</div>
          </foreignObject>`;
          break;
        case 'svg':
          content = buildRowSvg(row.dsl, w, rowHeight);
          break;
        case 'params':
          content = `<text x="${x + 8}" y="${y + rowHeight / 2 + 4}" font-size="10" fill="var(--ce-text-secondary,#666)">${paramsSummary(row.dsl)}</text>`;
          break;
        case 'text': {
          const label = (row.meta?.label as string | undefined) ?? row.id;
          content = `<text x="${x + 8}" y="${y + rowHeight / 2 + 4}" font-size="11" font-weight="600" fill="var(--ce-text,#333)">${label}</text>`;
          break;
        }
        case 'custom':
          content = col.render?.(row, ctx) ?? '';
          break;
      }

      const cell = `<g class="grid-row" data-row-id="${row.id}">
        <rect x="${x}" y="${y}" width="${w}" height="${rowHeight}" fill="var(--ce-bg,#fff)" stroke="${stroke}" stroke-width="${hasError ? 2 : 1}"/>
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
    const totalH = 28 + rows.length * rowHeight;
    const { start, end } = visibleRowRange();

    const gridLayer = buildInfiniteGridLayer(
      totalW,
      Math.max(height, totalH),
      panX,
      -scrollY,
      zoom,
      theme,
    );

    const visibleRows = rows.slice(start, end).map((row, i) => renderRow(row, start + i, totalW)).join('');

    const svg = container.querySelector('svg.circuit-grid-root');
    if (!svg) return;

    const viewport = svg.querySelector('#viewport') as SVGGElement;
    const gridEl = svg.querySelector('#grid-layer');
    const contentEl = svg.querySelector('#content-layer');
    if (gridEl) gridEl.outerHTML = gridLayer;
    if (contentEl) {
      contentEl.innerHTML = `${renderHeader(totalW)}${visibleRows}`;
    }
    viewport?.setAttribute('transform', `matrix(${zoom} 0 0 ${zoom} ${panX} ${-scrollY})`);
  }

  function mountShell(): void {
    if (!container) return;
    const totalW = totalWidth(columns, options.columnWidths);
    container.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" class="circuit-grid-root" width="100%" height="${height}" viewBox="0 0 ${totalW} ${height}">
  <g id="viewport">
    <g id="grid-layer"></g>
    <g id="content-layer"></g>
  </g>
</svg>`;

    const svg = container.querySelector('svg')!;
    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      scrollY = Math.max(0, Math.min(rows.length * rowHeight, scrollY + e.deltaY));
      syncSvg();
      emit('viewport-changed', { scrollY, panX, zoom });
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
      if (container) container.innerHTML = '';
      container = null;
      listeners.clear();
      emit('destroy');
    },
    getRows() {
      return [...rows];
    },
    setRows(newRows: CircuitGridRow[]) {
      rows = newRows;
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
    on,
  };
}

export function importSpectrozCatalog(entries: Array<{ dsl: string; params?: number[]; meta?: Record<string, unknown> }>): CircuitGridRow[] {
  return entries.map((entry, i) => {
    let dsl = entry.dsl;
    if (entry.params && entry.params.length > 0 && !dsl.includes('{') && !dsl.includes('[')) {
      // params vector without embedded notation — keep topology-only DSL
      void entry.params;
    }
    return { id: `catalog-${i}`, dsl, meta: entry.meta };
  });
}
