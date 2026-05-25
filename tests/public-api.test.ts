import { describe, it, expect } from 'vitest';
import {
  exportPreviewSvgWithStyles,
  getJunctionHub,
  parseBoukamp,
  buildLayout,
  renderDslPreviewSvg,
  litePlugins,
  resolvePlugins,
  type EditorPreset,
} from '../src/core/index.js';
import type { CircuitNode } from '../src/core/domain/circuit.js';

describe('public API exports', () => {
  it('exports preview helpers from the package entrypoint', () => {
    expect(typeof exportPreviewSvgWithStyles).toBe('function');
    expect(typeof getJunctionHub).toBe('function');
    expect(typeof renderDslPreviewSvg).toBe('function');
  });

  it('exports editor preset helpers from the package entrypoint', () => {
    expect(typeof litePlugins).toBe('function');
    expect(typeof resolvePlugins).toBe('function');
    const presets: EditorPreset[] = ['minimal', 'lite', 'extended'];
    for (const preset of presets) {
      expect(resolvePlugins(preset).length).toBeGreaterThan(0);
    }
  });

  it('getJunctionHub resolves wire convergence for parallel branches', () => {
    const ast = parseBoukamp('R0-p(R1,C1)') as CircuitNode;
    const graph = buildLayout(ast);
    const junctions = [...graph.nodes.values()].filter(
      (n) =>
        n.circuitNode.type === 'parallel' &&
        (n.circuitNode as { children?: unknown[] }).children?.length === 0,
    );
    expect(junctions.length).toBe(2);
    for (const junction of junctions) {
      const hub = getJunctionHub(junction, graph);
      expect(typeof hub.x).toBe('number');
      expect(typeof hub.y).toBe('number');
    }
  });
});
