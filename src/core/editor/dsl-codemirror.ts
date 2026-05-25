import { EditorState, Compartment, ChangeSet, type Extension } from '@codemirror/state';
import {
  EditorView,
  keymap,
  placeholder,
  drawSelection,
  highlightActiveLine,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { linter, type Diagnostic as LintDiagnostic } from '@codemirror/lint';
import {
  autocompletion,
  completionKeymap,
  startCompletion,
} from '@codemirror/autocomplete';
import type { Diagnostic } from '../domain/diagnostics.js';
import { lintDslDocument } from '../parser-bridge/editor-validate.js';
import { dslCompletionSource, type DslCompletion } from './dsl-completion.js';
import { buildAutocompleteThemeExtension } from './dsl-autocomplete-theme.js';
import { createElementSymbolIcon, clearElementSymbolIconCache, elementKindFromCode } from './element-symbol-icon.js';
import { nParams } from '../domain/circuit.js';
import type { ThemeMode } from '../render-svg/themes.js';
import type {
  DslCodeMirrorOptions,
  DslCodeMirrorHandle,
  DslCodeMirrorTheme,
} from './dsl-editor-types.js';

export type { DslCodeMirrorOptions, DslCodeMirrorHandle, DslCodeMirrorTheme } from './dsl-editor-types.js';

const LINT_DELAY_MS = 250;

function buildThemeExtension(theme?: DslCodeMirrorTheme): Extension {
  const bg = theme?.bg ?? 'var(--ce-bg, #ffffff)';
  const text = theme?.text ?? 'var(--ce-text, #1e293b)';
  const border = theme?.border ?? 'var(--ce-border, #e2e8f0)';
  const accent = theme?.accent ?? 'var(--ce-accent, #3b82f6)';
  const accentAlpha = theme?.accentAlpha ?? 'var(--ce-accent-alpha, rgba(59,130,246,0.2))';
  const minH = theme?.minHeight ?? '72px';
  const mono = theme?.fontMono ?? 'var(--ce-font-mono, ui-monospace, monospace)';
  const selection = theme?.selection ?? 'var(--ce-accent-alpha, rgba(59,130,246,0.25))';
  const activeLine = theme?.activeLine ?? 'var(--ce-hover, rgba(59,130,246,0.06))';

  return EditorView.theme({
    '&': {
      fontSize: '13px',
      fontFamily: mono,
      border: `1px solid ${border}`,
      borderRadius: '6px',
      backgroundColor: bg,
      color: text,
    },
    '.cm-scroller': {
      minHeight: minH,
      overflow: 'auto',
    },
    '.cm-content': {
      minHeight: minH,
      padding: '8px 10px',
      color: text,
      caretColor: accent,
      fontFamily: mono,
    },
    '.cm-line': {
      padding: '0 1px',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftWidth: '2px',
      borderLeftColor: accent,
      marginLeft: '-1px',
    },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
      backgroundColor: `${selection} !important`,
    },
    '.cm-activeLine': {
      backgroundColor: activeLine,
    },
    '.cm-gutters': {
      display: 'none',
    },
    '.cm-placeholder': {
      color: 'var(--ce-text-secondary, #94a3b8)',
      fontStyle: 'italic',
    },
    '&.cm-focused': {
      outline: 'none',
      borderColor: accent,
      boxShadow: `0 0 0 3px ${accentAlpha}`,
    },
  });
}

function createDslLinter(onDiagnostics?: (diagnostics: Diagnostic[]) => void): Extension {
  return linter(view => {
    const text = view.state.doc.toString();
    const result = lintDslDocument(text);
    if (onDiagnostics && result.parse && !('type' in result.parse)) {
      onDiagnostics(result.diagnostics.map(d => ({
        id: `lint-${d.from}`,
        issue: { type: 'error' as const, kind: 'invalid-parameters' as const, message: d.message },
        startOffset: d.from,
        endOffset: d.to,
      })));
    }
    return result.diagnostics.map(d => ({
      from: d.from,
      to: d.to,
      severity: d.severity,
      message: d.message,
    })) satisfies readonly LintDiagnostic[];
  }, { delay: LINT_DELAY_MS });
}

function paramTabKeymap(getAst: DslCodeMirrorOptions['getAst']): Extension {
  return keymap.of([{
    key: 'Tab',
    run(view) {
      const pos = view.state.selection.main.head;
      const text = view.state.doc.toString();
      const before = text.slice(0, pos);
      const match = before.match(/(Pdw|Ws|Wo|CC|HN|[RCGLQWG])(\d+)$/);
      if (!match) return false;

      const code = match[1];
      const kind = elementKindFromCode(code);
      const n = kind ? nParams(kind) : 1;
      const template = n <= 1 ? '{}' : `{${','.repeat(n - 1)}}`;
      const insert = template;
      const cursorPos = pos + 1;

      view.dispatch({
        changes: { from: pos, insert },
        selection: { anchor: cursorPos },
      });
      return true;
    },
  }]);
}

function buildAutocompletion(themeMode: ThemeMode, getAst: DslCodeMirrorOptions['getAst']): Extension {
  return autocompletion({
    override: [dslCompletionSource(getAst)],
    activateOnTyping: true,
    maxRenderedOptions: 20,
    addToOptions: [{
      position: 0,
      render(completion) {
        const c = completion as DslCompletion;
        if (!c.kindCode) return null;
        const kind = elementKindFromCode(c.kindCode);
        if (!kind) return null;
        return createElementSymbolIcon(kind, themeMode);
      },
    }],
  });
}

export function createDslCodeMirror(options: DslCodeMirrorOptions): DslCodeMirrorHandle {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let suppressChange = false;
  const themeMode: ThemeMode = options.themeMode ?? 'light';

  const readOnlyCompartment = new Compartment();
  const editableCompartment = new Compartment();

  const extensions: Extension[] = [
    history(),
    drawSelection(),
    highlightActiveLine(),
    EditorView.lineWrapping,
    EditorView.contentAttributes.of({
      spellcheck: 'false',
      autocorrect: 'off',
      autocapitalize: 'off',
    }),
    createDslLinter(options.onDiagnostics),
    buildAutocompletion(themeMode, options.getAst),
    paramTabKeymap(options.getAst),
    keymap.of([
      { key: 'Ctrl-Space', run: startCompletion },
      ...defaultKeymap,
      ...historyKeymap,
      ...completionKeymap,
    ]),
    placeholder(options.placeholder ?? 'R0-p(R1{100},C1{1e-5})'),
    EditorView.updateListener.of(update => {
      if (!update.docChanged || suppressChange) return;
      const value = update.state.doc.toString();
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        options.onChange(value);
      }, 150);
    }),
    buildThemeExtension(options.theme),
    buildAutocompleteThemeExtension(options.theme, themeMode),
    readOnlyCompartment.of(EditorState.readOnly.of(!!options.readOnly)),
    editableCompartment.of(EditorView.editable.of(!options.readOnly)),
  ];

  const state = EditorState.create({
    doc: options.initialValue,
    extensions,
  });

  const view = new EditorView({ state, parent: options.parent });

  return {
    setValue(text: string) {
      const doc = view.state.doc;
      const current = doc.toString();
      if (text === current) return;

      const sel = view.state.selection.main;
      const changes = ChangeSet.of([{ from: 0, to: doc.length, insert: text }], doc.length);
      const anchor = changes.mapPos(sel.anchor, 1);
      const head = changes.mapPos(sel.head, 1);

      suppressChange = true;
      view.dispatch({
        changes,
        selection: { anchor, head },
        scrollIntoView: true,
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
    hasFocus() {
      return view.hasFocus;
    },
    setReadOnly(readOnly: boolean) {
      view.dispatch({
        effects: [
          readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly)),
          editableCompartment.reconfigure(EditorView.editable.of(!readOnly)),
        ],
      });
    },
  };
}

export { clearElementSymbolIconCache };
