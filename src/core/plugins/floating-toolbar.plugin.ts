import type { EditorPlugin, PluginContext } from './types.js';
import { ELEMENT_KINDS, type CircuitNode } from '../domain/circuit.js';
import { escapeHtmlAttr } from '../domain/param-labels.js';
import { invalidParameterReason } from '../parser-bridge/physical.js';
import {
  findElementLayout,
  HIDE_FLOATING_UI,
  WORKSPACE_SETTLED,
} from './overlay-ui.js';

const XHTML = 'http://www.w3.org/1999/xhtml';
const SVG = 'http://www.w3.org/2000/svg';
/** Fixed height of the top action strip (world px). Must match `.ce-st-top` CSS height. */
const TOP_STRIP_HEIGHT_PX = 22;
/** Gap from component top to bottom of the top strip (world px). */
const TOP_STRIP_GAP_PX = 4;
/** Horizontal gap between component right edge and params column (world px). */
const MENU_RIGHT_INSET_PX = 4;
/** Selection halo inset — matches renderer `node-bg` x/y offset. */
const NODE_SELECTION_INSET = 2;
/** Outer corner radius for the L-shaped menu shell (world px). */
const MENU_CORNER_RADIUS_PX = 5;

const CSS = `
foreignObject.ce-sel-panel {
  overflow: visible;
  pointer-events: none;
}
foreignObject.ce-sel-panel.ce-visible { pointer-events: auto; }

.ce-st-root {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transition: opacity .1s ease-out;
}
foreignObject.ce-sel-panel.ce-visible .ce-st-root {
  visibility: visible;
  opacity: 1;
  pointer-events: auto;
}

.ce-st-wrap {
  position: relative;
  display: block;
  width: max-content;
  max-width: min(420px, 92vw);
  border: none;
  background: none;
  overflow: visible;
}

.ce-st-top {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  height: 22px;
  width: max-content;
  background: var(--ce-surface);
  border: 1px solid var(--ce-border);
  border-radius: 5px;
  box-shadow: 0 2px 10px var(--ce-shadow);
}

.ce-st-wrap.has-params {
  filter: drop-shadow(0 2px 10px var(--ce-shadow));
}
.ce-st-wrap.has-params .ce-st-top {
  width: 100%;
  border: none;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
}

.ce-st-id-btn {
  display: flex; align-items: center; justify-content: center;
  height: 22px; min-width: 28px; padding: 0 6px;
  border: none; border-right: 1px solid var(--ce-border);
  background: transparent;
  cursor: pointer; flex-shrink: 0;
  font: 600 10px var(--ce-font-mono); color: var(--ce-accent);
  line-height: 1;
  transition: background .1s;
}
.ce-st-id-btn:hover { background: var(--ce-hover); }

.ce-st-actions {
  display: flex; align-items: center; gap: 1px; padding: 0 2px;
  flex-wrap: nowrap;
}

.ce-st-btn {
  padding: 0 5px; height: 18px; border: 1px solid var(--ce-border); border-radius: 3px;
  background: var(--ce-surface); cursor: pointer;
  font: 500 9px var(--ce-font); color: var(--ce-text-secondary);
  transition: all .1s; display: flex; align-items: center; gap: 2px; white-space: nowrap;
  line-height: 1;
}
.ce-st-btn:hover { background: var(--ce-hover); border-color: var(--ce-accent); color: var(--ce-accent); }
.ce-st-btn.ce-danger:hover { background: var(--ce-error-bg); border-color: var(--ce-error); color: var(--ce-error); }
.ce-st-btn:disabled { opacity: .3; cursor: default; }
.ce-st-sep { width: 1px; height: 12px; background: var(--ce-border); margin: 0 1px; flex-shrink: 0; }

.ce-st-params {
  position: absolute;
  top: 22px;
  right: 0;
  left: auto;
  z-index: 1;
  display: flex; flex-direction: column; gap: 2px;
  padding: 3px 6px 5px;
  min-width: 120px;
  box-sizing: border-box;
  background: var(--ce-surface);
  border: 1px solid var(--ce-border);
  border-radius: 0 0 5px 5px;
  box-shadow: 0 2px 10px var(--ce-shadow);
}
.ce-st-wrap.has-params .ce-st-params {
  border: none;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
}
.ce-st-outline {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  pointer-events: none;
  overflow: visible;
}
.ce-st-outline .ce-st-fill { fill: var(--ce-surface); }
.ce-st-outline .ce-st-stroke {
  fill: none;
  stroke: var(--ce-border);
  stroke-width: 1;
}
.ce-st-wrap.has-params .ce-st-top { position: relative; z-index: 1; }
.ce-st-param-row { display: flex; align-items: center; gap: 4px; }
.ce-st-param-lbl { font: 500 8px var(--ce-font); color: var(--ce-text-secondary); min-width: 28px; }
.ce-st-param-inp {
  flex: 1; min-width: 0; padding: 1px 4px; font: 400 9px var(--ce-font-mono);
  border: 1px solid var(--ce-border); border-radius: 2px; background: var(--ce-bg);
  color: var(--ce-text); text-align: right; height: 16px;
}
.ce-st-param-inp:focus { outline: none; border-color: var(--ce-accent); }
.ce-st-param-inp.invalid { border-color: var(--ce-error); }
`;

export function floatingToolbarPlugin(): EditorPlugin {
  let ctx: PluginContext;
  let panelFo: SVGForeignObjectElement | null = null;
  let rootEl: HTMLDivElement | null = null;
  let selectedId: string | null = null;

  function syncMenuOutline(
    wrap: HTMLElement,
    shellW: number,
    stripH: number,
    paramsW: number,
    paramsH: number,
  ): void {
    const paramsLeft = shellW - paramsW;
    const r = MENU_CORNER_RADIUS_PX;
    const totalH = stripH + paramsH;
    const w = shellW;

    let svg = wrap.querySelector('svg.ce-st-outline') as SVGSVGElement | null;
    if (!svg) {
      svg = document.createElementNS(SVG, 'svg');
      svg.setAttribute('class', 'ce-st-outline');
      const fillPath = document.createElementNS(SVG, 'path');
      fillPath.setAttribute('class', 'ce-st-fill');
      const strokePath = document.createElementNS(SVG, 'path');
      strokePath.setAttribute('class', 'ce-st-stroke');
      svg.append(fillPath, strokePath);
      wrap.insertBefore(svg, wrap.firstChild);
    }

    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(totalH));
    svg.style.width = `${w}px`;
    svg.style.height = `${totalH}px`;

    const stripFill = [
      `M ${r},0`,
      `H ${w - r}`,
      `A ${r},${r} 0 0 1 ${w},${r}`,
      `V ${stripH}`,
      `H 0`,
      `V ${r}`,
      `A ${r},${r} 0 0 1 ${r},0`,
      'Z',
    ].join(' ');

    const paramsFill = [
      `M ${paramsLeft},${stripH}`,
      `H ${w}`,
      `V ${totalH - r}`,
      `A ${r},${r} 0 0 1 ${w - r},${totalH}`,
      `H ${paramsLeft}`,
      'Z',
    ].join(' ');

    // Strip: rounded top + full bottom edge; params: right/bottom/inner-left (no divider above params).
    const stripStroke = [
      `M ${r},0`,
      `H ${w - r}`,
      `A ${r},${r} 0 0 1 ${w},${r}`,
      `V ${stripH}`,
      `H 0`,
      `V ${r}`,
      `A ${r},${r} 0 0 1 ${r},0`,
    ].join(' ');

    const paramsStroke = [
      `M ${w},${stripH}`,
      `V ${totalH - r}`,
      `A ${r},${r} 0 0 1 ${w - r},${totalH}`,
      `H ${paramsLeft}`,
      `V ${stripH}`,
    ].join(' ');

    svg.querySelector('.ce-st-fill')!.setAttribute('d', `${stripFill} ${paramsFill}`);
    svg.querySelector('.ce-st-stroke')!.setAttribute('d', `${stripStroke} ${paramsStroke}`);
  }

  function removeMenuOutline(wrap: HTMLElement): void {
    wrap.querySelector('svg.ce-st-outline')?.remove();
  }

  function findNode(ast: CircuitNode, id: string): CircuitNode | null {
    if (ast.type === 'element' && `${ast.kind}${ast.id}` === id) return ast;
    if (ast.type === 'series' || ast.type === 'parallel') {
      for (const child of ast.children) {
        const found = findNode(child, id);
        if (found) return found;
      }
    }
    return null;
  }

  function ensurePanel(): boolean {
    const svg = ctx.container.querySelector('svg.circuit-editor-root');
    const overlay = svg?.querySelector('#overlay-layer');
    if (!overlay) return false;

    if (!panelFo) {
      panelFo = document.createElementNS(SVG, 'foreignObject') as SVGForeignObjectElement;
      panelFo.setAttribute('class', 'ce-sel-panel');
      panelFo.setAttribute('width', '380');
      panelFo.setAttribute('height', '220');
      panelFo.setAttribute('overflow', 'visible');

      rootEl = document.createElementNS(XHTML, 'div') as HTMLDivElement;
      rootEl.className = 'ce-st-root';
      panelFo.appendChild(rootEl);
      overlay.appendChild(panelFo);
      buildPanel();
      panelFo.addEventListener('pointerdown', (e) => e.stopPropagation());
    }
    return true;
  }

  function buildPanel() {
    if (!rootEl) return;
    rootEl.innerHTML = `
      <div class="ce-st-wrap">
        <div class="ce-st-top">
          <button type="button" class="ce-st-id-btn" data-ref="label" title="Change element type">—</button>
          <div class="ce-st-actions">
            <button type="button" class="ce-st-btn" data-act="before" title="Add before (series)">← Before</button>
            <button type="button" class="ce-st-btn" data-act="after" title="Add after (series)">After →</button>
            <button type="button" class="ce-st-btn" data-act="parallel" title="Add in parallel">∥ Parallel</button>
            <div class="ce-st-sep"></div>
            <button type="button" class="ce-st-btn" data-act="moveL" title="Move left">◀</button>
            <button type="button" class="ce-st-btn" data-act="moveR" title="Move right">▶</button>
            <div class="ce-st-sep"></div>
            <button type="button" class="ce-st-btn ce-danger" data-act="delete" title="Delete">🗑</button>
          </div>
        </div>
        <div class="ce-st-params" data-ref="params" hidden></div>
      </div>`;

    rootEl.querySelectorAll('.ce-st-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleAction((btn as HTMLElement).dataset.act!, e as MouseEvent);
      });
    });

    const idBtn = rootEl.querySelector('.ce-st-id-btn');
    idBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!selectedId) return;
      const r = (idBtn as HTMLElement).getBoundingClientRect();
      ctx.emit('open-element-picker', {
        targetId: selectedId,
        position: 'replace',
        x: r.left,
        y: r.bottom + 4,
      });
    });
  }

  function handleAction(act: string, evt: MouseEvent) {
    if (!selectedId) return;
    const r = (evt.target as HTMLElement).getBoundingClientRect();
    switch (act) {
      case 'before':
        ctx.emit('open-element-picker', { targetId: selectedId, position: 'before', x: r.left, y: r.bottom + 4 });
        break;
      case 'after':
        ctx.emit('open-element-picker', { targetId: selectedId, position: 'after', x: r.left, y: r.bottom + 4 });
        break;
      case 'parallel':
        ctx.emit('open-element-picker', { targetId: selectedId, position: 'parallel', x: r.left, y: r.bottom + 4 });
        break;
      case 'moveL': ctx.editor.moveLeft(selectedId); break;
      case 'moveR': ctx.editor.moveRight(selectedId); break;
      case 'delete': {
        const id = selectedId;
        ctx.emit('deselect-element');
        ctx.editor.deleteElement(id);
        break;
      }
    }
  }

  function renderParams(id: string): void {
    const paramsEl = rootEl?.querySelector('[data-ref="params"]') as HTMLElement | null;
    if (!paramsEl) return;

    const node = findNode(ctx.editor.getDocument().ast, id);
    if (!node || node.type !== 'element') {
      paramsEl.hidden = true;
      rootEl?.querySelector('.ce-st-wrap')?.classList.remove('has-params');
      return;
    }

    const kindDef = ELEMENT_KINDS.get(node.kind);
    const wrap = rootEl?.querySelector('.ce-st-wrap') as HTMLElement | null;
    if (!kindDef || kindDef.nParams === 0) {
      paramsEl.hidden = true;
      wrap?.classList.remove('has-params');
      return;
    }

    const vals = node.params ?? new Array(kindDef.nParams).fill(0);
    const strict = ctx.editor.getDocument().metadata.strict;

    paramsEl.innerHTML = kindDef.params.map((paramDef, i) => {
      const trial = [...vals];
      trial[i] = parseFloat(String(vals[i])) || 0;
      const invalid = strict && invalidParameterReason(node.kind as string, trial) !== null;
      const title = escapeHtmlAttr(paramDef.title);
      return `<div class="ce-st-param-row">
        <span class="ce-st-param-lbl" title="${title}">${paramDef.short}</span>
        <input type="text" class="ce-st-param-inp${invalid ? ' invalid' : ''}" data-idx="${i}" value="${vals[i] ?? ''}" title="${title}" />
      </div>`;
    }).join('');

    paramsEl.hidden = false;
    wrap?.classList.add('has-params');
    paramsEl.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('change', () => {
        if (!selectedId) return;
        const newParams = kindDef.params.map((_, i) => {
          const el = paramsEl.querySelector(`input[data-idx="${i}"]`) as HTMLInputElement;
          return parseFloat(el.value);
        });
        if (newParams.some(v => !Number.isFinite(v))) return;
        ctx.editor.updateParams(selectedId, newParams);
      });
      inp.addEventListener('click', e => e.stopPropagation());
      inp.addEventListener('mousedown', e => e.stopPropagation());
    });
  }

  function positionPanel(id: string): void {
    if (!panelFo || !rootEl) return;
    const layout = findElementLayout(ctx.editor.getDocument().ast, id);
    if (!layout) return;

    const wrap = rootEl.querySelector('.ce-st-wrap') as HTMLElement | null;
    const topBar = rootEl.querySelector('.ce-st-top') as HTMLElement | null;
    const paramsEl = rootEl.querySelector('[data-ref="params"]') as HTMLElement | null;

    const componentLeft = layout.visualX - NODE_SELECTION_INSET;
    const componentTop = layout.visualY - NODE_SELECTION_INSET;
    const componentRight = layout.visualX + layout.width + NODE_SELECTION_INSET;

    if (topBar) topBar.style.width = 'max-content';

    const stripNaturalW = topBar?.offsetWidth ?? 120;
    const paramsVisible = Boolean(paramsEl && !paramsEl.hidden);
    const paramsW = paramsVisible ? (paramsEl?.offsetWidth ?? 0) : 0;
    const paramsH = paramsVisible ? (paramsEl?.offsetHeight ?? 0) : 0;

    // Minimum left edge for params: 4px right of component selection box.
    const paramsLeftMin = componentRight + MENU_RIGHT_INSET_PX - componentLeft;
    const shellW = paramsVisible
      ? Math.max(stripNaturalW, paramsLeftMin + paramsW)
      : stripNaturalW;

    if (wrap) {
      wrap.style.minWidth = '';
      if (paramsVisible && paramsEl && topBar) {
        wrap.style.width = `${shellW}px`;
        wrap.style.height = `${TOP_STRIP_HEIGHT_PX + paramsH}px`;
        topBar.style.width = `${shellW}px`;
        paramsEl.style.right = '0';
        paramsEl.style.left = 'auto';
        syncMenuOutline(wrap, shellW, TOP_STRIP_HEIGHT_PX, paramsW, paramsH);
      } else if (paramsEl && topBar) {
        removeMenuOutline(wrap);
        paramsEl.style.right = '';
        paramsEl.style.left = '';
        topBar.style.width = '';
        wrap.style.width = '';
        wrap.style.height = '';
      }
    }

    panelFo.setAttribute('x', String(componentLeft));
    panelFo.setAttribute('y', String(componentTop - TOP_STRIP_GAP_PX - TOP_STRIP_HEIGHT_PX));

    const foW = (paramsVisible ? shellW : stripNaturalW) + 8;
    const foH = paramsVisible ? TOP_STRIP_HEIGHT_PX + paramsH + 8 : TOP_STRIP_HEIGHT_PX + 8;
    panelFo.setAttribute('width', String(Math.max(200, Math.ceil(foW))));
    panelFo.setAttribute('height', String(Math.max(32, Math.ceil(foH))));
  }

  function hideVisual() {
    panelFo?.classList.remove('ce-visible');
  }

  function showFor(id: string) {
    if (!ensurePanel()) return;
    selectedId = id;

    const label = rootEl?.querySelector('[data-ref="label"]') as HTMLElement;
    if (label) label.textContent = id;

    const ectx = ctx.editor.getContext(id);
    const moveL = rootEl?.querySelector('[data-act="moveL"]') as HTMLButtonElement;
    const moveR = rootEl?.querySelector('[data-act="moveR"]') as HTMLButtonElement;
    if (moveL) moveL.disabled = !ectx.canMoveLeft;
    if (moveR) moveR.disabled = !ectx.canMoveRight;

    renderParams(id);
    panelFo!.classList.add('ce-visible');
    requestAnimationFrame(() => {
      positionPanel(id);
      requestAnimationFrame(() => positionPanel(id));
    });
  }

  function hide() {
    selectedId = null;
    panelFo?.classList.remove('ce-visible');
  }

  return {
    name: 'floating-toolbar',
    install(c) {
      ctx = c;
      ctx.injectCSS('floating-toolbar', CSS);

      ctx.on('selection-changed', (data) => {
        if (data) showFor(data as string);
        else hide();
      });

      ctx.on(HIDE_FLOATING_UI, () => {
        if (selectedId) hideVisual();
      });

      ctx.on(WORKSPACE_SETTLED, () => {
        if (selectedId) showFor(selectedId);
      });

      ctx.editor.on('render', () => {
        if (selectedId && panelFo?.classList.contains('ce-visible')) {
          requestAnimationFrame(() => {
            if (selectedId) {
              positionPanel(selectedId);
              renderParams(selectedId);
            }
          });
        }
      });

      ctx.editor.on('ast-changed', () => {
        if (selectedId && panelFo?.classList.contains('ce-visible')) {
          const label = rootEl?.querySelector('[data-ref="label"]') as HTMLElement;
          if (label) label.textContent = selectedId;
          renderParams(selectedId);
          requestAnimationFrame(() => { if (selectedId) positionPanel(selectedId); });
        }
      });
    },
    destroy() {
      panelFo?.remove();
      panelFo = null;
      rootEl = null;
    },
  };
}
