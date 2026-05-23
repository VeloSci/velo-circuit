import type { CircuitNode } from './circuit';

export interface Port {
  id: string;
  side: 'left' | 'right' | 'top' | 'bottom';
  x: number;
  y: number;
}

export interface ElementNode {
  nodeId: string;
  circuitNode: CircuitNode;
  visualX: number;
  visualY: number;
  width: number;
  height: number;
  ports: Port[];
}

export interface Connection {
  id: string;
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
}

export interface EditableGraph {
  nodes: Map<string, ElementNode>;
  connections: Connection[];
  rootNodeId: string | null;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function nodeBounds(node: ElementNode): Bounds {
  return {
    x: node.visualX,
    y: node.visualY,
    width: node.width,
    height: node.height,
  };
}

/** Hub where wires meet on empty parallel junction nodes (left/right split points). */
export function getJunctionHub(node: ElementNode, graph: EditableGraph): { x: number; y: number } {
  const usage = new Map<string, number>();
  for (const conn of graph.connections) {
    if (conn.fromNodeId === node.nodeId) {
      usage.set(conn.fromPortId, (usage.get(conn.fromPortId) ?? 0) + 1);
    }
    if (conn.toNodeId === node.nodeId) {
      usage.set(conn.toPortId, (usage.get(conn.toPortId) ?? 0) + 1);
    }
  }

  let hubPort = node.ports[0];
  let maxUse = -1;
  for (const port of node.ports) {
    const count = usage.get(port.id) ?? 0;
    if (count > maxUse) {
      maxUse = count;
      hubPort = port;
    }
  }

  if (maxUse <= 0 || !hubPort) {
    return { x: node.visualX + node.width / 2, y: node.visualY + node.height / 2 };
  }
  return { x: hubPort.x, y: hubPort.y };
}

export function emptyGraph(): EditableGraph {
  return { nodes: new Map(), connections: [], rootNodeId: null };
}