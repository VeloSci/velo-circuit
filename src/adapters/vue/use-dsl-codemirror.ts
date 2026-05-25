import { ref, watch, onMounted, onBeforeUnmount, type Ref } from 'vue';
import { createDslCodeMirror, type DslCodeMirrorHandle } from '../../core/index.js';
import { CircuitSyncLock, parseAstForDsl } from '../circuit-sync.js';
import type { ThemeMode } from '../../core/render-svg/themes.js';
import type { Diagnostic } from '../../core/domain/diagnostics.js';

export interface VueDslFieldOptions {
  value?: Ref<string>;
  initialDsl?: string;
  themeMode?: ThemeMode;
  readOnly?: boolean;
  placeholder?: string;
  onDslChange?: (dsl: string) => void;
  onDiagnostics?: (issues: Diagnostic[]) => void;
}

export function useDslCodeMirror(options: VueDslFieldOptions): {
  containerRef: Ref<HTMLElement | null>;
  handleRef: Ref<DslCodeMirrorHandle | null>;
} {
  const containerRef = ref<HTMLElement | null>(null);
  const handleRef = ref<DslCodeMirrorHandle | null>(null);
  const lock = new CircuitSyncLock();

  function mountField() {
    const parent = containerRef.value;
    if (!parent) return;
    parent.replaceChildren();
    handleRef.value?.destroy();

    let handle: DslCodeMirrorHandle | null = null;
    const initial = options.value?.value ?? options.initialDsl ?? '';
    handle = createDslCodeMirror({
      parent,
      initialValue: initial,
      getAst: () => parseAstForDsl(handle?.getValue() ?? ''),
      themeMode: options.themeMode ?? 'light',
      readOnly: options.readOnly,
      placeholder: options.placeholder,
      onDiagnostics: options.onDiagnostics,
      onChange: (dsl) => {
        if (lock.active) return;
        options.onDslChange?.(dsl);
        if (options.value) options.value.value = dsl;
      },
    });
    handleRef.value = handle;
  }

  onMounted(mountField);
  onBeforeUnmount(() => {
    handleRef.value?.destroy();
    handleRef.value = null;
  });

  watch(
    () => [options.themeMode, options.readOnly] as const,
    () => mountField(),
  );

  if (options.value) {
    watch(options.value, (next) => {
      if (!handleRef.value || next === handleRef.value.getValue()) return;
      lock.run(() => handleRef.value!.setValue(next));
    });
  }

  return { containerRef, handleRef };
}
