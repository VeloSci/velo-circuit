import type { CircuitNode } from '../domain/circuit.js';

export interface SerializeOptions {
  showParams?: boolean;
  /** Canonical brace `{...}` or legacy bracket `[...]`. Default: brace. */
  paramFormat?: 'brace' | 'bracket';
}

function formatParams(params: number[], format: 'brace' | 'bracket'): string {
  const inner = params.join(',');
  return format === 'bracket' ? `[${inner}]` : `{${inner}}`;
}

export function serialize(ast: CircuitNode, options?: SerializeOptions): string {
  const paramFormat = options?.paramFormat ?? 'brace';

  switch (ast.type) {
    case 'element': {
      let str = `${ast.kind}${ast.id}`;
      if (options?.showParams && ast.params && ast.params.length > 0) {
        str += formatParams(ast.params, paramFormat);
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
