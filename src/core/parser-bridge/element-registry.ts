import type { CircuitNode, ElementKind } from '../domain/circuit.js';
import { paramShortLabel } from '../domain/param-labels.js';
import { ELEMENT_KINDS, cloneNode, nParams, traverseNodes } from '../domain/circuit.js';

export interface ElementRegistryEntry {
  kind: ElementKind;
  id: number;
  paramOffset: number;
  nParams: number;
}

export class ElementRegistry {
  private entries: ElementRegistryEntry[];

  constructor(entries: ElementRegistryEntry[]) {
    this.entries = entries;
  }

  static fromCircuit(circuit: CircuitNode): ElementRegistry {
    const entries: ElementRegistryEntry[] = [];
    collectEntries(circuit, entries);
    entries.sort((a, b) => a.paramOffset - b.paramOffset);
    return new ElementRegistry(entries);
  }

  entriesList(): ElementRegistryEntry[] {
    return this.entries;
  }

  totalParams(): number {
    if (this.entries.length === 0) return 0;
    const last = this.entries[this.entries.length - 1];
    return last.paramOffset + last.nParams;
  }

  paramNames(): string[] {
    const names: string[] = [];
    for (const entry of this.entries) {
      for (let i = 0; i < entry.nParams; i++) {
        const short = paramShortLabel(entry.kind, i);
        names.push(`${entry.kind}${entry.id}_${short}`);
      }
    }
    return names;
  }

  flatParamVector(ast: CircuitNode): number[] {
    const out: number[] = [];
    traverseNodes(ast, (node) => {
      if (node.type === 'element' && node.params) {
        out.push(...node.params);
      }
    });
    return out;
  }
}

function collectEntries(node: CircuitNode, entries: ElementRegistryEntry[]): void {
  if (node.type === 'element') {
    entries.push({
      kind: node.kind,
      id: node.id,
      paramOffset: node.paramOffset,
      nParams: nParams(node.kind),
    });
    return;
  }
  if (node.type === 'series' || node.type === 'parallel') {
    for (const child of node.children) {
      collectEntries(child, entries);
    }
  }
}

/** Assign cumulative paramOffset in parse order (depth-first, left-to-right). */
export function assignParamOffsets(ast: CircuitNode): CircuitNode {
  let next = 0;

  function walk(node: CircuitNode): CircuitNode {
    if (node.type === 'element') {
      const offset = next;
      next += nParams(node.kind);
      return { ...node, paramOffset: offset };
    }
    if (node.type === 'series') {
      return { type: 'series', children: node.children.map(walk) };
    }
    if (node.type === 'parallel') {
      return { type: 'parallel', children: node.children.map(walk) };
    }
    return node;
  }

  return walk(ast);
}

export function parameterCount(ast: CircuitNode): number {
  return ElementRegistry.fromCircuit(ast).totalParams();
}
