import type { CircuitDocument } from '../domain/document.js';
import type { CircuitNode, ElementKind } from '../domain/circuit.js';
import type { EditableGraph } from '../domain/graph.js';
import type { EditorCommand, LoadCircuitCommand } from '../domain/commands.js';
import type { ValidationResult } from '../domain/validation.js';
import type { EditorPlugin } from '../plugins/types.js';
import { PluginRegistry } from '../plugins/types.js';
import type { PanZoomPluginAPI } from '../plugins/pan-zoom.plugin.js';
import { createElement } from '../domain/circuit.js';
import { createStore } from '../state/store.js';
import { createAdapter } from '../parser-bridge/index.js';
import { buildLayout, computeBounds } from '../layout/layout-engine.js';
import { buildCircuitLayers, collectInvalidElementIds } from '../render-svg/renderer.js';
import { buildEditorSvgShell } from '../render-svg/infinite-grid.js';
import { DEFAULT_THEME } from '../render-svg/symbols.js';
import { defaultViewport } from '../domain/document.js';
import { makeCommandId } from '../domain/commands.js';
import { serialize } from '../parser-bridge/serializer.js';
import { validate } from '../parser-bridge/validate.js';
import type { StrictOptions } from '../parser-bridge/index.js';
import type { CircuitGridRow } from '../domain/document.js';
import {
  generateNextElementId,
  computeNextParamOffset,
  insertElementIntoSeries,
  insertElementIntoParallel,
  deleteElementRecursive,
  wrapInParallel,
  wrapInSeries,
  collectElementIds,
  insertAfterTarget,
  insertBeforeTarget,
  addParallelToTarget,
  moveElementLeft,
  moveElementRight,
  changeElementKind as changeElementKindInAst,
  getElementContext,
  type ParentContext,
} from './commands-builder.js';

export type EditorEventType =
  | 'mount'
  | 'destroy'
  | 'ast-changed'
  | 'selection-changed'
  | 'viewport-changed'
  | 'render'
  | 'command'
  | 'error'
  | 'validation';

export interface EditorEvent {
  type: EditorEventType;
  payload?: unknown;
}

export type EventHandler = (event: EditorEvent) => void;

export interface EditorOptions {
  initialDsl?: string;
  width?: number;
  height?: number;
  onEvent?: EventHandler;
  plugins?: EditorPlugin[];
  strict?: boolean;
  blockInvalidSetValue?: boolean;
  viewMode?: 'circuit' | 'grid';
  initialGridRows?: CircuitGridRow[];
}

export type InsertMode = 'series' | 'parallel';

export interface EditorInstance {
  mount(container: HTMLElement, options?: EditorOptions): void;
  destroy(): void;
  getValue(): string;
  setValue(dsl: string): void;
  getShowParams(): boolean;
  setShowParams(show: boolean): void;
  updateParams(targetId: string, params: number[]): void;
  getDocument(): CircuitDocument;
  dispatch(command: EditorCommand): void;
  on(event: EditorEventType, handler: EventHandler): () => void;
  undo(): void;
  redo(): void;
  render(): string;

  // High-level API
  insertElement(kind: ElementKind, mode?: InsertMode): void;
  deleteElement(targetId: string): void;
  wrapInParallel(targetId: string, kind: ElementKind): void;
  wrapInSeries(targetId: string, kind: ElementKind, after?: boolean): void;
  getInsertMode(): InsertMode;
  setInsertMode(mode: InsertMode): void;
  getValidation(): ValidationResult;
  getElementIds(): string[];

  // Positional / contextual API
  insertRelative(targetId: string, kind: ElementKind, position: 'before' | 'after' | 'parallel'): void;
  moveLeft(targetId: string): void;
  moveRight(targetId: string): void;
  changeElementKind(targetId: string, kind: ElementKind): void;
  getContext(targetId: string): ParentContext;
  select(elementId: string): void;
  deselect(): void;
  getSelectedId(): string | null;
  getContainer(): HTMLElement | null;
  getStrict(): boolean;
  setStrict(strict: boolean): void;
  getViewMode(): 'circuit' | 'grid';
  setViewMode(mode: 'circuit' | 'grid'): void;
  getGridRows(): CircuitGridRow[];
  setGridRows(rows: CircuitGridRow[]): void;
  fitView(): void;
  resetView(): void;
}

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;

export function createEditor(editorOpts?: { plugins?: EditorPlugin[]; strict?: StrictOptions }): EditorInstance {
  let container: HTMLElement | null = null;
  const adapter = createAdapter(editorOpts?.strict);
  const store = createStore();
  const listeners = new Map<EditorEventType, Set<EventHandler>>();
  let insertMode: InsertMode = 'series';
  let unsubStore: (() => void) | null = null;
  let selectedElementId: string | null = null;
  const pluginRegistry = new PluginRegistry();

  // Register plugins from constructor
  if (editorOpts?.plugins) {
    for (const p of editorOpts.plugins) pluginRegistry.register(p);
  }

  function emit(type: EditorEventType, payload?: unknown): void {
    const event: EditorEvent = { type, payload };
    listeners.get(type)?.forEach(h => h(event));
  }

  function on(event: EditorEventType, handler: EventHandler): () => void {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(handler);
    return () => listeners.get(event)?.delete(handler);
  }

  function getCurrentAst(): CircuitNode {
    return store.getAst();
  }

  function rebuildGraph(): EditableGraph {
    return buildLayout(getCurrentAst());
  }

  function render(): string {
    const selection = store.getSelection();
    const doc = store.getDocument();
    const graph = rebuildGraph();
    const viewportWidth = doc.viewport.width > 0 ? doc.viewport.width : DEFAULT_WIDTH;
    const viewportHeight = doc.viewport.height > 0 ? doc.viewport.height : DEFAULT_HEIGHT;
    const showParams = doc.metadata.showParams;
    const validation = adapter.validate(getCurrentAst());
    const invalidIds = collectInvalidElementIds(getCurrentAst());

    const layers = buildCircuitLayers(graph, {
      width: viewportWidth,
      height: viewportHeight,
      showParams,
      selectedNodeIds: selection.selectedNodeIds,
      invalidElementIds: validation.hasErrors ? invalidIds : undefined,
    });

    return buildEditorSvgShell(viewportWidth, viewportHeight, DEFAULT_THEME)
      .replace('<g id="connections"></g>', `<g id="connections">${layers.connections}</g>`)
      .replace('<g id="nodes"></g>', `<g id="nodes">${layers.nodes}</g>`);
  }

  function syncContainer(): void {
    if (!container) return;
    const doc = store.getDocument();
    if (doc.metadata.viewMode === 'grid') {
      emit('render', '');
      return;
    }

    const target = (container.querySelector?.('.ce-canvas') as HTMLElement) || container;
    const viewportWidth = doc.viewport.width > 0 ? doc.viewport.width : DEFAULT_WIDTH;
    const viewportHeight = doc.viewport.height > 0 ? doc.viewport.height : DEFAULT_HEIGHT;

    if (typeof target.querySelector !== 'function') {
      const html = render();
      if (typeof target.insertAdjacentHTML === 'function') {
        target.insertAdjacentHTML('beforeend', html);
      } else {
        (target as { innerHTML?: string }).innerHTML = html;
      }
      emit('render', html);
      return;
    }

    let svg = target.querySelector('svg.circuit-editor-root') as SVGSVGElement | null;
    if (!svg) {
      target.insertAdjacentHTML('beforeend', buildEditorSvgShell(viewportWidth, viewportHeight, DEFAULT_THEME));
      svg = target.querySelector('svg.circuit-editor-root') as SVGSVGElement;
    }

    const selection = store.getSelection();
    const graph = rebuildGraph();
    const showParams = doc.metadata.showParams;
    const validation = adapter.validate(getCurrentAst());
    const invalidIds = collectInvalidElementIds(getCurrentAst());

    const layers = buildCircuitLayers(graph, {
      showParams,
      selectedNodeIds: selection.selectedNodeIds,
      invalidElementIds: validation.hasErrors ? invalidIds : undefined,
    });

    const connectionsEl = svg?.querySelector('#connections');
    const nodesEl = svg?.querySelector('#nodes');
    if (connectionsEl) connectionsEl.innerHTML = layers.connections;
    if (nodesEl) nodesEl.innerHTML = layers.nodes;

    emit('render', svg?.outerHTML ?? '');
  }

  function handleStoreEvent(event: { type: string; payload: unknown }): void {
    switch (event.type) {
      case 'ast-changed':
        emit('ast-changed', event.payload);
        emit('validation', validate(getCurrentAst()));
        syncContainer();
        break;
      case 'selection-changed':
        emit('selection-changed', event.payload);
        syncContainer();
        break;
      case 'viewport-changed':
        emit('viewport-changed', event.payload);
        syncContainer();
        break;
    }
  }

  function loadAst(ast: CircuitNode): void {
    store.dispatch({
      type: 'load-circuit',
      id: makeCommandId(),
      timestamp: Date.now(),
      description: 'Load circuit',
      ast,
    } as LoadCircuitCommand);
  }

  function makeNewElement(kind: ElementKind): CircuitNode {
    const currentAst = getCurrentAst();
    const nextId = generateNextElementId(currentAst, kind);
    const nextOffset = computeNextParamOffset(currentAst);
    return createElement(kind, nextId, nextOffset);
  }

  const instance: EditorInstance = {
    mount(el: HTMLElement, options?: EditorOptions): void {
      container = el;

      if (options?.initialDsl) {
        const result = adapter.parse(options.initialDsl);
        if ('error' in result) {
          emit('error', result.error);
          if (adapter.getOptions().blockInvalidSetValue) return;
        } else {
          loadAst(result.ast);
        }
      }

      if (options?.strict !== undefined) {
        store.dispatch({
          id: makeCommandId(),
          timestamp: Date.now(),
          description: 'Set strict mode',
          type: 'toggle-strict',
          strict: options.strict,
        });
        adapter.setOptions({ strict: options.strict });
      }

      if (options?.viewMode) {
        store.dispatch({
          id: makeCommandId(),
          timestamp: Date.now(),
          description: 'Set view mode',
          type: 'set-view-mode',
          viewMode: options.viewMode,
        });
      }

      if (options?.initialGridRows) {
        store.dispatch({
          id: makeCommandId(),
          timestamp: Date.now(),
          description: 'Set grid rows',
          type: 'set-grid-rows',
          rows: options.initialGridRows,
        });
      }

      if (options?.width !== undefined || options?.height !== undefined) {
        store.dispatch({
          type: 'viewport-change',
          panX: 0,
          panY: 0,
          zoom: 1,
          width: options.width ?? DEFAULT_WIDTH,
          height: options.height ?? DEFAULT_HEIGHT,
        });
      }

      // Register additional plugins from mount options
      if (options?.plugins) {
        for (const p of options.plugins) pluginRegistry.register(p);
      }

      // Install plugins FIRST so they create .ce-canvas, .ce-workspace, etc.
      pluginRegistry.installAll(instance, container);

      // NOW subscribe to store and do initial render (plugins have created DOM layers)
      unsubStore = store.subscribe(handleStoreEvent);
      syncContainer();
      emit('mount', container);
    },

    destroy(): void {
      pluginRegistry.destroyAll();
      if (unsubStore) {
        unsubStore();
        unsubStore = null;
      }
      if (container) container.innerHTML = '';
      container = null;
      listeners.clear();
      emit('destroy');
    },

    getValue(): string {
      const showParams = store.getDocument().metadata.showParams;
      return serialize(store.getAst(), { showParams });
    },
    
    getShowParams(): boolean {
      return store.getDocument().metadata.showParams;
    },

    setShowParams(show: boolean): void {
      store.dispatch({
        id: makeCommandId(),
        timestamp: Date.now(),
        description: `Toggle params ${show ? 'on' : 'off'}`,
        type: 'toggle-params',
        show,
      });
    },

    updateParams(targetId: string, params: number[]): void {
      store.dispatch({
        id: makeCommandId(),
        timestamp: Date.now(),
        description: `Update parameters for ${targetId}`,
        type: 'update-params',
        nodeId: targetId,
        params,
      });
    },

    setValue(dsl: string): void {
      const result = adapter.parse(dsl);
      if ('error' in result) {
        emit('error', result.error);
        if (adapter.getOptions().blockInvalidSetValue) return;
      }
      if ('ast' in result) loadAst(result.ast);
    },

    getDocument(): CircuitDocument {
      return store.getDocument();
    },

    dispatch(command: EditorCommand): void {
      store.dispatch(command);
      emit('command', command);
    },

    on,

    undo(): void {
      store.undo();
    },

    redo(): void {
      store.redo();
    },

    render(): string {
      return render();
    },

    // ──── High-level API ────

    insertElement(kind: ElementKind, mode?: InsertMode): void {
      const element = makeNewElement(kind);
      const resolvedMode = mode ?? insertMode;

      // If there's a selected element, insert relative to it
      if (selectedElementId) {
        const position = resolvedMode === 'parallel' ? 'parallel' : 'after';
        const newAst = position === 'parallel'
          ? addParallelToTarget(getCurrentAst(), selectedElementId, element)
          : insertAfterTarget(getCurrentAst(), selectedElementId, element);
        loadAst(newAst);
        return;
      }

      const currentAst = getCurrentAst();
      let newAst: CircuitNode;

      if (resolvedMode === 'parallel') {
        newAst = insertElementIntoParallel(currentAst, element);
      } else {
        newAst = insertElementIntoSeries(currentAst, element, -1);
      }

      loadAst(newAst);
    },

    deleteElement(targetId: string): void {
      const currentAst = getCurrentAst();
      const newAst = deleteElementRecursive(currentAst, targetId);
      if (selectedElementId === targetId) selectedElementId = null;
      loadAst(newAst);
    },

    wrapInParallel(targetId: string, kind: ElementKind): void {
      const element = makeNewElement(kind);
      const newAst = wrapInParallel(getCurrentAst(), targetId, element);
      loadAst(newAst);
    },

    wrapInSeries(targetId: string, kind: ElementKind, after = true): void {
      const element = makeNewElement(kind);
      const newAst = wrapInSeries(getCurrentAst(), targetId, element, after);
      loadAst(newAst);
    },

    getInsertMode(): InsertMode {
      return insertMode;
    },

    setInsertMode(mode: InsertMode): void {
      insertMode = mode;
    },

    getValidation(): ValidationResult {
      return validate(getCurrentAst());
    },

    getElementIds(): string[] {
      return collectElementIds(getCurrentAst());
    },

    // ──── Positional / contextual API ────

    insertRelative(targetId: string, kind: ElementKind, position: 'before' | 'after' | 'parallel'): void {
      const element = makeNewElement(kind);
      let newAst: CircuitNode;
      switch (position) {
        case 'before':
          newAst = insertBeforeTarget(getCurrentAst(), targetId, element);
          break;
        case 'after':
          newAst = insertAfterTarget(getCurrentAst(), targetId, element);
          break;
        case 'parallel':
          newAst = addParallelToTarget(getCurrentAst(), targetId, element);
          break;
      }
      loadAst(newAst);
    },

    moveLeft(targetId: string): void {
      const newAst = moveElementLeft(getCurrentAst(), targetId);
      loadAst(newAst);
    },

    moveRight(targetId: string): void {
      const newAst = moveElementRight(getCurrentAst(), targetId);
      loadAst(newAst);
    },

    changeElementKind(targetId: string, kind: ElementKind): void {
      const { ast: newAst, newElementId } = changeElementKindInAst(getCurrentAst(), targetId, kind);
      loadAst(newAst);
      selectedElementId = newElementId;
      emit('selection-changed', newElementId);
    },

    getContext(targetId: string): ParentContext {
      return getElementContext(getCurrentAst(), targetId);
    },

    select(elementId: string): void {
      selectedElementId = elementId;
      emit('selection-changed', elementId);
    },

    deselect(): void {
      selectedElementId = null;
      emit('selection-changed', null);
    },

    getSelectedId(): string | null {
      return selectedElementId;
    },

    getContainer(): HTMLElement | null {
      return container;
    },

    getStrict(): boolean {
      return store.getDocument().metadata.strict;
    },

    setStrict(strict: boolean): void {
      adapter.setOptions({ strict });
      store.dispatch({
        id: makeCommandId(),
        timestamp: Date.now(),
        description: `Strict mode ${strict ? 'on' : 'off'}`,
        type: 'toggle-strict',
        strict,
      });
      emit('validation', adapter.validate(getCurrentAst()));
    },

    getViewMode(): 'circuit' | 'grid' {
      return store.getDocument().metadata.viewMode;
    },

    setViewMode(mode: 'circuit' | 'grid'): void {
      store.dispatch({
        id: makeCommandId(),
        timestamp: Date.now(),
        description: `View mode ${mode}`,
        type: 'set-view-mode',
        viewMode: mode,
      });
      pluginRegistry.emit('view-mode-changed', mode);
      syncContainer();
    },

    getGridRows(): CircuitGridRow[] {
      return store.getDocument().gridRows ?? [];
    },

    setGridRows(rows: CircuitGridRow[]): void {
      store.dispatch({
        id: makeCommandId(),
        timestamp: Date.now(),
        description: 'Update grid rows',
        type: 'set-grid-rows',
        rows,
      });
    },

    fitView(): void {
      pluginRegistry.getPlugin<PanZoomPluginAPI>('pan-zoom')?.fitView();
    },

    resetView(): void {
      pluginRegistry.getPlugin<PanZoomPluginAPI>('pan-zoom')?.resetView();
    },
  };

  return instance;
}