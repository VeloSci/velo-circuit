import { describe, it, expect } from 'vitest';
import { createEditor } from '../src/core/editor/index.js';
import { renderDslToSvg, validate } from '../src/core/index.js';

describe('editor', () => {
  it('creates an editor instance', () => {
    const editor = createEditor();
    expect(editor).toBeDefined();
    expect(typeof editor.mount).toBe('function');
    expect(typeof editor.destroy).toBe('function');
    expect(typeof editor.getValue).toBe('function');
    expect(typeof editor.setValue).toBe('function');
    expect(typeof editor.on).toBe('function');
    expect(typeof editor.undo).toBe('function');
    expect(typeof editor.redo).toBe('function');
  });

  it('starts with a default element', () => {
    const editor = createEditor();
    const dsl = editor.getValue();
    expect(dsl).toBeTruthy();
  });

  it('parses and renders a Boukamp string', () => {
    const editor = createEditor();
    editor.setValue('R0-p(R1,C1)-Wo2');
    const dsl = editor.getValue();
    expect(dsl).toBe('R0-p(R1,C1)-Wo2');
  });

  it('emits mount event when mounted', () => {
    const editor = createEditor();
    let mounted = false;
    editor.on('mount', () => { mounted = true; });

    const container = { innerHTML: '' } as unknown as HTMLElement;
    editor.mount(container);
    expect(mounted).toBe(true);
  });

  it('round-trips a valid DSL without losing info', () => {
    const editor = createEditor();
    editor.setValue('R0-C1-L2');
    const dsl = editor.getValue();
    expect(dsl).toBe('R0-C1-L2');
  });

  it('changeElementKind avoids duplicate ids and restores remembered kind id', () => {
    const editor = createEditor();
    editor.setValue('R0-p(R1,C1)-Wo2');
    editor.changeElementKind('R1', 'C' as import('../src/core/domain/circuit.js').ElementKind);
    expect(editor.getValue()).toContain('C2');
    expect(editor.getSelectedId()).toBe('C2');
    editor.changeElementKind('C2', 'R' as import('../src/core/domain/circuit.js').ElementKind);
    expect(editor.getValue()).toMatch(/R1[^0-9]|^R0-p\(R1,/);
    expect(editor.getSelectedId()).toBe('R1');
    const validation = editor.getValidation();
    expect(validation.hasErrors).toBe(false);
  });
});

describe('Standalone SVG API', () => {
  it('renderDslToSvg generates a valid cropped SVG string', () => {
    const res = validate('R1-C2');
    console.log('VALIDATION RESULT:', JSON.stringify(res, null, 2));

    const svg = renderDslToSvg('R1-C2');
    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox=');
    expect(svg).toContain('data-element-id="R1"');
    expect(svg).toContain('data-element-id="C2"');
  });

  it('renderDslToSvg handles invalid DSL gracefully', () => {
    const svg = renderDslToSvg('invalid:::');
    expect(svg).toBe('');
  });

  it('renderDslPreviewSvg omits editor chrome and uses curved wires by default', async () => {
    const { renderDslPreviewSvg } = await import('../src/core/render-svg/renderer-ex.js');
    const svg = renderDslPreviewSvg('R0-p(R1,C1)-W2', { themeMode: 'dark', colorMode: 'multicolor' });
    expect(svg).toContain('class="circuit-preview"');
    expect(svg).not.toContain('node-bg');
    expect(svg).not.toContain('node-hit');
    expect(svg).toMatch(/ C \d+ \d+ \d+ \d+ \d+ \d+/);
    expect(svg).toContain('--ce-R-stroke');
    expect(svg).toContain('data-element-id="C1"');
  });

  it('renderDslPreviewSvg supports orthogonal wires', async () => {
    const { renderDslPreviewSvg } = await import('../src/core/render-svg/renderer-ex.js');
    const svg = renderDslPreviewSvg('R0-p(R1,C1)-W2', { connectionStyle: 'orthogonal' });
    expect(svg).toMatch(/L \d+ \d+ L \d+ \d+ L \d+ \d+/);
    expect(svg).not.toMatch(/ C \d+ \d+ \d+ \d+ \d+ \d+/);
  });

  it('places junction dots at wire hub ports', async () => {
    const { parseBoukamp } = await import('../src/core/parser-bridge/index.js');
    const { buildLayout } = await import('../src/core/layout/index.js');
    const { getJunctionHub } = await import('../src/core/domain/graph.js');
    const { renderDslPreviewSvg } = await import('../src/core/render-svg/renderer-ex.js');

    const graph = buildLayout(parseBoukamp('R0-p(R1,C1)') as import('../src/core/domain/circuit.js').CircuitNode);
    const junctions = [...graph.nodes.values()].filter(
      n => n.circuitNode.type === 'parallel' && (n.circuitNode as { children?: unknown[] }).children?.length === 0,
    );
    expect(junctions.length).toBe(2);

    for (const junction of junctions) {
      const hub = getJunctionHub(junction, graph);
      const svg = renderDslPreviewSvg('R0-p(R1,C1)', { connectionStyle: 'orthogonal' });
      expect(svg).toContain(`cx="${hub.x}" cy="${hub.y}"`);
    }
  });
});