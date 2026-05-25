import type { CircuitNode } from '../domain/circuit.js';
import { nParams } from '../domain/circuit.js';

export interface SerializeOptions {
  showParams?: boolean;
  /** Canonical brace `{...}` or legacy bracket `[...]`. Default: brace. */
  paramFormat?: 'brace' | 'bracket';
}

function formatParamValue(v: number): string {
  if (Math.abs(v) >= 1e4 || (Math.abs(v) > 0 && Math.abs(v) < 1e-3)) {
    return v.toExponential(4).replace(/e\+?0*/, 'e');
  }
  return String(v);
}

function formatParams(values: (number | null | undefined)[], format: 'brace' | 'bracket'): string {
  const inner = values
    .map(v => (v != null && Number.isFinite(v) ? formatParamValue(v) : ''))
    .join(',');
  return format === 'bracket' ? `[${inner}]` : `{${inner}}`;
}

function elementParamValues(node: Extract<CircuitNode, { type: 'element' }>): (number | null | undefined)[] {
  const n = nParams(node.kind);
  const out: (number | null | undefined)[] = new Array(n).fill(undefined);
  if (node.embedded) {
    for (let i = 0; i < n; i++) out[i] = node.embedded[i] ?? null;
  }
  if (node.params) {
    for (let i = 0; i < n; i++) {
      const v = node.params[i];
      if (v != null && Number.isFinite(v)) out[i] = v;
    }
  }
  return out;
}

export function serialize(ast: CircuitNode, options?: SerializeOptions): string {
  const paramFormat = options?.paramFormat ?? 'brace';

  switch (ast.type) {
    case 'element': {
      let str = `${ast.kind}${ast.id}`;
      if (options?.showParams) {
        const values = elementParamValues(ast);
        if (values.some(v => v != null && Number.isFinite(v as number)) || values.some(v => v === null)) {
          str += formatParams(values, paramFormat);
        }
      }
      return str;
    }
    case 'series':
      if (ast.children.length === 0) return '';
      if (ast.children.length === 1) return serialize(ast.children[0], options);
      return ast.children.map(c => serialize(c, options)).join('-');
    case 'parallel': {
      if (ast.children.length === 0) return '';
      if (ast.children.length === 1) return serialize(ast.children[0], options);
      const inner = ast.children.map(child => serialize(child, options)).join(',');
      return `p(${inner})`;
    }
    default:
      return '';
  }
}
