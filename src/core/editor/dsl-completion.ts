import type { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import type { CircuitNode } from '../domain/circuit.js';
import { ELEMENT_KINDS, nParams } from '../domain/circuit.js';
import { generateNextElementId } from './commands-builder.js';
import { detectDslCompletionContext, type DslCompletionContext } from './dsl-completion-context.js';
import { elementKindFromCode } from './element-symbol-icon.js';

/** Canonical catalog order: R through HN (longest codes first for matching). */
export const ELEMENT_CODES_ORDERED = ['Pdw', 'Ws', 'Wo', 'CC', 'HN', 'R', 'C', 'L', 'Q', 'W', 'G'] as const;

export interface DslCompletion extends Completion {
  kindCode?: string;
}

function paramTemplate(n: number): string {
  if (n <= 1) return '{}';
  return `{${','.repeat(n - 1)}}`;
}

function nParamsFromCode(code: string): number {
  const kind = elementKindFromCode(code);
  return kind ? nParams(kind) : 1;
}

function safeGetAst(getAst: () => CircuitNode | null): CircuitNode {
  try {
    const ast = getAst();
    if (ast) return ast;
  } catch {
    /* fall through */
  }
  return { type: 'series', children: [] };
}

function buildElementOption(
  code: string,
  getAst: () => CircuitNode | null,
  boost = 1,
): DslCompletion {
  const kind = elementKindFromCode(code);
  const def = kind != null ? ELEMENT_KINDS.get(kind) : undefined;
  const nextId = kind != null ? generateNextElementId(safeGetAst(getAst), kind) : 0;
  const template = paramTemplate(nParamsFromCode(code));
  const label = `${code}${nextId}${template}`;
  const detail = def?.label ?? code;
  const info = def?.params.map(p => p.title).join('\n') ?? '';

  return {
    label,
    displayLabel: `${code} — ${detail}`,
    detail,
    info,
    type: 'text',
    kindCode: code,
    apply: label,
    boost,
  };
}

function filterByPrefix(codes: readonly string[], partial?: string): string[] {
  if (!partial) return [...codes];
  return codes.filter(c => c.startsWith(partial));
}

function elementCompletions(
  ctx: DslCompletionContext,
  getAst: () => CircuitNode | null,
  explicit: boolean,
): DslCompletion[] {
  const codes = filterByPrefix(ELEMENT_CODES_ORDERED, ctx.partial);
  if (codes.length === 0 && !explicit) return [];
  const list = codes.length > 0 ? codes : [...ELEMENT_CODES_ORDERED];
  return list.map(code => buildElementOption(code, getAst, 1));
}

/** After a finished element (`}`): series or parallel first. */
function afterElementCompletions(): DslCompletion[] {
  return [
    {
      label: '-',
      displayLabel: 'Series —',
      detail: 'Connect next element in series',
      type: 'text',
      apply: '-',
      boost: 100,
    },
    {
      label: 'p(',
      displayLabel: 'Parallel p(…)',
      detail: 'Start parallel group',
      type: 'text',
      apply: 'p(',
      boost: 99,
    },
  ];
}

function parallelCommaCompletion(): DslCompletion[] {
  return [
    {
      label: ',',
      displayLabel: 'Next branch (,)',
      detail: 'Add second parallel element',
      type: 'text',
      apply: ',',
      boost: 100,
    },
    {
      label: ')',
      displayLabel: 'Close )',
      detail: 'Close parallel group',
      type: 'text',
      apply: ')',
      boost: 85,
    },
  ];
}

function parallelCloseCompletion(): DslCompletion[] {
  return [
    {
      label: ')',
      displayLabel: 'Close )',
      detail: 'Close parallel group',
      type: 'text',
      apply: ')',
      boost: 100,
    },
    {
      label: ',',
      displayLabel: 'Another branch (,)',
      detail: 'Add another parallel element',
      type: 'text',
      apply: ',',
      boost: 80,
    },
  ];
}

function paramBlockCompletion(ctx: DslCompletionContext, text: string, pos: number): DslCompletion[] {
  const before = text.slice(0, pos);
  const elMatch = before.match(/(Pdw|Ws|Wo|CC|HN|[RCGLQWG])(\d+)\s*\{\s*[^}]*$/);
  if (!elMatch) {
    return [{ label: '{}', displayLabel: 'Parameter block', detail: '{value}', type: 'text', apply: '{}' }];
  }
  const n = nParamsFromCode(elMatch[1]);
  const template = paramTemplate(n);
  return [{
    label: template,
    displayLabel: `Parameters (${n})`,
    detail: template,
    type: 'text',
    apply: template.slice(1, -1) || '',
  }];
}

export function buildCompletionsForContext(
  ctx: DslCompletionContext,
  text: string,
  pos: number,
  getAst: () => CircuitNode | null,
  explicit: boolean,
): DslCompletion[] {
  switch (ctx.kind) {
    case 'afterElement':
      return afterElementCompletions();
    case 'parallelComma':
      return [
        ...parallelCommaCompletion(),
        ...elementCompletions({ ...ctx, kind: 'parallelElement' }, getAst, true),
      ];
    case 'parallelClose':
      return [
        ...parallelCloseCompletion(),
        ...elementCompletions({ ...ctx, kind: 'parallelElement' }, getAst, true),
      ];
    case 'seriesElement':
    case 'parallelElement':
      return elementCompletions(ctx, getAst, true);
    case 'elementPrefix':
      return elementCompletions(ctx, getAst, explicit);
    case 'paramBlock':
      return paramBlockCompletion(ctx, text, pos);
    default:
      return [];
  }
}

/** Ctrl+Space anywhere in the DSL — infer context when automatic detection returns none. */
export function mergeExplicitFallback(text: string, pos: number): DslCompletionContext {
  const before = text.slice(0, pos);

  const word = before.match(/(?:Pdw|Ws|Wo|CC|HN|[RCGLQWG]\d*)$/)?.[0] ?? '';
  if (word.length > 0) {
    return {
      kind: 'elementPrefix',
      from: pos - word.length,
      to: pos,
      partial: word.replace(/\d+$/, '') || word,
    };
  }

  if (/\{\s*[^}]*$/.test(before)) {
    const open = before.lastIndexOf('{');
    return { kind: 'paramBlock', from: open + 1, to: pos };
  }

  const trimmed = before.replace(/\s+$/, '');
  if (COMPLETE_ELEMENT_SUFFIX_RE.test(trimmed)) {
    return { kind: 'afterElement', from: pos, to: pos };
  }
  if (trimmed.endsWith('-')) {
    return { kind: 'seriesElement', from: pos, to: pos };
  }
  if (/p\(\s*$/.test(trimmed) || /,\s*$/.test(before)) {
    return { kind: 'parallelElement', from: pos, to: pos };
  }

  return { kind: 'seriesElement', from: pos, to: pos };
}

const COMPLETE_ELEMENT_SUFFIX_RE =
  /(?:Pdw|Ws|Wo|CC|HN|[RCGLQWG])\d+(?:\{[^}]*\})?\s*$/;

export function dslCompletionSource(
  getAst: () => CircuitNode | null,
): (context: CompletionContext) => CompletionResult | null {
  return (context: CompletionContext): CompletionResult | null => {
    const text = context.state.doc.toString();
    const pos = context.pos;
    const explicit = !!context.explicit;

    let dslCtx = detectDslCompletionContext(text, pos);
    if (explicit && dslCtx.kind === 'none') {
      dslCtx = mergeExplicitFallback(text, pos);
    }

    if (dslCtx.kind === 'none' && !explicit) {
      const word = context.matchBefore(/(?:Pdw|Ws|Wo|CC|HN|[RCGLQWG])?/);
      if (!word || word.from === word.to) return null;
      dslCtx = {
        kind: 'elementPrefix',
        from: word.from,
        to: word.to,
        partial: text.slice(word.from, word.to),
      };
    }

    if (dslCtx.kind === 'elementPrefix' && !explicit) {
      const partial = dslCtx.partial ?? '';
      if (partial.length === 0) return null;
    }

    const options = buildCompletionsForContext(dslCtx, text, pos, getAst, explicit);
    if (options.length === 0) return null;

    options.sort((a, b) => (b.boost ?? 0) - (a.boost ?? 0));

    const from = dslCtx.kind === 'elementPrefix' ? dslCtx.from : pos;
    const to = dslCtx.kind === 'elementPrefix' ? dslCtx.to : pos;

    return {
      from,
      to,
      options,
      validFor: /^(?:Pdw|Ws|Wo|CC|HN|[RCGLQWG]\d*|[\-,()]|\{.*)?$/,
    };
  };
}
