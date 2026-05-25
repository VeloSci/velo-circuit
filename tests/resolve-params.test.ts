import { describe, it, expect } from 'vitest';
import { parseBoukamp } from '../src/core/parser-bridge/parser.js';
import { resolveCircuitParams, formatMissingParams } from '../src/core/parser-bridge/resolve-params.js';
import type { CircuitNode } from '../src/core/domain/circuit.js';

function isParseFailure(result: ReturnType<typeof parseBoukamp>): boolean {
  return 'type' in result && (result.type === 'lex' || result.type === 'parse');
}

function expectCircuit(dsl: string): CircuitNode {
  const result = parseBoukamp(dsl);
  if (isParseFailure(result)) throw new Error(JSON.stringify(result));
  return result as CircuitNode;
}

describe('resolveCircuitParams', () => {
  it('uses embedded DSL values first', () => {
    const ast = expectCircuit('R0{50}-Q1{1e-3,0.85}');
    const resolved = resolveCircuitParams(ast);
    expect(resolved.ok).toBe(true);
    if (resolved.ok) {
      expect(resolved.params[0]).toBe(50);
      expect(resolved.params[1]).toBeCloseTo(1e-3);
      expect(resolved.params[2]).toBe(0.85);
    }
  });

  it('falls back to external vector', () => {
    const ast = expectCircuit('R0-p(R1,C1{1e-9})');
    const resolved = resolveCircuitParams(ast, { external: [100, 200, 1e-9] });
    expect(resolved.ok).toBe(true);
    if (resolved.ok) {
      expect(resolved.params[0]).toBe(100);
      expect(resolved.params[1]).toBe(200);
      expect(resolved.params[2]).toBeCloseTo(1e-9);
    }
  });

  it('reports missing elements without fallback', () => {
    const ast = expectCircuit('R0-p(R1,C1)');
    const resolved = resolveCircuitParams(ast);
    expect(resolved.ok).toBe(false);
    if (!resolved.ok) {
      expect(resolved.missing.length).toBe(3);
      expect(formatMissingParams(resolved.missing)).toContain('R0');
    }
  });

  it('parses partial embedded slots', () => {
    const ast = expectCircuit('Q1{1e-3,}');
    const resolved = resolveCircuitParams(ast, { external: [0, 0.5] });
    expect(resolved.ok).toBe(true);
    if (resolved.ok) {
      expect(resolved.params[0]).toBeCloseTo(1e-3);
      expect(resolved.params[1]).toBe(0.5);
    }
  });
});
