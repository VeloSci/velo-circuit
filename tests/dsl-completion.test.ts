import { describe, it, expect } from 'vitest';
import { detectDslCompletionContext } from '../src/core/editor/dsl-completion-context.js';
import { buildCompletionsForContext, mergeExplicitFallback } from '../src/core/editor/dsl-completion.js';
import { ELEMENT_CODES_ORDERED } from '../src/core/editor/dsl-completion.js';

describe('detectDslCompletionContext', () => {
  it('detects series element after dash', () => {
    const text = 'R0{10}-';
    const ctx = detectDslCompletionContext(text, text.length);
    expect(ctx.kind).toBe('seriesElement');
  });

  it('detects parallel element after p(', () => {
    const text = 'R0-p(';
    const ctx = detectDslCompletionContext(text, text.length);
    expect(ctx.kind).toBe('parallelElement');
  });

  it('detects element prefix', () => {
    const text = 'R0-p(W';
    const ctx = detectDslCompletionContext(text, text.length);
    expect(ctx.kind).toBe('elementPrefix');
    expect(ctx.partial).toBe('W');
  });

  it('detects afterElement after closing brace', () => {
    const text = 'R0{10}';
    const ctx = detectDslCompletionContext(text, text.length);
    expect(ctx.kind).toBe('afterElement');
  });

  it('detects parallelComma after first branch', () => {
    const text = 'R0-p(R1{100}';
    const ctx = detectDslCompletionContext(text, text.length);
    expect(ctx.kind).toBe('parallelComma');
  });

  it('detects parallelClose after two branches', () => {
    const text = 'R0-p(R1{100},C1{1e-5}';
    const ctx = detectDslCompletionContext(text, text.length);
    expect(ctx.kind).toBe('parallelClose');
  });
});

describe('buildCompletionsForContext', () => {
  const emptyAst = () => ({ type: 'series' as const, children: [] });

  it('offers all element codes after dash', () => {
    const text = 'R0{10}-';
    const ctx = detectDslCompletionContext(text, text.length);
    const options = buildCompletionsForContext(ctx, text, text.length, emptyAst, true);
    expect(options.length).toBe(ELEMENT_CODES_ORDERED.length);
    expect(options.some(o => o.label?.startsWith('R'))).toBe(true);
    expect(options.some(o => o.label?.startsWith('HN'))).toBe(true);
    expect(options.every(o => o.type === 'text')).toBe(true);
    expect(options.every(o => (o as { kindCode?: string }).kindCode)).toBe(true);
  });

  it('offers series and parallel after element brace', () => {
    const text = 'R0{10}';
    const ctx = detectDslCompletionContext(text, text.length);
    const options = buildCompletionsForContext(ctx, text, text.length, emptyAst, true);
    const labels = options.map(o => o.label);
    expect(labels[0]).toBe('-');
    expect(labels).toContain('p(');
  });

  it('suggests comma before close after first parallel branch', () => {
    const text = 'R0-p(R1{100}';
    const ctx = detectDslCompletionContext(text, text.length);
    const options = buildCompletionsForContext(ctx, text, text.length, emptyAst, true);
    expect(options[0]?.label).toBe(',');
  });

  it('explicit Ctrl+Space mid-string still offers completions', () => {
    const text = 'R0{10}-p(R1{100},C1{1e-5})-Wo2';
    const pos = 8;
    expect(detectDslCompletionContext(text, pos).kind).toBe('none');
    const ctx = mergeExplicitFallback(text, pos);
    expect(ctx.kind).toBe('seriesElement');
    const options = buildCompletionsForContext(ctx, text, pos, emptyAst, true);
    expect(options.length).toBeGreaterThan(0);
  });
});
