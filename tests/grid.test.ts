import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createCircuitGrid } from '../src/core/grid/circuit-grid.js';
import { resetGridThemeInjectionForTests } from '../src/core/grid/grid-theme.js';

describe('createCircuitGrid', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    resetGridThemeInjectionForTests();
    document.getElementById('ce-grid-theme')?.remove();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('mounts SVG grid with rows', () => {
    const grid = createCircuitGrid({
      height: 400,
      rowHeight: 100,
      columns: [
        { id: 'dsl', label: 'DSL', type: 'dsl', width: 200 },
        { id: 'svg', label: 'SVG', type: 'svg', width: 150 },
      ],
      initialRows: [
        { id: 'r1', dsl: 'R0{50}' },
        { id: 'r2', dsl: 'R0-p(R1,C1)' },
      ],
    });
    grid.mount(container);
    expect(container.querySelector('svg.circuit-grid-root')).toBeTruthy();
    expect(container.classList.contains('circuit-grid-host')).toBe(true);
    expect(grid.getRows().length).toBe(2);
    grid.destroy();
  });

  it('addRow appends circuits', () => {
    const grid = createCircuitGrid({
      height: 300,
      rowHeight: 80,
      columns: [{ id: 'dsl', label: 'DSL', type: 'dsl', width: 200 }],
      initialRows: [],
    });
    grid.mount(container);
    grid.addRow({ dsl: 'Q0{1e-5,0.9}' });
    expect(grid.getRows().length).toBe(1);
    grid.destroy();
  });

  it('positions circuit preview inside the svg column cell', () => {
    const grid = createCircuitGrid({
      height: 320,
      rowHeight: 120,
      columns: [
        { id: 'label', label: 'Name', type: 'text', width: 80 },
        { id: 'svg', label: 'SVG', type: 'svg', width: 180 },
      ],
      initialRows: [{ id: 'r1', dsl: 'R0{50}-C1{1e-5}', meta: { label: 'RC' } }],
    });
    grid.mount(container);
    const preview = container.querySelector('.grid-cell-svg');
    expect(preview).toBeTruthy();
    const transform = preview?.getAttribute('transform') ?? '';
    expect(transform).toMatch(/translate\(90,/);
    grid.destroy();
  });

  it('shows parameter summary text for embedded values', () => {
    const grid = createCircuitGrid({
      height: 320,
      rowHeight: 100,
      columns: [{ id: 'params', label: 'Params', type: 'params', width: 220 }],
      initialRows: [{ id: 'r1', dsl: 'R0{100}-C1{1e-5}' }],
    });
    grid.mount(container);
    const text = container.querySelector('foreignObject div')?.textContent ?? '';
    expect(text).toContain('R0_R=');
    expect(text).toContain('C1_C=');
    expect(text).not.toBe('—');
    grid.destroy();
  });

  it('switches theme mode on the host element', () => {
    const grid = createCircuitGrid({
      height: 200,
      rowHeight: 80,
      columns: [{ id: 'dsl', label: 'DSL', type: 'dsl', width: 200 }],
      initialRows: [{ id: 'r1', dsl: 'R0' }],
      themeMode: 'light',
    });
    grid.mount(container);
    expect(container.classList.contains('ce-dark')).toBe(false);
    grid.setThemeMode('dark');
    expect(container.classList.contains('ce-dark')).toBe(true);
    grid.destroy();
  });
});
