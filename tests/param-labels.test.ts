import { describe, expect, it } from 'vitest';
import { ElementKind, ELEMENT_KINDS } from '../src/core/domain/circuit.js';
import { paramShortLabel, paramTitle } from '../src/core/domain/param-labels.js';

describe('param labels', () => {
  it('uses compact Greek labels for HN', () => {
    expect(paramShortLabel(ElementKind.HavriliakNegami, 0)).toBe('R');
    expect(paramShortLabel(ElementKind.HavriliakNegami, 1)).toBe('τ');
    expect(paramShortLabel(ElementKind.HavriliakNegami, 2)).toBe('α');
    expect(paramShortLabel(ElementKind.HavriliakNegami, 3)).toBe('β');
  });

  it('uses compact labels for diffusion and Warburg elements', () => {
    expect(paramShortLabel(ElementKind.WarburgInfinite, 0)).toBe('σ');
    expect(paramShortLabel(ElementKind.ParallelDiffusionWarburg, 2)).toBe('θ');
    expect(paramShortLabel(ElementKind.ParallelDiffusionWarburg, 3)).toBe('Λ');
  });

  it('keeps short labels at most two characters', () => {
    for (const def of ELEMENT_KINDS.values()) {
      for (const param of def.params) {
        expect(param.short.length).toBeLessThanOrEqual(2);
      }
    }
  });

  it('provides full titles for tooltips', () => {
    expect(paramTitle(ElementKind.HavriliakNegami, 1)).toContain('relaxation');
    expect(paramTitle(ElementKind.Cpe, 0)).toContain('CPE');
    expect(paramTitle(ElementKind.ParallelDiffusionWarburg, 3)).toContain('mol/cm³');
  });
});
