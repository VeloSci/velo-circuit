import { useEffect, useRef, useCallback, type RefObject } from 'react';
import {
  createDslCodeMirror,
  type DslCodeMirrorHandle,
} from '../../core/index.js';
import { CircuitSyncLock, parseAstForDsl } from '../circuit-sync.js';
import type { ReactDslFieldProps } from './types.js';

export function useDslCodeMirror(options: ReactDslFieldProps): {
  /** Attach to any div — DSL field is self-contained */
  containerRef: RefObject<HTMLDivElement | null>;
  handleRef: RefObject<DslCodeMirrorHandle | null>;
  getValue: () => string;
  setValue: (dsl: string) => void;
} {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<DslCodeMirrorHandle | null>(null);
  const lock = useRef(new CircuitSyncLock());
  const onChangeRef = useRef(options.onChange);
  onChangeRef.current = options.onChange;
  const valueRef = useRef(options.value);
  valueRef.current = options.value;

  const mountKey = `${options.themeMode ?? 'light'}:${options.readOnly ? '1' : '0'}`;

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    parent.replaceChildren();
    const initial = valueRef.current ?? options.initialDsl ?? '';

    let handle: DslCodeMirrorHandle | null = null;
    handle = createDslCodeMirror({
      parent,
      initialValue: initial,
      getAst: () => parseAstForDsl(handle?.getValue() ?? ''),
      themeMode: options.themeMode ?? 'light',
      readOnly: options.readOnly,
      placeholder: options.placeholder,
      onDiagnostics: options.onDiagnostics,
      onChange: (dsl) => {
        if (lock.current.active) return;
        onChangeRef.current?.(dsl);
      },
    });

    handleRef.current = handle;

    return () => {
      handle.destroy();
      handleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mountKey]);

  useEffect(() => {
    if (options.value === undefined || !handleRef.current) return;
    if (options.value === handleRef.current.getValue()) return;
    lock.current.run(() => handleRef.current!.setValue(options.value!));
  }, [options.value]);

  const getValue = useCallback(() => handleRef.current?.getValue() ?? '', []);
  const setValue = useCallback((dsl: string) => {
    lock.current.run(() => handleRef.current?.setValue(dsl));
  }, []);

  return { containerRef, handleRef, getValue, setValue };
}
