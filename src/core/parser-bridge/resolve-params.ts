import type { CircuitNode } from '../domain/circuit.js';
import { ELEMENT_KINDS, nParams, traverseNodes } from '../domain/circuit.js';
import { ElementRegistry } from './element-registry.js';

export type ParamSource = 'dsl' | 'ast' | 'external';

export interface MissingElementParams {
  kind: string;
  id: number;
  paramOffset: number;
  missingLabels: string[];
}

export type ResolveParamsResult =
  | { ok: true; params: number[]; sources: ParamSource[] }
  | { ok: false; missing: MissingElementParams[] };

export interface ResolveParamsOptions {
  external?: number[];
}

function slotValue(
  node: Extract<CircuitNode, { type: 'element' }>,
  index: number,
  external: number[] | undefined,
): { value?: number; source?: ParamSource } {
  const embedded = node.embedded?.[index];
  if (embedded != null && Number.isFinite(embedded)) {
    return { value: embedded, source: 'dsl' };
  }
  const visual = node.params?.[index];
  if (visual != null && Number.isFinite(visual)) {
    return { value: visual, source: 'ast' };
  }
  const ext = external?.[node.paramOffset + index];
  if (ext != null && Number.isFinite(ext)) {
    return { value: ext, source: 'external' };
  }
  return {};
}

export function resolveCircuitParams(
  ast: CircuitNode,
  options: ResolveParamsOptions = {},
): ResolveParamsResult {
  const registry = ElementRegistry.fromCircuit(ast);
  const total = registry.totalParams();
  const params = new Array<number>(total).fill(Number.NaN);
  const sources = new Array<ParamSource>(total).fill('external');
  const missing: MissingElementParams[] = [];
  const external = options.external;

  traverseNodes(ast, node => {
    if (node.type !== 'element') return;
    const expected = nParams(node.kind);
    const def = ELEMENT_KINDS.get(node.kind);
    const missingLabels: string[] = [];

    for (let i = 0; i < expected; i++) {
      const global = node.paramOffset + i;
      const resolved = slotValue(node, i, external);
      if (resolved.value != null) {
        params[global] = resolved.value;
        sources[global] = resolved.source ?? 'external';
      } else {
        const label = def?.params[i]?.short ?? `p${i}`;
        missingLabels.push(label);
      }
    }

    if (missingLabels.length > 0) {
      missing.push({
        kind: node.kind,
        id: node.id,
        paramOffset: node.paramOffset,
        missingLabels,
      });
    }
  });

  if (missing.length > 0) {
    return { ok: false, missing };
  }
  return { ok: true, params, sources };
}

export function formatMissingParams(missing: MissingElementParams[]): string {
  return missing
    .map(m => `${m.kind}${m.id}: missing ${m.missingLabels.join(', ')}`)
    .join('; ');
}
