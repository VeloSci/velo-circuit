export type DslCompletionKind =
  | 'seriesElement'
  | 'parallelElement'
  | 'elementPrefix'
  | 'paramBlock'
  | 'afterElement'
  | 'parallelComma'
  | 'parallelClose'
  | 'parallelCommaOrClose'
  | 'none';

export interface DslCompletionContext {
  kind: DslCompletionKind;
  from: number;
  to: number;
  partial?: string;
}

const ELEMENT_PREFIX_RE = /(?:Pdw|Ws|Wo|CC|HN|[RCGLQWG])$/;
const COMPLETE_ELEMENT_RE = /(?:Pdw|Ws|Wo|CC|HN|[RCGLQWG])\d+(?:\{[^}]*\})?\s*$/;

interface ParallelAtCursor {
  inner: string;
  branches: string[];
  lastBranchComplete: boolean;
}

function splitTopLevelComma(s: string): string[] {
  const parts: string[] = [];
  let cur = '';
  let brace = 0;
  for (const ch of s) {
    if (ch === '{') brace++;
    else if (ch === '}') brace--;
    else if (ch === ',' && brace === 0) {
      parts.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  parts.push(cur);
  return parts;
}

/** Innermost `p(` whose closing `)` is not yet seen before `pos`. */
function findParallelAt(before: string): ParallelAtCursor | null {
  let parenDepth = 0;
  let parallelOpen = -1;

  for (let i = 0; i < before.length; i++) {
    const ch = before[i];
    if (ch === '(' && i > 0 && before[i - 1] === 'p' && parenDepth === 0) {
      parallelOpen = i + 1;
      parenDepth = 1;
      continue;
    }
    if (parallelOpen < 0) continue;
    if (ch === '(') parenDepth++;
    else if (ch === ')') {
      parenDepth--;
      if (parenDepth === 0) {
        parallelOpen = -1;
      }
    }
  }

  if (parallelOpen < 0) return null;

  const inner = before.slice(parallelOpen);
  const branches = splitTopLevelComma(inner);
  const last = branches[branches.length - 1] ?? '';
  const lastBranchComplete = COMPLETE_ELEMENT_RE.test(last.trim());

  return { inner, branches, lastBranchComplete };
}

function seriesSuffix(before: string): string {
  const trimmed = before.replace(/\s+$/, '');
  if (trimmed.endsWith('-')) return 'dash';
  if (trimmed.endsWith('(') && /p\(\s*$/.test(trimmed)) return 'open';
  if (trimmed.endsWith(',')) return 'comma';
  if (trimmed.endsWith(')')) return 'close';
  if (trimmed.endsWith('}')) return 'afterBrace';
  if (COMPLETE_ELEMENT_RE.test(trimmed)) return 'afterElement';
  return 'other';
}

/**
 * Detect completions at any cursor index inside the DSL string.
 */
export function detectDslCompletionContext(text: string, pos: number): DslCompletionContext {
  const before = text.slice(0, pos);
  const after = text.slice(pos);

  if (/\{\s*[^}]*$/.test(before)) {
    const open = before.lastIndexOf('{');
    return { kind: 'paramBlock', from: open + 1, to: pos };
  }

  const parallel = findParallelAt(before);
  if (parallel) {
    const suffix = before.slice(before.length - 20).replace(/\s+$/, '');
    const atComma = /,\s*$/.test(before);
    const atOpen = /p\(\s*$/.test(before.replace(/\s+$/, ''));

    if (atOpen || atComma || !parallel.lastBranchComplete) {
      const prefixMatch = before.match(ELEMENT_PREFIX_RE);
      if (prefixMatch) {
        return {
          kind: 'elementPrefix',
          from: pos - prefixMatch[0].length,
          to: pos,
          partial: prefixMatch[0],
        };
      }
      return { kind: 'parallelElement', from: pos, to: pos };
    }

    const completeBranches = parallel.branches.filter(b => COMPLETE_ELEMENT_RE.test(b.trim())).length;
    if (completeBranches >= 2) {
      return { kind: 'parallelClose', from: pos, to: pos };
    }
    if (completeBranches === 1 && parallel.lastBranchComplete) {
      return { kind: 'parallelComma', from: pos, to: pos };
    }
    return { kind: 'parallelElement', from: pos, to: pos };
  }

  const suffix = seriesSuffix(before);

  if (suffix === 'afterBrace' || suffix === 'afterElement') {
    if (suffix === 'afterBrace' && /^\s*[\),]/.test(after)) {
      const prefixMatch = before.match(ELEMENT_PREFIX_RE);
      if (prefixMatch) {
        return {
          kind: 'elementPrefix',
          from: pos - prefixMatch[0].length,
          to: pos,
          partial: prefixMatch[0],
        };
      }
    }
    return { kind: 'afterElement', from: pos, to: pos };
  }

  if (suffix === 'dash' || before.trim().length === 0) {
    return { kind: 'seriesElement', from: pos, to: pos };
  }

  if (suffix === 'comma' || suffix === 'open') {
    const prefixMatch = before.match(ELEMENT_PREFIX_RE);
    if (prefixMatch) {
      return {
        kind: 'elementPrefix',
        from: pos - prefixMatch[0].length,
        to: pos,
        partial: prefixMatch[0],
      };
    }
    return { kind: 'parallelElement', from: pos, to: pos };
  }

  if (suffix === 'close') {
    return { kind: 'afterElement', from: pos, to: pos };
  }

  const prefixMatch = before.match(ELEMENT_PREFIX_RE);
  if (prefixMatch) {
    return {
      kind: 'elementPrefix',
      from: pos - prefixMatch[0].length,
      to: pos,
      partial: prefixMatch[0],
    };
  }

  if (/\}\s*$/.test(before)) {
    return { kind: 'afterElement', from: pos, to: pos };
  }

  return { kind: 'none', from: pos, to: pos };
}
