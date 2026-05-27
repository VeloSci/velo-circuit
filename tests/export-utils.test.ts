import { describe, it, expect } from 'vitest';
import { sanitizeDslFilename } from '../src/core/editor/export-utils.js';

describe('sanitizeDslFilename', () => {
  it('keeps DSL characters and appends extension', () => {
    const dsl = 'R0{10}-p(R1{100},C1{1e-5})';
    expect(sanitizeDslFilename(dsl, 'svg')).toBe(`${dsl}.svg`);
  });

  it('strips invalid path characters', () => {
    expect(sanitizeDslFilename('R0/C1', 'txt')).toBe('R0C1.txt');
  });

  it('falls back when DSL is empty', () => {
    expect(sanitizeDslFilename('   ', 'dsl')).toBe('circuit.dsl');
  });
});
