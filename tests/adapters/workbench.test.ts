import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mountDslField,
  mountCircuitWorkbenchPair,
} from '../../src/adapters/composition.js';
import { mountDslCodeMirror, mountCircuitWorkbench } from '../../src/adapters/vanilla/workbench.js';
import { mountCircuitEditor } from '../../src/adapters/vanilla/index.js';

describe('vanilla composition', () => {
  let dslHost: HTMLElement;
  let editorHost: HTMLElement;

  beforeEach(() => {
    dslHost = document.createElement('div');
    editorHost = document.createElement('div');
    document.body.appendChild(dslHost);
    document.body.appendChild(editorHost);
  });

  afterEach(() => {
    dslHost.remove();
    editorHost.remove();
  });

  it('mountDslCodeMirror works standalone', () => {
    const field = mountDslCodeMirror({
      container: dslHost,
      initialDsl: 'R0-p(R1,C1)',
      themeMode: 'dark',
    });
    expect(field.getValue()).toBe('R0-p(R1,C1)');
    expect(dslHost.querySelector('.cm-editor')).toBeTruthy();
    field.destroy();
  });

  it('mountCircuitWorkbench keeps DSL and lite editor in sync', () => {
    let latest = '';
    const wb = mountCircuitWorkbench({
      dslContainer: dslHost,
      editorContainer: editorHost,
      initialDsl: 'R0',
      editorPreset: 'lite',
      themeMode: 'dark',
      onChange: (dsl) => { latest = dsl; },
    });

    expect(editorHost.querySelector('.ce-toolbar')).toBeNull();
    wb.setValue('R0-C1');
    expect(wb.getValue()).toBe('R0-C1');
    expect(latest).toBe('R0-C1');
    wb.destroy();
  });

  it('mountCircuitEditor respects themeMode dataset', () => {
    const editor = mountCircuitEditor({
      container: editorHost,
      preset: 'lite',
      initialDsl: 'R0',
      themeMode: 'dark',
    });
    expect(editorHost.classList.contains('ce-dark')).toBe(true);
    editor.destroy();
  });
});

describe('composition exports', () => {
  it('mountDslField and mountCircuitWorkbenchPair work from composition', () => {
    const dslHost = document.createElement('div');
    const editorHost = document.createElement('div');
    document.body.appendChild(dslHost);
    document.body.appendChild(editorHost);
    const field = mountDslField({ container: dslHost, initialDsl: 'R0' });
    expect(field.getValue()).toBe('R0');
    field.destroy();
    const wb = mountCircuitWorkbenchPair({
      dslContainer: dslHost,
      editorContainer: editorHost,
      initialDsl: 'R0',
      editorPreset: 'lite',
    });
    wb.destroy();
    dslHost.remove();
    editorHost.remove();
  });
});

describe('react adapter exports', () => {
  it('exports composition hooks', async () => {
    const mod = await import('../../src/adapters/react/index.js');
    expect(typeof mod.useDslCodeMirror).toBe('function');
    expect(typeof mod.useCircuitWorkbench).toBe('function');
    expect(typeof mod.useCircuitEditor).toBe('function');
  });
});
