import type { Action } from 'svelte/action';
import { mountDslField, type DslFieldMountOptions } from '../composition.js';
import type { ThemeMode } from '../../core/render-svg/themes.js';
import type { Diagnostic } from '../../core/domain/diagnostics.js';

export interface SvelteDslFieldOptions {
  value?: string;
  initialDsl?: string;
  themeMode?: ThemeMode;
  readOnly?: boolean;
  placeholder?: string;
  onChange?: (dsl: string) => void;
  onDiagnostics?: (issues: Diagnostic[]) => void;
}

type DslFieldInstance = ReturnType<typeof mountDslField>;

export const dslCodeMirror: Action<HTMLElement, SvelteDslFieldOptions | undefined> = (node, options = {}) => {
  let field = createField(node, options);

  return {
    update(newOptions: SvelteDslFieldOptions = {}) {
      if (newOptions.value !== undefined && newOptions.value !== field.getValue()) {
        field.setValue(newOptions.value);
        return;
      }
      if (
        newOptions.themeMode !== options.themeMode ||
        newOptions.readOnly !== options.readOnly
      ) {
        field.destroy();
        options = newOptions;
        field = createField(node, options);
      }
    },
    destroy() {
      field.destroy();
    },
  };
};

function createField(node: HTMLElement, options: SvelteDslFieldOptions): DslFieldInstance {
  return mountDslField({
    container: node,
    initialDsl: options.value ?? options.initialDsl,
    themeMode: options.themeMode,
    readOnly: options.readOnly,
    placeholder: options.placeholder,
    onChange: (dsl) => {
      options.onChange?.(dsl);
      node.dispatchEvent(new CustomEvent('change', { detail: dsl, bubbles: true }));
    },
    onDiagnostics: options.onDiagnostics,
  });
}
