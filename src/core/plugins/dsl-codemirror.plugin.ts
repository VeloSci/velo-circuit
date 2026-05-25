import type { EditorPlugin, PluginContext } from './types.js';
import { createDslCodeMirror, type DslCodeMirrorHandle } from '../editor/dsl-codemirror.js';
import { clearElementSymbolIconCache } from '../editor/element-symbol-icon.js';
import { getTheme, type ThemeMode } from '../render-svg/themes.js';
import { getOrCreateSidebar, type PanelPluginOptions } from './sidebar.plugin.js';

const CSS = `
.ce-dsl-codemirror {
  width: 100%;
  min-height: 55px;
}
.ce-dsl-codemirror .cm-editor {
  width: 100%;
}
`;

function resolveContainer(ctx: PluginContext, selector?: HTMLElement | string): HTMLElement {
  if (selector instanceof HTMLElement) return selector;
  if (typeof selector === 'string') {
    const el = document.querySelector(selector);
    if (el) return el as HTMLElement;
  }
  return getOrCreateSidebar(ctx);
}

function resolveThemeMode(ctx: PluginContext): ThemeMode {
  return ctx.container.classList.contains('ce-dark') ? 'dark' : 'light';
}

function editorThemeForMode(mode: ThemeMode) {
  const t = getTheme(mode);
  return {
    bg: t.colors.fill,
    text: t.colors.text,
    border: mode === 'dark' ? '#475569' : '#e2e8f0',
    accent: t.colors.highlight,
    accentAlpha: mode === 'dark' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(59, 130, 246, 0.2)',
    selection: mode === 'dark' ? 'rgba(56, 189, 248, 0.22)' : 'rgba(59, 130, 246, 0.18)',
    activeLine: mode === 'dark' ? 'rgba(56, 189, 248, 0.08)' : 'rgba(59, 130, 246, 0.06)',
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    minHeight: '55px',
  };
}

export function dslCodemirrorPanelPlugin(opts?: PanelPluginOptions): EditorPlugin {
  let ctx: PluginContext;
  let editorHandle: DslCodeMirrorHandle | null = null;
  let syncLock = false;
  let themeUnsub: (() => void) | null = null;
  let mountEl: HTMLElement | null = null;

  function mountEditor() {
    if (!mountEl || !ctx) return;
    editorHandle?.destroy();
    editorHandle = null;
    clearElementSymbolIconCache();

    const themeMode = resolveThemeMode(ctx);
    editorHandle = createDslCodeMirror({
      parent: mountEl,
      initialValue: ctx.editor.getValue(),
      getAst: () => ctx.editor.getDocument().ast,
      theme: editorThemeForMode(themeMode),
      themeMode,
      onChange: value => {
        if (syncLock) return;
        ctx.editor.setValue(value);
      },
    });
  }

  return {
    name: 'dsl-codemirror-panel',
    install(c) {
      ctx = c;
      ctx.injectCSS('dsl-codemirror-panel', CSS);

      if (!ctx.editor.getShowParams()) {
        ctx.editor.setShowParams(true);
      }

      const targetContainer = resolveContainer(ctx, opts?.container);
      const panel = document.createElement('div');
      panel.className = 'ce-panel';

      const header = document.createElement('div');
      header.className = 'ce-panel-header';
      header.innerHTML = '<span>Boukamp DSL</span><button class="ce-panel-btn" data-act="copy">📋</button>';

      const body = document.createElement('div');
      body.className = 'ce-panel-body';
      mountEl = document.createElement('div');
      mountEl.className = 'ce-dsl-codemirror';
      body.appendChild(mountEl);

      panel.appendChild(header);
      panel.appendChild(body);
      targetContainer.appendChild(panel);

      mountEditor();

      header.querySelector('[data-act="copy"]')?.addEventListener('click', () => {
        navigator.clipboard.writeText(ctx.editor.getValue()).catch(() => {});
      });

      ctx.editor.on('ast-changed', () => {
        if (!editorHandle) return;
        syncLock = true;
        editorHandle.setValue(ctx.editor.getValue());
        syncLock = false;
      });

      themeUnsub = ctx.on('theme-changed', () => {
        const value = editorHandle?.getValue() ?? ctx.editor.getValue();
        mountEditor();
        if (editorHandle && value !== ctx.editor.getValue()) {
          syncLock = true;
          editorHandle.setValue(value);
          syncLock = false;
        }
      });
    },
    destroy() {
      themeUnsub?.();
      themeUnsub = null;
      editorHandle?.destroy();
      editorHandle = null;
      mountEl = null;
    },
  };
}
