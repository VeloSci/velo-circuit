import type { EditorPlugin, PluginContext } from './types.js';
import type { CircuitNode } from '../domain/circuit.js';
import { ELEMENT_KINDS } from '../domain/circuit.js';
import { escapeHtmlAttr } from '../domain/param-labels.js';
import { invalidParameterReason } from '../parser-bridge/physical.js';
import { findElementLayout, WORKSPACE_SETTLED } from './overlay-ui.js';

function findElementNode(ast: CircuitNode, id: string): CircuitNode | null {
  if (ast.type === 'element' && `${ast.kind}${ast.id}` === id) return ast;
  if (ast.type === 'series' || ast.type === 'parallel') {
    for (const child of ast.children) {
      const found = findElementNode(child, id);
      if (found) return found;
    }
  }
  return null;
}

export function paramEditPlugin(): EditorPlugin {
  let ctx: PluginContext;
  let selectedId: string | null = null;
  let layerEl: SVGGElement | null = null;

  function clearLayer(): void {
    if (layerEl) layerEl.innerHTML = '';
  }

  function renderEditor(): void {
    clearLayer();
    if (!selectedId || !layerEl) return;

    const elementNode = findElementNode(ctx.editor.getDocument().ast, selectedId);
    if (!elementNode || elementNode.type !== 'element') return;

    const layout = findElementLayout(ctx.editor.getDocument().ast, selectedId);
    if (!layout) return;

    const def = ELEMENT_KINDS.get(elementNode.kind);
    if (!def) return;

    const params = elementNode.params ?? new Array(def.nParams).fill(0);
    const x = layout.visualX;
    const y = layout.visualY + layout.height + 4;
    const w = Math.max(layout.width, 90);
    const h = 18 * def.nParams + 8;
    const strict = ctx.editor.getDocument().metadata.strict;

    const fieldsHtml = def.params.map((paramDef, i) => {
      const val = params[i] ?? '';
      const trial = [...params];
      trial[i] = parseFloat(String(val)) || 0;
      const invalid = strict && invalidParameterReason(elementNode.kind as string, trial) !== null;
      const title = escapeHtmlAttr(paramDef.title);
      return `<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;">
        <label style="font:9px monospace;color:#666;min-width:28px;" title="${title}">${paramDef.short}</label>
        <input class="param-edit-input${invalid ? ' invalid' : ''}" type="text" data-idx="${i}" value="${val}" title="${title}" />
      </div>`;
    }).join('');

    const ns = 'http://www.w3.org/1999/xhtml';
    const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    fo.setAttribute('x', String(x));
    fo.setAttribute('y', String(y));
    fo.setAttribute('width', String(w));
    fo.setAttribute('height', String(h));
    fo.addEventListener('pointerdown', (e) => e.stopPropagation());

    const wrapper = document.createElementNS(ns, 'div');
    wrapper.setAttribute('style', 'background:var(--ce-surface,#fff);border:1px solid var(--ce-border,#ccc);border-radius:4px;padding:4px;');
    wrapper.innerHTML = fieldsHtml;
    fo.appendChild(wrapper);

    layerEl.appendChild(fo);

    layerEl.querySelectorAll('input').forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { clearLayer(); return; }
        if (e.key === 'Enter') { (input as HTMLInputElement).blur(); }
      });
      input.addEventListener('change', () => {
        if (!selectedId) return;
        const newParams = def.params.map((_, i) => {
          const inp = layerEl!.querySelector(`input[data-idx="${i}"]`) as HTMLInputElement;
          return parseFloat(inp.value);
        });
        if (newParams.some(v => !Number.isFinite(v))) return;
        ctx.editor.updateParams(selectedId, newParams);
      });
    });
  }

  return {
    name: 'param-edit',
    install(c) {
      ctx = c;

      ctx.editor.on('render', () => {
        layerEl = ctx.container.querySelector('#param-edit-layer') as SVGGElement | null;
        requestAnimationFrame(renderEditor);
      });

      ctx.on('selection-changed', (data) => {
        selectedId = (data as string) ?? null;
        renderEditor();
      });

      ctx.editor.on('ast-changed', () => renderEditor());
      ctx.on(WORKSPACE_SETTLED, () => {
        if (selectedId) renderEditor();
      });
    },
    destroy() {
      clearLayer();
    },
  };
}
