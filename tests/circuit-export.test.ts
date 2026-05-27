import { describe, it, expect } from 'vitest';
import { parseBoukamp } from '../src/core/parser-bridge/parser.js';
import { buildDownloadCircuitSvg, serializeAstForExport } from '../src/core/editor/circuit-export.js';

describe('circuit export', () => {
  const parsed = parseBoukamp('R0-p(R1,C1)');
  if ('type' in parsed && (parsed.type === 'lex' || parsed.type === 'parse')) {
    throw new Error(parsed.message);
  }
  const ast = parsed;

  it('buildDownloadCircuitSvg uses light transparent preview by default', () => {
    const dsl = serializeAstForExport(ast, true);
    const svg = buildDownloadCircuitSvg(dsl);
    expect(svg).toContain('class="circuit-preview"');
    expect(svg).toContain('background: transparent');
    expect(svg).not.toContain('background-color: #0f172a');
  });

  it('serializeAstForExport can omit parameters', () => {
    expect(serializeAstForExport(ast, false)).toBe('R0-p(R1,C1)');
    expect(serializeAstForExport(ast, true)).toBe('R0-p(R1,C1)');
  });
});
