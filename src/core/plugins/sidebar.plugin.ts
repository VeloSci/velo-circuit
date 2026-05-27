import type { EditorPlugin, PluginContext } from './types.js';
import type { ThemeMode } from '../render-svg/themes.js';
import { buildDownloadCircuitSvg, serializeAstForExport } from '../editor/circuit-export.js';
import {
  copyTextToClipboard,
  downloadTextFile,
  flashButtonLabel,
  sanitizeDslFilename,
} from '../editor/export-utils.js';

const CSS = `
.ce-sidebar {
  width: 300px; border-left: 1px solid var(--ce-border);
  overflow-y: auto; background: var(--ce-surface); display: flex; flex-direction: column;
}
@media (max-width: 1000px) {
  .ce-sidebar { display: none !important; }
}
.ce-panel { border-bottom: 1px solid var(--ce-border); }
.ce-panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 12px; background: var(--ce-soft);
  font: 600 9px var(--ce-font); text-transform: uppercase;
  letter-spacing: .5px; color: var(--ce-text-secondary);
}
.ce-panel-body { padding: 8px 12px; }
.ce-panel-btn {
  padding: 3px 8px; border: 1px solid var(--ce-border); border-radius: 4px;
  background: var(--ce-surface); cursor: pointer;
  font: 400 9px var(--ce-font); color: var(--ce-text-secondary); transition: all .12s;
}
.ce-panel-btn:hover { background: var(--ce-hover); border-color: var(--ce-accent); }
`;

export interface PanelPluginOptions {
  container?: HTMLElement | string;
}

/** Creates or gets the default sidebar container, shared by dsl/diagnostics/export plugins if no override is provided */
export function getOrCreateSidebar(ctx: PluginContext): HTMLDivElement {
  let sidebar = ctx.container.querySelector('.ce-sidebar') as HTMLDivElement;
  if (!sidebar) {
    ctx.injectCSS('sidebar', CSS);
    sidebar = document.createElement('div');
    sidebar.className = 'ce-sidebar';
    const workspace = ctx.container.querySelector('.ce-workspace') || ctx.container;
    workspace.appendChild(sidebar);
  }
  return sidebar;
}

function resolveContainer(ctx: PluginContext, selector?: HTMLElement | string): HTMLElement {
  if (selector instanceof HTMLElement) return selector;
  if (typeof selector === 'string') {
    const el = document.querySelector(selector);
    if (el) return el as HTMLElement;
  }
  return getOrCreateSidebar(ctx);
}

// ──── DSL Panel ────

const DSL_CSS = `
.ce-dsl-input {
  width: 100%; min-height: 55px; padding: 8px;
  border: 1px solid var(--ce-border); border-radius: 6px;
  font: 13px var(--ce-font-mono); resize: vertical;
  background: var(--ce-bg); color: var(--ce-text); line-height: 1.4;
}
.ce-dsl-input:focus {
  outline: none; border-color: var(--ce-accent);
  box-shadow: 0 0 0 3px var(--ce-accent-alpha);
}
`;

export function dslPanelPlugin(opts?: PanelPluginOptions): EditorPlugin {
  let ctx: PluginContext;
  let textarea: HTMLTextAreaElement;

  return {
    name: 'dsl-panel',
    install(c) {
      ctx = c;
      ctx.injectCSS('dsl-panel', DSL_CSS);

      ctx.injectCSS('dsl-panel', DSL_CSS);

      const targetContainer = resolveContainer(ctx, opts?.container);
      const panel = document.createElement('div');
      panel.className = 'ce-panel';
      panel.innerHTML = `
        <div class="ce-panel-header">
          <span>Boukamp DSL</span>
          <button class="ce-panel-btn" data-act="copy">📋</button>
        </div>
        <div class="ce-panel-body">
          <textarea class="ce-dsl-input" spellcheck="false"></textarea>
        </div>`;
      targetContainer.appendChild(panel);

      textarea = panel.querySelector('.ce-dsl-input')!;
      textarea.value = ctx.editor.getValue();

      textarea.addEventListener('change', () => ctx.editor.setValue(textarea.value.trim()));
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault(); ctx.editor.setValue(textarea.value.trim());
        }
      });

      const copyBtn = panel.querySelector<HTMLButtonElement>('[data-act="copy"]');
      copyBtn?.addEventListener('click', async () => {
        const ok = await copyTextToClipboard(ctx.editor.getValue());
        if (ok && copyBtn) flashButtonLabel(copyBtn);
      });

      ctx.editor.on('ast-changed', () => { textarea.value = ctx.editor.getValue(); });
    },
    destroy() {},
  };
}

// ──── Diagnostics Panel ────

const DIAG_CSS = `
.ce-diag-ok { font-size: 10px; color: var(--ce-ok); text-align: center; padding: 6px; }
.ce-diag-item {
  display: flex; align-items: flex-start; gap: 4px; padding: 4px 6px;
  border-radius: 4px; font-size: 10px; line-height: 1.3; margin-bottom: 3px;
}
.ce-diag-item.ce-err { background: var(--ce-error-bg); color: var(--ce-error); }
.ce-diag-item.ce-warn { background: var(--ce-warn-bg); color: var(--ce-warn); }
`;

export function diagnosticsPlugin(opts?: PanelPluginOptions): EditorPlugin {
  let ctx: PluginContext;
  let contentEl: HTMLDivElement;

  function update() {
    const v = ctx.editor.getValidation();
    if (!v.issues.length) {
      contentEl.innerHTML = '<div class="ce-diag-ok">✓ No issues</div>';
      return;
    }
    contentEl.innerHTML = v.issues.map(i =>
      `<div class="ce-diag-item ${i.type === 'error' ? 'ce-err' : 'ce-warn'}">${i.type === 'error' ? '✖' : '⚠'} ${i.message}</div>`
    ).join('');
  }

  return {
    name: 'diagnostics',
    install(c) {
      ctx = c;
      ctx.injectCSS('diagnostics', DIAG_CSS);

      ctx.injectCSS('diagnostics', DIAG_CSS);

      const targetContainer = resolveContainer(ctx, opts?.container);
      const panel = document.createElement('div');
      panel.className = 'ce-panel';
      panel.innerHTML = `
        <div class="ce-panel-header">Diagnostics</div>
        <div class="ce-panel-body"><div class="ce-diag-ok">✓ No issues</div></div>`;
      targetContainer.appendChild(panel);
      contentEl = panel.querySelector('.ce-panel-body')!;

      ctx.editor.on('ast-changed', () => update());
      ctx.editor.on('validation', () => update());
    },
    destroy() {},
  };
}

// ──── Export Panel ────

const EXPORT_CSS = `
.ce-export-btns { display: flex; flex-wrap: wrap; gap: 4px; }
.ce-export-btns button {
  flex: 1 1 calc(50% - 2px); min-width: 0; padding: 5px; border: 1px solid var(--ce-border); border-radius: 5px;
  background: var(--ce-surface); cursor: pointer; font: 400 10px var(--ce-font);
  color: var(--ce-text-secondary); transition: all .12s;
}
.ce-export-btns button[data-act="dsl"] { flex: 1 1 100%; }
.ce-export-btns button:hover { background: var(--ce-hover); border-color: var(--ce-accent); }
.ce-export-opt {
  display: flex; align-items: center; gap: 6px; margin-top: 8px;
  font: 400 10px var(--ce-font); color: var(--ce-text-secondary); cursor: pointer;
}
.ce-export-opt input { margin: 0; cursor: pointer; }
.ce-export-hint {
  margin-top: 6px; font: 400 9px var(--ce-font); color: var(--ce-text-secondary); line-height: 1.35;
}
`;

export function exportPanelPlugin(opts?: PanelPluginOptions): EditorPlugin {
  let ctx: PluginContext;

  return {
    name: 'export-panel',
    install(c) {
      ctx = c;
      ctx.injectCSS('export-panel', EXPORT_CSS);

      const targetContainer = resolveContainer(ctx, opts?.container);
      const panel = document.createElement('div');
      panel.className = 'ce-panel';
      panel.innerHTML = `
        <div class="ce-panel-header">Export</div>
        <div class="ce-panel-body">
          <div class="ce-export-btns">
            <button type="button" data-act="svg-params" title="SVG with parameters (transparent background)">📐 SVG</button>
            <button type="button" data-act="svg-topo" title="SVG without parameter values (transparent background)">📐 SVG topo</button>
            <button type="button" data-act="dsl" title="Full Boukamp DSL with all parameter values">📋 DSL</button>
          </div>
          <label class="ce-export-opt">
            <input type="checkbox" data-opt="dark-theme" />
            Dark export theme
          </label>
          <p class="ce-export-hint">Exports use light theme and transparent background unless dark is checked. Filenames match the exported DSL string.</p>
        </div>`;
      targetContainer.appendChild(panel);

      const darkThemeCheck = panel.querySelector<HTMLInputElement>('[data-opt="dark-theme"]');
      const exportThemeMode = (): ThemeMode => (darkThemeCheck?.checked ? 'dark' : 'light');

      const downloadSvg = (showParams: boolean, button: HTMLButtonElement | null) => {
        const ast = ctx.editor.getDocument().ast;
        const dsl = serializeAstForExport(ast, showParams);
        const svg = buildDownloadCircuitSvg(dsl, {
          themeMode: exportThemeMode(),
          showParams,
        });
        if (!svg) return;
        downloadTextFile(
          sanitizeDslFilename(dsl, 'svg'),
          svg,
          'image/svg+xml;charset=utf-8',
        );
        if (button) flashButtonLabel(button, '✓');
      };

      panel.querySelector<HTMLButtonElement>('[data-act="svg-params"]')?.addEventListener('click', e => {
        downloadSvg(true, (e.currentTarget as HTMLButtonElement));
      });
      panel.querySelector<HTMLButtonElement>('[data-act="svg-topo"]')?.addEventListener('click', e => {
        downloadSvg(false, (e.currentTarget as HTMLButtonElement));
      });
      panel.querySelector<HTMLButtonElement>('[data-act="dsl"]')?.addEventListener('click', e => {
        const ast = ctx.editor.getDocument().ast;
        const dslFull = serializeAstForExport(ast, true);
        downloadTextFile(sanitizeDslFilename(dslFull, 'dsl'), dslFull);
        flashButtonLabel(e.currentTarget as HTMLButtonElement, '✓');
      });
    },
    destroy() {},
  };
}
