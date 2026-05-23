import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createCircuitGrid } from '../src/core/grid/circuit-grid.js';

describe('createCircuitGrid', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
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
});
