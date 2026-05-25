import type { EditorPlugin, PluginContext } from './types.js';
import { createDslCodeMirror, type DslCodeMirrorHandle } from '../editor/dsl-codemirror.js';
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

export function dslCodemirrorPanelPlugin(opts?: PanelPluginOptions): EditorPlugin {
  let ctx: PluginContext;
  let editorHandle: DslCodeMirrorHandle | null = null;
  let syncLock = false;

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
      const mountEl = document.createElement('div');
      mountEl.className = 'ce-dsl-codemirror';
      body.appendChild(mountEl);

      panel.appendChild(header);
      panel.appendChild(body);
      targetContainer.appendChild(panel);

      editorHandle = createDslCodeMirror({
        parent: mountEl,
        initialValue: ctx.editor.getValue(),
        getAst: () => ctx.editor.getDocument().ast,
        onChange: value => {
          if (syncLock) return;
          ctx.editor.setValue(value);
        },
      });

      header.querySelector('[data-act="copy"]')?.addEventListener('click', () => {
        navigator.clipboard.writeText(ctx.editor.getValue()).catch(() => {});
      });

      ctx.editor.on('ast-changed', () => {
        if (!editorHandle) return;
        syncLock = true;
        editorHandle.setValue(ctx.editor.getValue());
        syncLock = false;
      });
    },
    destroy() {
      editorHandle?.destroy();
      editorHandle = null;
    },
  };
}
