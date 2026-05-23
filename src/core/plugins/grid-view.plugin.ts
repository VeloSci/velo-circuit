import type { EditorPlugin, PluginContext } from './types.js';
import { createCircuitGrid, type CircuitGridInstance } from '../grid/circuit-grid.js';

const CSS = `
.ce-grid-host {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: none;
}
.ce-grid-host.ce-visible { display: block; }
.ce-canvas.ce-hidden { display: none; }
`;

export function gridViewPlugin(): EditorPlugin {
  let ctx: PluginContext;
  let hostEl: HTMLDivElement;
  let grid: CircuitGridInstance | null = null;

  function ensureGrid(): CircuitGridInstance {
    if (!grid) {
      grid = createCircuitGrid({
        height: ctx.editor.getDocument().viewport.height || 600,
        rowHeight: 120,
        columns: [
          { id: 'dsl', label: 'Linear DSL', type: 'dsl', width: 320 },
          { id: 'svg', label: 'Circuit SVG', type: 'svg', width: 220 },
          { id: 'params', label: 'Parameters', type: 'params', width: 200 },
        ],
        strict: ctx.editor.getDocument().metadata.strict,
        initialRows: ctx.editor.getDocument().gridRows ?? [],
      });
      grid.mount(hostEl);
      grid.on('row-double-click', (row) => {
        const r = row as { dsl: string };
        ctx.editor.setViewMode('circuit');
        ctx.editor.setValue(r.dsl);
      });
    }
    return grid;
  }

  function syncVisibility(): void {
    const mode = ctx.editor.getDocument().metadata.viewMode;
    const canvas = ctx.container.querySelector('.ce-canvas') as HTMLElement | null;
    if (mode === 'grid') {
      hostEl.classList.add('ce-visible');
      canvas?.classList.add('ce-hidden');
      const g = ensureGrid();
      g.setRows(ctx.editor.getDocument().gridRows ?? []);
    } else {
      hostEl.classList.remove('ce-visible');
      canvas?.classList.remove('ce-hidden');
    }
  }

  return {
    name: 'grid-view',
    install(c) {
      ctx = c;
      ctx.injectCSS('grid-view', CSS);
      hostEl = document.createElement('div');
      hostEl.className = 'ce-grid-host';
      const workspace = ctx.container.querySelector('.ce-workspace') || ctx.container;
      workspace.appendChild(hostEl);

      ctx.on('view-mode-changed', () => syncVisibility());
      syncVisibility();
    },
    destroy() {
      grid?.destroy();
      hostEl?.remove();
    },
  };
}
