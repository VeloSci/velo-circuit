import type { CircuitNode } from '../domain/circuit.js';
import type { Diagnostic } from '../domain/diagnostics.js';
import type { ValidationIssue } from '../domain/validation.js';
import { parseBoukamp, type ParseResult } from './parser.js';
import { missingToIssues, issuesToDiagnostics } from './diagnostics-builder.js';
import { resolveCircuitParams } from './resolve-params.js';
import { validate, type ValidateOptions } from './validate.js';

export interface EditorLintDiagnostic {
  from: number;
  to: number;
  severity: 'error';
  message: string;
}

export interface EditorLintResult {
  parse: ParseResult | null;
  diagnostics: EditorLintDiagnostic[];
}

/** Fast path: parse errors only (lex/parse). */
export function lintParseErrors(text: string): EditorLintResult {
  if (!text.trim()) {
    return { parse: null, diagnostics: [] };
  }

  const parsed = parseBoukamp(text);
  if ('type' in parsed && (parsed.type === 'lex' || parsed.type === 'parse')) {
    const from = parsed.position;
    return {
      parse: parsed,
      diagnostics: [{
        from,
        to: Math.min(from + 1, text.length),
        severity: 'error',
        message: parsed.message,
      }],
    };
  }

  return { parse: parsed as CircuitNode, diagnostics: [] };
}

/** Cold path: missing params + lightweight structural checks (no DC/reactive scans). */
export function lintEditorAst(ast: CircuitNode): EditorLintDiagnostic[] {
  const options: ValidateOptions = { mode: 'editor' };
  const base = validate(ast, options);
  const resolved = resolveCircuitParams(ast, {});
  const missingIssues = resolved.ok ? [] : missingToIssues(resolved.missing);
  const issues: ValidationIssue[] = [...base.issues, ...missingIssues];
  const editorDiagnostics = issuesToDiagnostics(ast, issues);
  return editorDiagnostics.map(d => ({
    from: d.startOffset,
    to: Math.max(d.endOffset, d.startOffset + 1),
    severity: 'error' as const,
    message: d.issue.message,
  }));
}

/** Combined lint for one document snapshot (single parse). */
export function lintDslDocument(text: string): EditorLintResult {
  const hot = lintParseErrors(text);
  if (hot.parse == null || ('type' in hot.parse)) {
    return hot;
  }
  const cold = lintEditorAst(hot.parse);
  return {
    parse: hot.parse,
    diagnostics: [...hot.diagnostics, ...cold],
  };
}
