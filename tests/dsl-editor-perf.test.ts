import { describe, it, expect } from 'vitest';
import { lintParseErrors, lintDslDocument } from '../src/core/parser-bridge/editor-validate.js';

const SAMPLE = 'R0{10}-p(R1{100},C1{1e-5})-Wo2{0.05,0.1}';

describe('editor-validate perf smoke', () => {
  it('hot parse lint completes quickly', () => {
    const start = performance.now();
    for (let i = 0; i < 50; i++) {
      lintParseErrors(SAMPLE);
    }
    const elapsed = performance.now() - start;
    expect(elapsed / 50).toBeLessThan(5);
  });

  it('full document lint completes quickly', () => {
    const start = performance.now();
    for (let i = 0; i < 20; i++) {
      lintDslDocument(SAMPLE);
    }
    const elapsed = performance.now() - start;
    expect(elapsed / 20).toBeLessThan(15);
  });
});
