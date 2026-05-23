import { describe, it, expect } from 'vitest';
import { parseBoukamp } from '../src/core/parser-bridge/parser.js';
import { serialize } from '../src/core/parser-bridge/serializer.js';
import { validate, validateParameterValues } from '../src/core/parser-bridge/validate.js';
import { ElementRegistry } from '../src/core/parser-bridge/element-registry.js';
import type { CircuitNode } from '../src/core/domain/circuit.js';

function isParseFailure(result: ReturnType<typeof parseBoukamp>): boolean {
  return 'type' in result && (result.type === 'lex' || result.type === 'parse');
}

function expectCircuit(dsl: string): CircuitNode {
  const result = parseBoukamp(dsl);
  if (isParseFailure(result)) throw new Error(`Parse failed: ${JSON.stringify(result)}`);
  return result as CircuitNode;
}

describe('brace parameter syntax', () => {
  it('parses R0{50}', () => {
    const ast = expectCircuit('R0{50}');
    expect(ast.type).toBe('element');
    if (ast.type === 'element') {
      expect(ast.params).toEqual([50]);
      expect(ast.paramOffset).toBe(0);
    }
  });

  it('parses Q0{5e-5,0.8}', () => {
    const ast = expectCircuit('Q0{5e-5,0.8}');
    if (ast.type === 'element') {
      expect(ast.params?.[0]).toBeCloseTo(5e-5);
      expect(ast.params?.[1]).toBe(0.8);
    }
  });

  it('serializes with brace format by default', () => {
    const ast = expectCircuit('R0{50}-Q1{5e-5,0.8}');
    const dsl = serialize(ast, { showParams: true });
    expect(dsl).toContain('R0{50}');
    expect(dsl).toContain('Q1{');
  });

  it('accepts bracket alias R0[50]', () => {
    const ast = expectCircuit('R0[50]');
    if (ast.type === 'element') expect(ast.params).toEqual([50]);
  });
});

describe('CC and HN elements', () => {
  it('parses Cole-Cole CC1{50,1e-3,0.8}', () => {
    const ast = expectCircuit('R0{50}-CC1{50,1e-3,0.8}');
    const registry = ElementRegistry.fromCircuit(ast);
    expect(registry.totalParams()).toBe(4);
  });

  it('parses Havriliak-Negami HN1{50,1e-3,0.8,0.9}', () => {
    const ast = expectCircuit('R0-HN1{50,1e-3,0.8,0.9}');
    const registry = ElementRegistry.fromCircuit(ast);
    expect(registry.totalParams()).toBe(5);
  });

  it('validates CC alpha bounds', () => {
    const ast = expectCircuit('CC0{10,1e-3,0.2}');
    const result = validate(ast);
    expect(result.hasErrors).toBe(true);
  });

  it('validates HN beta bounds', () => {
    const ast = expectCircuit('HN0{10,1e-3,0.8,1.5}');
    const result = validate(ast);
    expect(result.hasErrors).toBe(true);
  });
});

describe('ElementRegistry paramOffset', () => {
  it('assigns cumulative offsets in parse order', () => {
    const ast = expectCircuit('R0{10}-p(R1{100},C1{1e-5})');
    const registry = ElementRegistry.fromCircuit(ast);
    const entries = registry.entriesList();
    expect(entries.length).toBe(3);
    expect(entries[0].paramOffset).toBe(0);
    expect(entries[1].paramOffset).toBe(1);
    expect(entries[2].paramOffset).toBe(2);
  });
});

describe('strict validation mode', () => {
  it('promotes no-dc-path warning to error in strict mode', () => {
    const ast = expectCircuit('C0-L1');
    const normal = validate(ast);
    expect(normal.hasWarnings).toBe(true);
    const strict = validate(ast, { strict: true });
    expect(strict.hasErrors).toBe(true);
  });

  it('validateParameterValues checks flat vector', () => {
    const ast = expectCircuit('R0{50}-Q1{5e-5,0.8}');
    const ok = validateParameterValues(ast, [50, 5e-5, 0.8]);
    expect(ok.hasErrors).toBe(false);
    const bad = validateParameterValues(ast, [50, 5e-5, 1.5]);
    expect(bad.hasErrors).toBe(true);
  });
});

describe('round-trip with params', () => {
  const cases = [
    'R0{50}',
    'Q0{5e-5,0.8}',
    'R0{10}-p(R1{100},C1{1e-5})',
    'R0{50}-CC1{50,1e-3,0.8}',
  ];

  for (const dsl of cases) {
    it(`round-trips ${dsl}`, () => {
      const ast = parseBoukamp(dsl);
      expect(isParseFailure(ast)).toBe(false);
      const out = serialize(ast as CircuitNode, { showParams: true });
      const ast2 = parseBoukamp(out);
      expect(isParseFailure(ast2)).toBe(false);
    });
  }
});
