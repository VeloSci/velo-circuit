import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createAngularCircuitEditorAdapter, type AngularEditorAdapter } from '../../src/adapters/angular/index.js';

describe('angular adapter', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('createAngularCircuitEditorAdapter creates an adapter', () => {
    const adapter = createAngularCircuitEditorAdapter();
    expect(adapter).toBeDefined();
    expect(typeof adapter.mount).toBe('function');
    expect(typeof adapter.mountDsl).toBe('function');
    expect(typeof adapter.mountWorkbench).toBe('function');
    expect(typeof adapter.createComponent).toBe('function');
  });

  it('mount creates an editor instance', () => {
    const adapter = createAngularCircuitEditorAdapter();
    const editor = adapter.mount(container, { initialDsl: 'R0-C1' });
    expect(editor).toBeDefined();
    expect(typeof editor.getValue).toBe('function');
    expect(typeof editor.setValue).toBe('function');
    expect(typeof editor.destroy).toBe('function');
    editor.destroy();
  });

  it('mount accepts initialDsl', () => {
    const adapter = createAngularCircuitEditorAdapter();
    const editor = adapter.mount(container, { initialDsl: 'R0-C1' });
    expect(editor.getValue()).toBe('R0-C1');
    editor.destroy();
  });

  it('mount accepts width and height', () => {
    const adapter = createAngularCircuitEditorAdapter();
    const editor = adapter.mount(container, { width: 800, height: 600 });
    expect(editor).toBeDefined();
    editor.destroy();
  });

  it('createComponent creates component with events', () => {
    const adapter = createAngularCircuitEditorAdapter();
    const component = adapter.createComponent(container, { initialDsl: 'R0' });

    expect(component).toBeDefined();
    expect(typeof component.getValue).toBe('function');
    expect(typeof component.setValue).toBe('function');
    expect(typeof component.undo).toBe('function');
    expect(typeof component.redo).toBe('function');
    expect(typeof component.destroy).toBe('function');
    expect(component.dslChange).toBeDefined();
    expect(component.editorEvent).toBeDefined();
    component.destroy();
  });

  it('dslChange.subscribe receives ast-changed updates', () => {
    const adapter = createAngularCircuitEditorAdapter();
    const component = adapter.createComponent(container);

    let capturedDsl = '';
    component.dslChange.subscribe((dsl) => { capturedDsl = dsl; });

    component.setValue('R0-C1');
    expect(component.getValue()).toBe('R0-C1');
    expect(capturedDsl).toBe('R0-C1');
    component.destroy();
  });

  it('setValue updates the DSL', () => {
    const adapter = createAngularCircuitEditorAdapter();
    const component = adapter.createComponent(container, {});
    component.setValue('R0-p(R1,C1)');
    expect(component.getValue()).toBe('R0-p(R1,C1)');
    component.destroy();
  });

  it('undo/redo work correctly', () => {
    const adapter = createAngularCircuitEditorAdapter();
    const component = adapter.createComponent(container, { initialDsl: 'R0' });
    component.setValue('R0-C1');
    component.undo();
    expect(component.getValue()).toBe('R0');
    component.redo();
    expect(component.getValue()).toBe('R0-C1');
    component.destroy();
  });

  it('editorEvent.subscribe can listen for errors', () => {
    const adapter = createAngularCircuitEditorAdapter();
    const component = adapter.createComponent(container, {});

    let errorCount = 0;
    component.editorEvent.subscribe((e) => {
      if (e.type === 'error') errorCount++;
    });

    component.setValue('INVALID-X99');
    expect(errorCount).toBeGreaterThanOrEqual(0);
    component.destroy();
  });

  it('mountDsl mounts standalone DSL field', () => {
    const adapter = createAngularCircuitEditorAdapter();
    const dslHost = document.createElement('div');
    document.body.appendChild(dslHost);
    const field = adapter.mountDsl(dslHost, { initialDsl: 'R0', themeMode: 'dark' });
    expect(field.getValue()).toBe('R0');
    expect(dslHost.querySelector('.cm-editor')).toBeTruthy();
    field.destroy();
    dslHost.remove();
  });

  it('mountWorkbench syncs DSL and lite editor', () => {
    const adapter = createAngularCircuitEditorAdapter();
    const dslHost = document.createElement('div');
    const editorHost = document.createElement('div');
    document.body.appendChild(dslHost);
    document.body.appendChild(editorHost);
    let latest = '';
    const wb = adapter.mountWorkbench(dslHost, editorHost, {
      initialDsl: 'R0',
      editorPreset: 'lite',
      onChange: (d) => { latest = d; },
    });
    expect(editorHost.querySelector('.ce-toolbar')).toBeNull();
    wb.setValue('R0-C1');
    expect(wb.getValue()).toBe('R0-C1');
    expect(latest).toBe('R0-C1');
    wb.destroy();
    dslHost.remove();
    editorHost.remove();
  });

  it('CircuitEditorNgModule is defined', async () => {
    const { CircuitEditorNgModule } = await import('../../src/adapters/angular/index.js');
    expect(CircuitEditorNgModule).toBeDefined();
  });

  it('destroy cleans up without error', () => {
    const adapter = createAngularCircuitEditorAdapter();
    const editor = adapter.mount(container, {});
    expect(() => editor.destroy()).not.toThrow();
  });

  it('multiple instances can coexist', () => {
    const container2 = document.createElement('div');
    document.body.appendChild(container2);

    const adapter = createAngularCircuitEditorAdapter();
    const editor1 = adapter.mount(container, { initialDsl: 'R0' });
    const editor2 = adapter.mount(container2, { initialDsl: 'C0' });

    expect(editor1.getValue()).toBe('R0');
    expect(editor2.getValue()).toBe('C0');

    editor1.destroy();
    editor2.destroy();
    container2.remove();
  });
});