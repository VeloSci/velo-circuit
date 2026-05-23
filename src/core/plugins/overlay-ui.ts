import type { CircuitNode } from '../domain/circuit.js';
import type { ElementNode } from '../domain/graph.js';
import { buildLayout } from '../layout/layout-engine.js';

/** Plugin bus: hide contextual HTML overlays during canvas interaction. */
export const HIDE_FLOATING_UI = 'hide-floating-ui';
/** Plugin bus: canvas pan/zoom settled — overlays may reappear. */
export const WORKSPACE_SETTLED = 'workspace-settled';

export function findElementLayout(ast: CircuitNode, elementId: string): ElementNode | null {
  const graph = buildLayout(ast);
  for (const node of graph.nodes.values()) {
    const circuit = node.circuitNode;
    if (circuit.type === 'element' && `${circuit.kind}${circuit.id}` === elementId) {
      return node;
    }
  }
  return null;
}

export function isOverlayUiTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest('.ce-sel-panel, .ce-element-picker, .ce-ctx-menu, foreignObject.ce-sel-panel, .ce-st-id-btn'),
  );
}
