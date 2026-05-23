import { describe, expect, it } from 'vitest';
import { ElementKind } from '../src/core/domain/circuit.js';
import { buildSvgElementSymbol, DEFAULT_THEME, SYMBOL_STROKE_WIDTH } from '../src/core/render-svg/symbols.js';

const ALL_KINDS = [
  ElementKind.Resistor,
  ElementKind.Capacitor,
  ElementKind.Inductor,
  ElementKind.Cpe,
  ElementKind.WarburgInfinite,
  ElementKind.WarburgShort,
  ElementKind.WarburgOpen,
  ElementKind.Gerischer,
  ElementKind.ParallelDiffusionWarburg,
  ElementKind.ColeCole,
  ElementKind.HavriliakNegami,
];

describe('buildSvgElementSymbol', () => {
  it('uses unified base stroke width', () => {
    expect(DEFAULT_THEME.strokeWidth).toBe(SYMBOL_STROKE_WIDTH);
  });

  for (const kind of ALL_KINDS) {
    it(`renders ${kind} with terminals at x=0 and x=80`, () => {
      const svg = buildSvgElementSymbol(kind, DEFAULT_THEME);
      expect(svg).toMatch(/(?:0,20|x1="0" y1="20")/);
      expect(svg).toMatch(/(?:80,20|x2="80" y2="20")/);
    });

    it(`renders ${kind} without box rects (outline family)`, () => {
      const svg = buildSvgElementSymbol(kind, DEFAULT_THEME);
      expect(svg).not.toContain('<rect');
    });
  }

  it('CC and HN use dispersion arcs instead of boxes', () => {
    const cc = buildSvgElementSymbol(ElementKind.ColeCole, DEFAULT_THEME);
    const hn = buildSvgElementSymbol(ElementKind.HavriliakNegami, DEFAULT_THEME);
    expect(cc).toContain('<path');
    expect(cc).not.toContain('<rect');
    expect(hn).toContain('<path');
    expect(hn).not.toContain('<rect');
  });

  it('Resistor is one continuous polyline with round joins', () => {
    const svg = buildSvgElementSymbol(ElementKind.Resistor, DEFAULT_THEME);
    expect(svg).toMatch(/<polyline[^>]*points="0,20[^"]*68,20 80,20"/);
    expect(svg).toContain('stroke-linejoin="round"');
    expect(svg).toContain('stroke-linecap="round"');
    expect(svg).not.toMatch(/<line[^>]*x1="0"/);
  });

  it('Capacitor leads touch both plates', () => {
    const svg = buildSvgElementSymbol(ElementKind.Capacitor, DEFAULT_THEME);
    expect(svg).toContain('x2="36" y2="20"');
    expect(svg).toContain('x1="44" y1="20" x2="80"');
  });

  it('Warburg family uses continuous paths without separate lines', () => {
    for (const kind of [
      ElementKind.WarburgInfinite,
      ElementKind.WarburgShort,
      ElementKind.WarburgOpen,
      ElementKind.Gerischer,
      ElementKind.ParallelDiffusionWarburg,
    ]) {
      const svg = buildSvgElementSymbol(kind, DEFAULT_THEME);
      expect(svg).toMatch(/<path d="M0,20/);
      expect(svg).not.toMatch(/<line/);
      expect(svg).toContain('stroke-linejoin="round"');
    }
  });

  it('Warburg W, Ws, and Wo have distinct geometry', () => {
    const w = buildSvgElementSymbol(ElementKind.WarburgInfinite, DEFAULT_THEME);
    const ws = buildSvgElementSymbol(ElementKind.WarburgShort, DEFAULT_THEME);
    const wo = buildSvgElementSymbol(ElementKind.WarburgOpen, DEFAULT_THEME);
    expect(w).not.toBe(ws);
    expect(w).not.toBe(wo);
    expect(ws).not.toBe(wo);
    expect(w).not.toContain('L54,32');
    expect(ws).toContain('L54,32');
    expect(wo).toContain('M46,32');
    expect(wo).not.toContain('L54,32');
  });

  it('CC and HN use smooth arcs without zig-zag lead-ins', () => {
    const cc = buildSvgElementSymbol(ElementKind.ColeCole, DEFAULT_THEME);
    const hn = buildSvgElementSymbol(ElementKind.HavriliakNegami, DEFAULT_THEME);
    expect(cc).toMatch(/A20,14/);
    expect(cc).not.toMatch(/L24,28/);
    expect(hn).toMatch(/A20,14/);
    expect(hn).toMatch(/A14,8/);
  });

  it('Gerischer is outline (no filled box)', () => {
    const g = buildSvgElementSymbol(ElementKind.Gerischer, DEFAULT_THEME);
    expect(g).not.toContain('<rect');
  });
});
