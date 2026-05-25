import { EditorState, type Extension } from '@codemirror/state';
import {
  EditorView,
  keymap,
  placeholder,
  drawSelection,
  highlightActiveLine,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { linter, lintGutter, type Diagnostic as LintDiagnostic } from '@codemirror/lint';
import {
  autocompletion,
  completionKeymap,
  type CompletionContext,
  type CompletionResult,
} from '@codemirror/autocomplete';
import type { CircuitNode } from '../domain/circuit.js';
import type { Diagnostic } from '../domain/diagnostics.js';
import { nParams, elementKindFromCode } from '../domain/circuit.js';
import { parseBoukamp } from '../parser-bridge/parser.js';
import { buildAstDiagnostics } from '../parser-bridge/diagnostics-builder.js';
import { generateNextElementId } from './commands-builder.js';

const ELEMENT_CODES = ['Pdw', 'Ws', 'Wo', 'CC', 'HN', 'R', 'C', 'L', 'Q', 'W', 'G'];

export interface DslCodeMirrorOptions {
  parent: HTMLElement;
  initialValue: string;
  getAst: () => CircuitNode;
  onChange: (value: string) => void;
  onDiagnostics?: (diagnostics: Diagnostic[]) => void;
}

export interface DslCodeMirrorHandle {
  setValue(text: string): void;
  getValue(): string;
  destroy(): void;
  focus(): void;
}

function nParamsFromCode(code: string): number {
  const kind = elementKindFromCode(code);
  return kind ? nParams(kind) : 1;
}

function paramTemplate(n: number): string {
  if (n <= 1) return '{}';
  return `{${','.repeat(n - 1)}}`;
}

function createDslLinter(): Extension {
  return linter(view => {
    const text = view.state.doc.toString();
    if (!text.trim()) return [];

    const parsed = parseBoukamp(text);
    if ('type' in parsed && (parsed.type === 'lex' || parsed.type === 'parse')) {
      const from = parsed.position;
      return [{
        from,
        to: Math.min(from + 1, text.length),
        severity: 'error',
        message: parsed.message,
      }];
    }

    const built = buildAstDiagnostics(parsed as CircuitNode);
    return built.diagnostics.map(d => ({
      from: d.startOffset,
      to: Math.max(d.endOffset, d.startOffset + 1),
      severity: 'error' as const,
      message: d.issue.message,
    }));
  });
}

function dslCompletions(context: CompletionContext, getAst: () => CircuitNode): CompletionResult | null {
  const word = context.matchBefore(/(?:Pdw|Ws|Wo|CC|HN|[RCGLQWG])?/);
  if (!word || word.from === word.to) return null;

  const partial = word.text;
  const options = ELEMENT_CODES
    .filter(code => code.startsWith(partial))
    .map(code => {
      const kind = elementKindFromCode(code);
      const nextId = kind != null ? generateNextElementId(getAst(), kind) : 0;
      const template = paramTemplate(nParamsFromCode(code));
      const label = `${code}${nextId}${template}`;
      return {
        label,
        type: 'keyword' as const,
        apply: label,
      };
    });

  if (options.length === 0) return null;
  return { from: word.from, options, validFor: /^(?:Pdw|Ws|Wo|CC|HN|[RCGLQWG]\d*)$/ };
}

function paramTabKeymap(getAst: () => CircuitNode): Extension {
  return keymap.of([{
    key: 'Tab',
    run(view) {
      const pos = view.state.selection.main.head;
      const text = view.state.doc.toString();
      const before = text.slice(0, pos);
      const match = before.match(/(Pdw|Ws|Wo|CC|HN|[RCGLQWG])(\d+)$/);
      if (!match) return false;

      const code = match[1];
      const n = nParamsFromCode(code);
      const template = paramTemplate(n);
      const insert = template.startsWith('{') ? template : `{${template}}`;
      const cursorPos = pos + 1;

      view.dispatch({
        changes: { from: pos, insert },
        selection: { anchor: cursorPos },
      });
      return true;
    },
  }]);
}

export function createDslCodeMirror(options: DslCodeMirrorOptions): DslCodeMirrorHandle {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let suppressChange = false;

  const extensions: Extension[] = [
    history(),
    drawSelection(),
    highlightActiveLine(),
    lintGutter(),
    createDslLinter(),
    autocompletion({
      override: [ctx => dslCompletions(ctx, options.getAst)],
    }),
    paramTabKeymap(options.getAst),
    keymap.of([...defaultKeymap, ...historyKeymap, ...completionKeymap]),
    placeholder('R0-p(R1,C1{1e-9})'),
    EditorView.updateListener.of(update => {
      if (!update.docChanged || suppressChange) return;
      const value = update.state.doc.toString();
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        options.onChange(value);
        const parsed = parseBoukamp(value);
        if (!('type' in parsed) || (parsed.type !== 'lex' && parsed.type !== 'parse')) {
          const built = buildAstDiagnostics(parsed as CircuitNode);
          options.onDiagnostics?.(built.diagnostics);
        }
      }, 150);
    }),
    EditorView.theme({
      '&': {
        fontSize: '13px',
        fontFamily: 'var(--ce-font-mono, ui-monospace, monospace)',
        border: '1px solid var(--ce-border, #ccc)',
        borderRadius: '6px',
        backgroundColor: 'var(--ce-bg, #fff)',
      },
      '.cm-content': {
        minHeight: '55px',
        padding: '8px',
        caretColor: 'var(--ce-accent, #3b82f6)',
      },
      '.cm-gutters': {
        display: 'none',
      },
      '.cm-activeLine': {
        backgroundColor: 'transparent',
      },
      '&.cm-focused': {
        outline: 'none',
        borderColor: 'var(--ce-accent, #3b82f6)',
        boxShadow: '0 0 0 3px var(--ce-accent-alpha, rgba(59,130,246,.2))',
      },
    }),
  ];

  const state = EditorState.create({
    doc: options.initialValue,
    extensions,
  });

  const view = new EditorView({ state, parent: options.parent });

  return {
    setValue(text: string) {
      suppressChange = true;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text },
      });
      suppressChange = false;
    },
    getValue() {
      return view.state.doc.toString();
    },
    destroy() {
      if (debounceTimer) clearTimeout(debounceTimer);
      view.destroy();
    },
    focus() {
      view.focus();
    },
  };
}
