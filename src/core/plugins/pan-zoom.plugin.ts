import type { EditorPlugin, PluginContext } from './types.js';
import { HIDE_FLOATING_UI, WORKSPACE_SETTLED, isOverlayUiTarget } from './overlay-ui.js';

const CSS = `
.ce-canvas {
  flex: 1; position: relative; overflow: hidden; cursor: grab;
  background-color: var(--ce-bg);
  touch-action: none;
  --ce-grid-step: 20;
  --ce-pan-x: 0;
  --ce-pan-y: 0;
  --ce-zoom: 1;
  background-image:
    linear-gradient(to right, color-mix(in srgb, var(--ce-border, #e0e0e0) 50%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--ce-border, #e0e0e0) 50%, transparent) 1px, transparent 1px);
  background-size: calc(var(--ce-grid-step) * var(--ce-zoom) * 1px) calc(var(--ce-grid-step) * var(--ce-zoom) * 1px);
  background-position: calc(var(--ce-pan-x) * 1px) calc(var(--ce-pan-y) * 1px);
}
.ce-canvas.ce-panning { cursor: grabbing; }
.ce-canvas svg.circuit-editor-root {
  position: absolute; top: 0; left: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.ce-canvas svg #viewport {
  will-change: transform;
}
.ce-canvas.ce-panning svg #viewport {
  will-change: transform;
}
.ce-canvas svg text {
  text-rendering: geometricPrecision;
}
.ce-canvas svg path,
.ce-canvas svg line,
.ce-canvas svg polyline,
.ce-canvas svg circle,
.ce-canvas svg rect {
  shape-rendering: geometricPrecision;
}
.ce-zoom-label {
  position: absolute; bottom: 8px; left: 8px;
  font: 500 10px var(--ce-font);
  color: var(--ce-text-secondary);
  background: var(--ce-surface-alpha);
  padding: 2px 8px; border-radius: 4px; pointer-events: none;
  backdrop-filter: blur(4px);
}
`;

export interface PanZoomPluginAPI extends EditorPlugin {
  getZoom(): number;
  getPan(): { x: number; y: number };
  fitView(): void;
  resetView(): void;
  setZoom(z: number): void;
}

export function panZoomPlugin(): PanZoomPluginAPI {
  let ctx: PluginContext;
  let canvasEl: HTMLDivElement;
  let zoomLabelEl: HTMLDivElement;
  let canvasResizeObserver: ResizeObserver | null = null;
  let zoom = 1, panX = 0, panY = 0;
  let isPanning = false, panStartX = 0, panStartY = 0;
  const activePointers = new Map<number, { x: number; y: number }>();
  let pinchDistance = 0;
  let pinchMid = { x: 0, y: 0 };
  let contentBBox = { x: 0, y: 0, width: 0, height: 0 };
  const MIN_ZOOM = 0.25, MAX_ZOOM = 4.0;
  let wheelSettleTimer: ReturnType<typeof setTimeout> | null = null;
  let wasPanning = false;
  let panDidMove = false;

  function hideFloatingUi(): void {
    ctx.emit(HIDE_FLOATING_UI);
  }

  function settleWorkspace(): void {
    ctx.emit(WORKSPACE_SETTLED);
  }

  function scheduleWorkspaceSettled(delayMs = 120): void {
    if (wheelSettleTimer) clearTimeout(wheelSettleTimer);
    wheelSettleTimer = setTimeout(() => {
      wheelSettleTimer = null;
      settleWorkspace();
    }, delayMs);
  }

  function syncCssVars(): void {
    canvasEl.style.setProperty('--ce-pan-x', String(panX));
    canvasEl.style.setProperty('--ce-pan-y', String(panY));
    canvasEl.style.setProperty('--ce-zoom', String(zoom));
  }

  function applyViewportTransform(): void {
    const svg = canvasEl.querySelector('svg.circuit-editor-root, svg.circuit-editor');
    const viewport = svg?.querySelector('#viewport');
    if (viewport instanceof SVGGElement) {
      viewport.setAttribute('transform', `matrix(${zoom} 0 0 ${zoom} ${panX} ${panY})`);
    }
    syncCssVars();
    zoomLabelEl.textContent = Math.round(zoom * 100) + '%';
    ctx.emit('viewport-changed', { zoom, panX, panY });
  }

  function updateContentBBox(): void {
    const svg = canvasEl.querySelector('svg');
    if (!svg) return;

    const nodesGroup = svg.querySelector('#nodes') as SVGGElement | null;
    if (nodesGroup) {
      try {
        const bbox = nodesGroup.getBBox();
        if (bbox.width > 0 || bbox.height > 0) {
          contentBBox = bbox;
        }
      } catch {
        contentBBox = { x: 0, y: 0, width: 800, height: 600 };
      }
    } else {
      contentBBox = { x: 0, y: 0, width: 800, height: 600 };
    }
  }

  function fitView() {
    hideFloatingUi();
    updateContentBBox();
    const r = canvasEl.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;

    if (contentBBox.width === 0 && contentBBox.height === 0) {
      zoom = 1;
      panX = r.width / 2;
      panY = r.height / 2;
      applyViewportTransform();
      scheduleWorkspaceSettled();
      return;
    }

    const padding = 40;
    const scaleX = (r.width - padding * 2) / contentBBox.width;
    const scaleY = (r.height - padding * 2) / contentBBox.height;
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(scaleX, scaleY)));
    panX = (r.width - contentBBox.width * zoom) / 2 - contentBBox.x * zoom;
    panY = (r.height - contentBBox.height * zoom) / 2 - contentBBox.y * zoom;
    applyViewportTransform();
    scheduleWorkspaceSettled();
  }

  function resetView() {
    fitView();
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const f = e.deltaY < 0 ? 1.08 : 0.92;
    const oldZ = zoom;
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * f));
    const rect = canvasEl.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    panX = mx - (mx - panX) * (zoom / oldZ);
    panY = my - (my - panY) * (zoom / oldZ);
    applyViewportTransform();
    hideFloatingUi();
    scheduleWorkspaceSettled();
  }

  function startPan(e: PointerEvent) {
    hideFloatingUi();
    wasPanning = true;
    panDidMove = false;
    isPanning = true;
    panStartX = e.clientX;
    panStartY = e.clientY;
    canvasEl.classList.add('ce-panning');
    canvasEl.setPointerCapture(e.pointerId);
  }

  function onPointerDown(e: PointerEvent) {
    if (isOverlayUiTarget(e.target)) return;

    if (e.button === 0 || e.button === 1 || e.pointerType === 'touch') {
      hideFloatingUi();
    }

    if (e.pointerType === 'touch') {
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      canvasEl.setPointerCapture(e.pointerId);
      const nodeEl = (e.target as Element).closest?.('[data-element-id]');
      if (activePointers.size >= 2) {
        isPanning = false;
        const points = Array.from(activePointers.values());
        pinchDistance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
        pinchMid = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
      } else if (!nodeEl) {
        startPan(e);
      }
      return;
    }
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      startPan(e);
      return;
    }
    const nodeEl = (e.target as Element).closest?.('[data-element-id]');
    if (e.button === 0 && !nodeEl) startPan(e);
  }

  function onPointerMove(e: PointerEvent) {
    if (e.pointerType === 'touch' && activePointers.has(e.pointerId)) {
      const prev = activePointers.get(e.pointerId)!;
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.size >= 2) {
        isPanning = false;
        const points = Array.from(activePointers.values());
        const dist = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
        const mid = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
        const rect = canvasEl.getBoundingClientRect();
        panX += mid.x - pinchMid.x;
        panY += mid.y - pinchMid.y;
        if (pinchDistance > 0) {
          const oldZ = zoom;
          zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * (dist / pinchDistance)));
          const mx = mid.x - rect.left;
          const my = mid.y - rect.top;
          panX = mx - (mx - panX) * (zoom / oldZ);
          panY = my - (my - panY) * (zoom / oldZ);
        }
        pinchDistance = dist;
        pinchMid = mid;
        panDidMove = true;
        applyViewportTransform();
        return;
      }
      if (isPanning) {
        panDidMove = true;
        panX += e.clientX - prev.x;
        panY += e.clientY - prev.y;
        applyViewportTransform();
      }
      return;
    }
    if (!isPanning) return;
    if (Math.abs(e.clientX - panStartX) > 3 || Math.abs(e.clientY - panStartY) > 3) {
      panDidMove = true;
    }
    panX += e.clientX - panStartX;
    panY += e.clientY - panStartY;
    panStartX = e.clientX;
    panStartY = e.clientY;
    applyViewportTransform();
  }

  function onPointerUp(e: PointerEvent) {
    activePointers.delete(e.pointerId);
    if (activePointers.size < 2) pinchDistance = 0;
    if (canvasEl.hasPointerCapture?.(e.pointerId)) canvasEl.releasePointerCapture(e.pointerId);
    if (isPanning) {
      isPanning = false;
      canvasEl.classList.remove('ce-panning');
    }
    if (wasPanning || activePointers.size === 0) {
      wasPanning = false;
      if (panDidMove) scheduleWorkspaceSettled(80);
      panDidMove = false;
    }
  }

  function syncViewportSizeFromCanvas() {
    const rect = canvasEl.getBoundingClientRect();
    ctx.editor.dispatch({
      type: 'viewport-change',
      panX,
      panY,
      zoom,
      width: Math.max(1, Math.floor(rect.width)),
      height: Math.max(1, Math.floor(rect.height)),
    });
  }

  return {
    name: 'pan-zoom',
    install(c) {
      ctx = c;
      ctx.injectCSS('pan-zoom', CSS);
      const workspace = ctx.container.querySelector('.ce-workspace') || ctx.container;
      canvasEl = document.createElement('div');
      canvasEl.className = 'ce-canvas';
      workspace.appendChild(canvasEl);
      zoomLabelEl = document.createElement('div');
      zoomLabelEl.className = 'ce-zoom-label';
      zoomLabelEl.textContent = '100%';
      canvasEl.appendChild(zoomLabelEl);

      canvasEl.addEventListener('wheel', onWheel, { passive: false });
      canvasEl.addEventListener('pointerdown', onPointerDown);
      canvasEl.addEventListener('pointermove', onPointerMove);
      canvasEl.addEventListener('pointerup', onPointerUp);
      canvasEl.addEventListener('pointercancel', onPointerUp);

      if (typeof ResizeObserver !== 'undefined') {
        canvasResizeObserver = new ResizeObserver(() => syncViewportSizeFromCanvas());
        canvasResizeObserver.observe(canvasEl);
      }

      syncCssVars();
      syncViewportSizeFromCanvas();

      let firstRender = true;
      ctx.editor.on('render', () => {
        updateContentBBox();
        if (firstRender) {
          firstRender = false;
          requestAnimationFrame(() => fitView());
        }
      });

      ctx.on('fit-view', () => fitView());
      ctx.on('reset-view', () => resetView());
    },
    destroy() {
      canvasResizeObserver?.disconnect();
      canvasEl?.remove();
    },
    getZoom: () => zoom,
    getPan: () => ({ x: panX, y: panY }),
    fitView,
    resetView,
    setZoom(z: number) { zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z)); applyViewportTransform(); },
  };
}
